import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Sale,
  SaleItem,
  SaleReturn,
  SaleReturnItem,
  ReturnReason,
  PaymentMethod,
  PaymentStatus,
  Product,
  Customer,
  Branch,
  Profile,
  ReceiptSettings,
} from '@/types/database';
import { adjustStock } from './inventoryService';
import { updateCustomerBalance, recordCustomerSale, recordCustomerRefund } from './customerService';
import { formatDateTime } from '@/lib/format';

export const DEMO_SALES_KEY = 'verdant_demo_sales_v2';
export const DEMO_HELD_SALES_KEY = 'verdant_demo_held_sales_v1';
export const DEMO_RECEIPT_SETTINGS_KEY = 'verdant_receipt_settings_v1';

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  header_title: '',
  subtitle: 'Quality Retail & Fresh Goods',
  footer_message: 'Thank you for your business. We appreciate your patronage!',
  return_policy: 'Goods can be exchanged or returned within 7 days with valid original receipt.',
  default_format: '80mm',
  show_logo: true,
  show_tax_breakdown: true,
  show_cashier: true,
  show_barcode: true,
  show_customer_info: true,
};

export interface CartItem {
  id: string; // unique item row ID in cart
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number; // per unit discount
  lineSubtotal: number; // quantity * unitPrice
  lineDiscount: number; // quantity * discountAmount
  lineTotal: number; // lineSubtotal - lineDiscount
  stockAvailable: number;
}

export interface SaleDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
  reason?: string;
}

export interface SplitPaymentDetail {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface ProcessSaleInput {
  businessId: string;
  branchId: string;
  cashierId?: string | null;
  cashierProfile?: Profile | null;
  branch?: Branch | null;
  customerId?: string | null;
  customer?: Customer | null;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  saleDiscount?: SaleDiscount;
  taxRate: number; // e.g. 18
  taxAmount: number;
  taxIncluded?: boolean;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  splits?: SplitPaymentDetail[];
  notes?: string | null;
  receiptNumber?: string;
  dueDate?: string | null;
}

export interface HeldSale {
  id: string;
  businessId: string;
  branchId: string;
  heldAt: string;
  note?: string;
  customer: Customer | null;
  items: CartItem[];
  saleDiscount: SaleDiscount;
  taxRate: number;
  subtotal: number;
  totalAmount: number;
}

export interface ReturnItemInput {
  saleItemId: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  restock: boolean;
  reason: ReturnReason;
  notes?: string | null;
}

export interface ProcessReturnInput {
  saleId: string;
  businessId: string;
  branchId: string;
  processedById?: string | null;
  processedByProfile?: Profile | null;
  refundMethod: PaymentMethod | 'store_credit';
  reason: string;
  notes?: string | null;
  items: ReturnItemInput[];
}

export type SalesDatePreset = 'all' | 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'custom';

export interface SalesFilterOptions {
  businessId?: string;
  search?: string;
  branchId?: string | null;
  cashierId?: string | null;
  customerId?: string | null;
  paymentMethod?: PaymentMethod | 'all';
  status?: PaymentStatus | 'all';
  datePreset?: SalesDatePreset;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'total_amount' | 'receipt_number';
  sortOrder?: 'asc' | 'desc';
}

export interface SalesStats {
  totalGrossSales: number;
  totalNetSales: number;
  totalRefunds: number;
  totalTransactions: number;
  completedCount: number;
  partiallyRefundedCount: number;
  refundedCount: number;
  cancelledCount: number;
  averageOrderValue: number;
}

export interface SalesResponse {
  sales: Sale[];
  totalCount: number;
  stats: SalesStats;
}

export function playPosBeep(type: 'success' | 'warning' | 'error' = 'success'): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08); // E6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
}

export function generateReceiptNumber(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}${month}${day}-${rand}`;
}

export function generateReturnNumber(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RET-${year}${month}${day}-${rand}`;
}

export function getStoredSales(): Sale[] {
  try {
    const raw = localStorage.getItem(DEMO_SALES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading stored sales:', err);
  }

  const initial = createInitialSalesData();
  setStoredSales(initial);
  return initial;
}

function createInitialSalesData(): Sale[] {
  const now = new Date();
  const today1 = new Date(now.getTime() - 1000 * 60 * 25).toISOString();
  const today2 = new Date(now.getTime() - 1000 * 60 * 95).toISOString();
  const today3 = new Date(now.getTime() - 1000 * 60 * 210).toISOString();
  const yesterday1 = new Date(now.getTime() - 1000 * 60 * 60 * 22).toISOString();
  const yesterday2 = new Date(now.getTime() - 1000 * 60 * 60 * 28).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 70).toISOString();
  const fiveDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 120).toISOString();

  return [
    {
      id: 'sale-101',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: 'cust-1',
      receipt_number: 'REC-20260828-8812',
      subtotal: 124000,
      tax_amount: 22320,
      discount_amount: 5000,
      total_amount: 141320,
      paid_amount: 141320,
      due_amount: 0,
      refunded_amount: 0,
      payment_method: 'mobile_money',
      payment_status: 'completed',
      due_date: null,
      notes: 'M-Pesa reference: MP8812903X',
      created_at: today1,
      updated_at: today1,
      branch: {
        id: 'branch-downtown',
        business_id: 'demo-biz-1',
        name: 'Bujumbura Flagship (Rohero)',
        address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
        phone: '+257 22 25 1200',
        email: 'bujumbura@babaspos.bi',
        manager_id: 'demo-user-1',
        is_active: true,
        created_at: today1,
        updated_at: today1,
      },
      customer: {
        id: 'cust-1',
        business_id: 'demo-biz-1',
        name: 'Fatma Juma',
        email: 'fatma.juma@gmail.com',
        phone: '+257 754 112 233',
        address: 'Rue de l\'Indépendance, Bujumbura, Burundi',
        credit_limit: 500000,
        current_balance: 0,
        created_at: today1,
        updated_at: today1,
      },
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: '+257 712 000 111',
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: today1,
        updated_at: today1,
      },
      items: [
        {
          id: 'item-101-1',
          sale_id: 'sale-101',
          product_id: 'prod-1',
          product_name: 'Organic Arabica Coffee Beans (1kg)',
          sku: 'COF-ARA-001',
          quantity: 3,
          unit_price: 32000,
          cost_price: 18000,
          discount_amount: 5000,
          tax_amount: 16380,
          total_price: 91000,
          created_at: today1,
        },
        {
          id: 'item-101-2',
          sale_id: 'sale-101',
          product_id: 'prod-5',
          product_name: 'Raw Pure Honey (500g Jar)',
          sku: 'HNY-RAW-005',
          quantity: 2,
          unit_price: 15000,
          cost_price: 8000,
          discount_amount: 0,
          tax_amount: 5400,
          total_price: 30000,
          created_at: today1,
        },
      ],
      returns: [],
    },
    {
      id: 'sale-102',
      business_id: 'demo-biz-1',
      branch_id: 'branch-masaki',
      cashier_id: 'demo-user-cashier-1',
      customer_id: 'cust-2',
      receipt_number: 'REC-20260828-5421',
      subtotal: 75000,
      tax_amount: 13500,
      discount_amount: 0,
      total_amount: 88500,
      paid_amount: 88500,
      due_amount: 0,
      refunded_amount: 0,
      payment_method: 'card',
      payment_status: 'completed',
      due_date: null,
      notes: 'Visa approval code: 994210',
      created_at: today2,
      updated_at: today2,
      branch: {
        id: 'branch-masaki',
        business_id: 'demo-biz-1',
        name: 'Rumonge Market Branch',
        address: 'Chaussee de la Corniche, Rumonge, Burundi',
        phone: '+257 22 35 4410',
        email: 'rumonge@babaspos.bi',
        manager_id: null,
        is_active: true,
        created_at: today2,
        updated_at: today2,
      },
      customer: {
        id: 'cust-2',
        business_id: 'demo-biz-1',
        name: 'John Mwangi',
        email: 'john.mwangi@safari.bi',
        phone: '+257 788 445 566',
        address: 'Chaussee de la Corniche, Rumonge, Burundi',
        credit_limit: 1000000,
        current_balance: 0,
        created_at: today2,
        updated_at: today2,
      },
      cashier: {
        id: 'demo-user-cashier-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-masaki',
        full_name: 'Brenda Kassim',
        phone: '+257 755 334 455',
        role_id: 'demo-role-cashier',
        is_active: true,
        created_at: today2,
        updated_at: today2,
      },
      items: [
        {
          id: 'item-102-1',
          sale_id: 'sale-102',
          product_id: 'prod-3',
          product_name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
          sku: 'POS-PPR-080',
          quantity: 1,
          unit_price: 75000,
          cost_price: 45000,
          discount_amount: 0,
          tax_amount: 13500,
          total_price: 75000,
          created_at: today2,
        },
      ],
      returns: [],
    },
    {
      id: 'sale-103',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: null,
      receipt_number: 'REC-20260828-3199',
      subtotal: 55500,
      tax_amount: 9990,
      discount_amount: 0,
      total_amount: 65490,
      paid_amount: 70000,
      due_amount: 0,
      refunded_amount: 0,
      payment_method: 'cash',
      payment_status: 'completed',
      due_date: null,
      notes: 'Change given: BIF 4,510',
      created_at: today3,
      updated_at: today3,
      branch: {
        id: 'branch-downtown',
        business_id: 'demo-biz-1',
        name: 'Bujumbura Flagship (Rohero)',
        address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
        phone: '+257 22 25 1200',
        email: 'bujumbura@babaspos.bi',
        manager_id: 'demo-user-1',
        is_active: true,
        created_at: today3,
        updated_at: today3,
      },
      customer: null,
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: '+257 712 000 111',
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: today3,
        updated_at: today3,
      },
      items: [
        {
          id: 'item-103-1',
          sale_id: 'sale-103',
          product_id: 'prod-2',
          product_name: 'African Spiced Chai Tea (500g)',
          sku: 'TEA-CHAI-002',
          quantity: 3,
          unit_price: 18500,
          cost_price: 9500,
          discount_amount: 0,
          tax_amount: 9990,
          total_price: 55500,
          created_at: today3,
        },
      ],
      returns: [],
    },
    {
      id: 'sale-104',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-cashier-2',
      customer_id: 'cust-3',
      receipt_number: 'REC-20260827-1090',
      subtotal: 185000,
      tax_amount: 33300,
      discount_amount: 15000,
      total_amount: 203300,
      paid_amount: 203300,
      due_amount: 0,
      refunded_amount: 37000,
      payment_method: 'mobile_money',
      payment_status: 'partially_refunded',
      due_date: null,
      notes: 'Customer returned 1 Chai Tea and 1 Honey',
      created_at: yesterday1,
      updated_at: yesterday1,
      branch: {
        id: 'branch-downtown',
        business_id: 'demo-biz-1',
        name: 'Bujumbura Flagship (Rohero)',
        address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
        phone: '+257 22 25 1200',
        email: 'bujumbura@babaspos.bi',
        manager_id: 'demo-user-1',
        is_active: true,
        created_at: yesterday1,
        updated_at: yesterday1,
      },
      customer: {
        id: 'cust-3',
        business_id: 'demo-biz-1',
        name: 'Neema Kimaro',
        email: 'neema.kimaro@outlook.com',
        phone: '+257 713 998 877',
        address: 'Mwai Kibaki Rd, Mikocheni',
        credit_limit: 350000,
        current_balance: 0,
        created_at: yesterday1,
        updated_at: yesterday1,
      },
      cashier: {
        id: 'demo-user-cashier-2',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Kelvin Nkurunziza',
        phone: '+257 766 889 900',
        role_id: 'demo-role-cashier',
        is_active: true,
        created_at: yesterday1,
        updated_at: yesterday1,
      },
      items: [
        {
          id: 'item-104-1',
          sale_id: 'sale-104',
          product_id: 'prod-1',
          product_name: 'Organic Arabica Coffee Beans (1kg)',
          sku: 'COF-ARA-001',
          quantity: 4,
          unit_price: 32000,
          cost_price: 18000,
          discount_amount: 10000,
          tax_amount: 21240,
          total_price: 118000,
          returned_quantity: 0,
          created_at: yesterday1,
        },
        {
          id: 'item-104-2',
          sale_id: 'sale-104',
          product_id: 'prod-2',
          product_name: 'African Spiced Chai Tea (500g)',
          sku: 'TEA-CHAI-002',
          quantity: 2,
          unit_price: 18500,
          cost_price: 9500,
          discount_amount: 0,
          tax_amount: 6660,
          total_price: 37000,
          returned_quantity: 1,
          created_at: yesterday1,
        },
        {
          id: 'item-104-3',
          sale_id: 'sale-104',
          product_id: 'prod-5',
          product_name: 'Raw Pure Honey (500g Jar)',
          sku: 'HNY-RAW-005',
          quantity: 2,
          unit_price: 15000,
          cost_price: 8000,
          discount_amount: 5000,
          tax_amount: 4500,
          total_price: 25000,
          returned_quantity: 1,
          created_at: yesterday1,
        },
      ],
      returns: [
        {
          id: 'ret-104-1',
          sale_id: 'sale-104',
          business_id: 'demo-biz-1',
          branch_id: 'branch-downtown',
          return_number: 'RET-20260827-9021',
          processed_by_id: 'demo-user-1',
          processed_by: {
            id: 'demo-user-1',
            business_id: 'demo-biz-1',
            branch_id: 'branch-downtown',
            full_name: 'Alex Rivera',
            phone: '+257 712 000 111',
            role_id: 'demo-role-owner',
            is_active: true,
            created_at: yesterday1,
            updated_at: yesterday1,
          },
          refund_amount: 37000,
          refund_method: 'mobile_money',
          reason: 'Customer bought incorrect flavour variant',
          notes: 'Items inspected and restocked in Aisle 1',
          created_at: yesterday1,
          items: [
            {
              id: 'ret-item-1',
              return_id: 'ret-104-1',
              sale_item_id: 'item-104-2',
              product_id: 'prod-2',
              product_name: 'African Spiced Chai Tea (500g)',
              sku: 'TEA-CHAI-002',
              quantity: 1,
              unit_price: 18500,
              refund_amount: 21830,
              restock: true,
              reason: 'wrong_item',
              notes: 'Sealed box, restocked',
              created_at: yesterday1,
            },
            {
              id: 'ret-item-2',
              return_id: 'ret-104-1',
              sale_item_id: 'item-104-3',
              product_id: 'prod-5',
              product_name: 'Raw Pure Honey (500g Jar)',
              sku: 'HNY-RAW-005',
              quantity: 1,
              unit_price: 15000,
              refund_amount: 15170,
              restock: true,
              reason: 'customer_change',
              notes: 'Unopened jar',
              created_at: yesterday1,
            },
          ],
        },
      ],
    },
    {
      id: 'sale-105',
      business_id: 'demo-biz-1',
      branch_id: 'branch-masaki',
      cashier_id: 'demo-user-cashier-1',
      customer_id: 'cust-4',
      receipt_number: 'REC-20260827-4001',
      subtotal: 120000,
      tax_amount: 21600,
      discount_amount: 0,
      total_amount: 141600,
      paid_amount: 0,
      due_amount: 141600,
      refunded_amount: 0,
      payment_method: 'credit',
      payment_status: 'pending',
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      notes: 'Net 14 days corporate invoice for trading supplies',
      created_at: yesterday2,
      updated_at: yesterday2,
      branch: {
        id: 'branch-masaki',
        business_id: 'demo-biz-1',
        name: 'Rumonge Market Branch',
        address: 'Chaussee de la Corniche, Rumonge, Burundi',
        phone: '+257 22 35 4410',
        email: 'rumonge@babaspos.bi',
        manager_id: null,
        is_active: true,
        created_at: yesterday2,
        updated_at: yesterday2,
      },
      customer: {
        id: 'cust-4',
        business_id: 'demo-biz-1',
        name: 'Hassan Rashid',
        email: 'hrashid@trading.bi',
        phone: '+257 767 334 455',
        address: 'Ali Hassan Mwinyi Rd, Upanga',
        credit_limit: 800000,
        current_balance: 141600,
        created_at: yesterday2,
        updated_at: yesterday2,
      },
      cashier: {
        id: 'demo-user-cashier-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-masaki',
        full_name: 'Brenda Kassim',
        phone: '+257 755 334 455',
        role_id: 'demo-role-cashier',
        is_active: true,
        created_at: yesterday2,
        updated_at: yesterday2,
      },
      items: [
        {
          id: 'item-105-1',
          sale_id: 'sale-105',
          product_id: 'prod-4',
          product_name: 'Wireless Bluetooth Barcode Scanner 2D',
          sku: 'POS-SCN-2DW',
          quantity: 1,
          unit_price: 120000,
          cost_price: 78000,
          discount_amount: 0,
          tax_amount: 21600,
          total_price: 120000,
          created_at: yesterday2,
        },
      ],
      returns: [],
    },
    {
      id: 'sale-106',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: 'cust-5',
      receipt_number: 'REC-20260825-7734',
      subtotal: 96000,
      tax_amount: 17280,
      discount_amount: 0,
      total_amount: 113280,
      paid_amount: 113280,
      due_amount: 0,
      refunded_amount: 113280,
      payment_method: 'card',
      payment_status: 'refunded',
      due_date: null,
      notes: 'Customer returned all 3 bags due to defective seal batch',
      created_at: threeDaysAgo,
      updated_at: threeDaysAgo,
      branch: {
        id: 'branch-downtown',
        business_id: 'demo-biz-1',
        name: 'Bujumbura Flagship (Rohero)',
        address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
        phone: '+257 22 25 1200',
        email: 'bujumbura@babaspos.bi',
        manager_id: 'demo-user-1',
        is_active: true,
        created_at: threeDaysAgo,
        updated_at: threeDaysAgo,
      },
      customer: {
        id: 'cust-5',
        business_id: 'demo-biz-1',
        name: 'Sarah Temba',
        email: 'sarah.temba@kilicoffee.com',
        phone: '+257 755 889 900',
        address: 'Njiro Block D, Arusha',
        credit_limit: 600000,
        current_balance: 0,
        created_at: threeDaysAgo,
        updated_at: threeDaysAgo,
      },
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: '+257 712 000 111',
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: threeDaysAgo,
        updated_at: threeDaysAgo,
      },
      items: [
        {
          id: 'item-106-1',
          sale_id: 'sale-106',
          product_id: 'prod-1',
          product_name: 'Organic Arabica Coffee Beans (1kg)',
          sku: 'COF-ARA-001',
          quantity: 3,
          unit_price: 32000,
          cost_price: 18000,
          discount_amount: 0,
          tax_amount: 17280,
          total_price: 96000,
          returned_quantity: 3,
          created_at: threeDaysAgo,
        },
      ],
      returns: [
        {
          id: 'ret-106-1',
          sale_id: 'sale-106',
          business_id: 'demo-biz-1',
          branch_id: 'branch-downtown',
          return_number: 'RET-20260825-1102',
          processed_by_id: 'demo-user-1',
          processed_by: {
            id: 'demo-user-1',
            business_id: 'demo-biz-1',
            branch_id: 'branch-downtown',
            full_name: 'Alex Rivera',
            phone: '+257 712 000 111',
            role_id: 'demo-role-owner',
            is_active: true,
            created_at: threeDaysAgo,
            updated_at: threeDaysAgo,
          },
          refund_amount: 113280,
          refund_method: 'card',
          reason: 'Defective heat seal packaging from supplier',
          notes: 'Marked as damaged write-off; returned to supplier batch audit',
          created_at: threeDaysAgo,
          items: [
            {
              id: 'ret-item-106-1',
              return_id: 'ret-106-1',
              sale_item_id: 'item-106-1',
              product_id: 'prod-1',
              product_name: 'Organic Arabica Coffee Beans (1kg)',
              sku: 'COF-ARA-001',
              quantity: 3,
              unit_price: 32000,
              refund_amount: 113280,
              restock: false,
              reason: 'defective',
              notes: 'Defective packaging',
              created_at: threeDaysAgo,
            },
          ],
        },
      ],
    },
    {
      id: 'sale-107',
      business_id: 'demo-biz-1',
      branch_id: 'branch-downtown',
      cashier_id: 'demo-user-1',
      customer_id: null,
      receipt_number: 'REC-20260823-9901',
      subtotal: 45000,
      tax_amount: 8100,
      discount_amount: 0,
      total_amount: 53100,
      paid_amount: 0,
      due_amount: 0,
      refunded_amount: 0,
      payment_method: 'cash',
      payment_status: 'cancelled',
      due_date: null,
      notes: 'Customer card declined twice and walked out | Cancelled: Cashier voided order',
      created_at: fiveDaysAgo,
      updated_at: fiveDaysAgo,
      branch: {
        id: 'branch-downtown',
        business_id: 'demo-biz-1',
        name: 'Bujumbura Flagship (Rohero)',
        address: 'Boulevard du 1er Novembre, Rohero, Bujumbura, Burundi',
        phone: '+257 22 25 1200',
        email: 'bujumbura@babaspos.bi',
        manager_id: 'demo-user-1',
        is_active: true,
        created_at: fiveDaysAgo,
        updated_at: fiveDaysAgo,
      },
      customer: null,
      cashier: {
        id: 'demo-user-1',
        business_id: 'demo-biz-1',
        branch_id: 'branch-downtown',
        full_name: 'Alex Rivera',
        phone: '+257 712 000 111',
        role_id: 'demo-role-owner',
        is_active: true,
        created_at: fiveDaysAgo,
        updated_at: fiveDaysAgo,
      },
      items: [
        {
          id: 'item-107-1',
          sale_id: 'sale-107',
          product_id: 'prod-5',
          product_name: 'Raw Pure Honey (500g Jar)',
          sku: 'HNY-RAW-005',
          quantity: 3,
          unit_price: 15000,
          cost_price: 8000,
          discount_amount: 0,
          tax_amount: 8100,
          total_price: 45000,
          created_at: fiveDaysAgo,
        },
      ],
      returns: [],
    },
  ];
}

export function setStoredSales(sales: Sale[]): void {
  localStorage.setItem(DEMO_SALES_KEY, JSON.stringify(sales));
}

// ----------------------------------------------------
// Receipt Settings
// ----------------------------------------------------
export function getReceiptSettings(businessId?: string): ReceiptSettings {
  try {
    const key = businessId ? `${DEMO_RECEIPT_SETTINGS_KEY}_${businessId}` : DEMO_RECEIPT_SETTINGS_KEY;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RECEIPT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error getting receipt settings:', err);
  }
  return DEFAULT_RECEIPT_SETTINGS;
}

export function saveReceiptSettings(settings: ReceiptSettings, businessId?: string): void {
  try {
    const key = businessId ? `${DEMO_RECEIPT_SETTINGS_KEY}_${businessId}` : DEMO_RECEIPT_SETTINGS_KEY;
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving receipt settings:', err);
  }
}

// ----------------------------------------------------
// Fetch Sales List (with multi-field search & filters)
// ----------------------------------------------------
export async function fetchSales(filters: SalesFilterOptions = {}): Promise<SalesResponse> {
  const {
    businessId,
    search = '',
    branchId,
    cashierId,
    customerId,
    paymentMethod = 'all',
    status = 'all',
    datePreset = 'all',
    startDate,
    endDate,
    page = 1,
    pageSize = 25,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('sales')
        .select(
          `
          *,
          branch:branches(*),
          customer:customers(*),
          cashier:profiles(*),
          items:sale_items(*),
          returns:sale_returns(*, items:sale_return_items(*))
        `,
          { count: 'exact' }
        );

      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      if (cashierId) {
        query = query.eq('cashier_id', cashierId);
      }
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      if (paymentMethod && paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }
      if (status && status !== 'all') {
        query = query.eq('payment_status', status);
      }

      // Date range filtering
      const now = new Date();
      if (datePreset === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('created_at', start);
      } else if (datePreset === 'yesterday') {
        const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte('created_at', yStart.toISOString()).lt('created_at', yEnd.toISOString());
      } else if (datePreset === 'last_7_days') {
        const start = new Date(now.getTime() - 7 * 86400000).toISOString();
        query = query.gte('created_at', start);
      } else if (datePreset === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('created_at', start);
      } else if (datePreset === 'custom') {
        if (startDate) {
          query = query.gte('created_at', new Date(startDate).toISOString());
        }
        if (endDate) {
          const endD = new Date(endDate);
          endD.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endD.toISOString());
        }
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, count, error } = await query;

      if (!error && data) {
        let filtered = data as Sale[];

        // Apply text search on client for cross-relation fields (product name, barcode, customer phone)
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          filtered = filtered.filter((s) => {
            const matchRec = s.receipt_number?.toLowerCase().includes(q);
            const matchCustName = s.customer?.name?.toLowerCase().includes(q);
            const matchCustPhone = s.customer?.phone?.toLowerCase().includes(q);
            const matchCashier = s.cashier?.full_name?.toLowerCase().includes(q);
            const matchItems = s.items?.some(
              (it) =>
                it.product_name?.toLowerCase().includes(q) ||
                it.sku?.toLowerCase().includes(q)
            );
            return matchRec || matchCustName || matchCustPhone || matchCashier || matchItems;
          });
        }

        // Calculate stats
        const stats = calculateSalesStats(filtered);
        const startIndex = (page - 1) * pageSize;
        const pagedSales = filtered.slice(startIndex, startIndex + pageSize);

        return {
          sales: pagedSales,
          totalCount: filtered.length || count || 0,
          stats,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchSales failed, using local storage fallback:', err);
    }
  }

  // Local Storage Fallback
  let list = getStoredSales();

  // Filter by business
  if (businessId) {
    list = list.filter((s) => s.business_id === businessId || !s.business_id);
  }

  // Filter by branch
  if (branchId) {
    list = list.filter((s) => s.branch_id === branchId);
  }

  // Filter by cashier
  if (cashierId) {
    list = list.filter((s) => s.cashier_id === cashierId || s.cashier?.id === cashierId);
  }

  // Filter by customer
  if (customerId) {
    list = list.filter((s) => s.customer_id === customerId || s.customer?.id === customerId);
  }

  // Filter by payment method
  if (paymentMethod && paymentMethod !== 'all') {
    list = list.filter((s) => s.payment_method === paymentMethod);
  }

  // Filter by status
  if (status && status !== 'all') {
    list = list.filter((s) => s.payment_status === status);
  }

  // Filter by date
  const now = new Date();
  if (datePreset === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    list = list.filter((s) => new Date(s.created_at).getTime() >= todayStart);
  } else if (datePreset === 'yesterday') {
    const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    list = list.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= yStart && t < yEnd;
    });
  } else if (datePreset === 'last_7_days') {
    const weekStart = now.getTime() - 7 * 86400000;
    list = list.filter((s) => new Date(s.created_at).getTime() >= weekStart);
  } else if (datePreset === 'this_month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    list = list.filter((s) => new Date(s.created_at).getTime() >= monthStart);
  } else if (datePreset === 'custom') {
    if (startDate) {
      const startMs = new Date(startDate).getTime();
      list = list.filter((s) => new Date(s.created_at).getTime() >= startMs);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      const endMs = endD.getTime();
      list = list.filter((s) => new Date(s.created_at).getTime() <= endMs);
    }
  }

  // Filter by text search
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter((s) => {
      const matchRec = s.receipt_number?.toLowerCase().includes(q);
      const matchCustName = s.customer?.name?.toLowerCase().includes(q);
      const matchCustPhone = s.customer?.phone?.toLowerCase().includes(q);
      const matchCashier = s.cashier?.full_name?.toLowerCase().includes(q);
      const matchItems = s.items?.some(
        (it) =>
          it.product_name?.toLowerCase().includes(q) ||
          it.sku?.toLowerCase().includes(q)
      );
      return matchRec || matchCustName || matchCustPhone || matchCashier || matchItems;
    });
  }

  // Sorting
  list.sort((a, b) => {
    if (sortBy === 'total_amount') {
      return sortOrder === 'asc' ? a.total_amount - b.total_amount : b.total_amount - a.total_amount;
    }
    if (sortBy === 'receipt_number') {
      return sortOrder === 'asc'
        ? a.receipt_number.localeCompare(b.receipt_number)
        : b.receipt_number.localeCompare(a.receipt_number);
    }
    const tA = new Date(a.created_at).getTime();
    const tB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? tA - tB : tB - tA;
  });

  const stats = calculateSalesStats(list);
  const startIndex = (page - 1) * pageSize;
  const pagedSales = list.slice(startIndex, startIndex + pageSize);

  return {
    sales: pagedSales,
    totalCount: list.length,
    stats,
  };
}

function calculateSalesStats(sales: Sale[]): SalesStats {
  let totalGross = 0;
  let totalRefunds = 0;
  let completedCount = 0;
  let partiallyRefundedCount = 0;
  let refundedCount = 0;
  let cancelledCount = 0;

  for (const s of sales) {
    if (s.payment_status === 'cancelled') {
      cancelledCount++;
      continue;
    }

    totalGross += Number(s.total_amount) || 0;
    const refAmt = Number(s.refunded_amount) || 0;
    totalRefunds += refAmt;

    if (s.payment_status === 'completed') {
      completedCount++;
    } else if (s.payment_status === 'partially_refunded') {
      partiallyRefundedCount++;
    } else if (s.payment_status === 'refunded') {
      refundedCount++;
    }
  }

  const activeTransactions = sales.filter((s) => s.payment_status !== 'cancelled').length;
  const netSales = Math.max(0, totalGross - totalRefunds);
  const aov = activeTransactions > 0 ? Math.round(totalGross / activeTransactions) : 0;

  return {
    totalGrossSales: totalGross,
    totalNetSales: netSales,
    totalRefunds,
    totalTransactions: sales.length,
    completedCount,
    partiallyRefundedCount,
    refundedCount,
    cancelledCount,
    averageOrderValue: aov,
  };
}

// ----------------------------------------------------
// Fetch Single Sale By ID
// ----------------------------------------------------
export async function fetchSaleById(saleId: string): Promise<Sale | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(
          `
          *,
          branch:branches(*),
          customer:customers(*),
          cashier:profiles(*),
          items:sale_items(*),
          returns:sale_returns(*, items:sale_return_items(*))
        `
        )
        .eq('id', saleId)
        .single();

      if (!error && data) {
        return data as Sale;
      }
    } catch (err) {
      console.warn('Supabase fetchSaleById error:', err);
    }
  }

  const localSales = getStoredSales();
  return localSales.find((s) => s.id === saleId) || null;
}

// ----------------------------------------------------
// Process Return & Refund
// ----------------------------------------------------
export async function processSaleReturn(input: ProcessReturnInput): Promise<SaleReturn> {
  const now = new Date().toISOString();
  const returnNumber = generateReturnNumber();
  const returnId = `ret-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Calculate total refund amount
  const totalRefundAmount = input.items.reduce((acc, it) => acc + it.refundAmount, 0);

  // Construct Sale Return Items
  const returnItems: SaleReturnItem[] = input.items.map((it, idx) => ({
    id: `ret-item-${Date.now()}-${idx}`,
    return_id: returnId,
    sale_item_id: it.saleItemId,
    product_id: it.productId,
    product_name: it.productName,
    sku: it.sku,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    refund_amount: it.refundAmount,
    restock: it.restock,
    reason: it.reason,
    notes: it.notes || null,
    created_at: now,
  }));

  const returnRecord: SaleReturn = {
    id: returnId,
    sale_id: input.saleId,
    business_id: input.businessId,
    branch_id: input.branchId,
    return_number: returnNumber,
    processed_by_id: input.processedById || null,
    processed_by: input.processedByProfile || null,
    refund_amount: totalRefundAmount,
    refund_method: input.refundMethod,
    reason: input.reason,
    notes: input.notes || null,
    created_at: now,
    items: returnItems,
  };

  // Adjust stock for returned items
  for (const it of input.items) {
    if (it.productId) {
      try {
        if (it.restock) {
          // Add back to inventory
          await adjustStock({
            businessId: input.businessId,
            branchId: input.branchId,
            productId: it.productId,
            adjustmentType: 'add',
            movementType: 'return',
            quantity: it.quantity,
            reason: `Return #${returnNumber} for Sale item`,
            referenceId: returnNumber,
            userId: input.processedById,
          });
        } else {
          // Log damaged write-off without adding sellable stock
          await adjustStock({
            businessId: input.businessId,
            branchId: input.branchId,
            productId: it.productId,
            adjustmentType: 'set',
            movementType: 'damaged',
            quantity: it.quantity,
            reason: `Damaged return #${returnNumber}: ${it.reason}`,
            referenceId: returnNumber,
            userId: input.processedById,
          });
        }
      } catch (stkErr) {
        console.warn('Error adjusting inventory for return item:', stkErr);
      }
    }
  }

  // Update sale status in local storage
  const localSales = getStoredSales();
  const saleIdx = localSales.findIndex((s) => s.id === input.saleId);

  if (saleIdx >= 0) {
    const sale = localSales[saleIdx];
    const existingReturns = sale.returns || [];
    const updatedReturns = [returnRecord, ...existingReturns];

    // Compute total returned count for each line item
    const itemReturnedMap: Record<string, number> = {};
    for (const ret of updatedReturns) {
      for (const rIt of ret.items || []) {
        itemReturnedMap[rIt.sale_item_id] = (itemReturnedMap[rIt.sale_item_id] || 0) + rIt.quantity;
      }
    }

    const updatedSaleItems = (sale.items || []).map((it) => ({
      ...it,
      returned_quantity: itemReturnedMap[it.id] || 0,
    }));

    // Check if fully refunded
    const totalOriginalQty = (sale.items || []).reduce((acc, it) => acc + it.quantity, 0);
    const totalReturnedQty = Object.values(itemReturnedMap).reduce((acc, q) => acc + q, 0);
    const isFullyRefunded = totalReturnedQty >= totalOriginalQty;

    const newRefundedAmount = (sale.refunded_amount || 0) + totalRefundAmount;
    const newStatus: PaymentStatus = isFullyRefunded ? 'refunded' : 'partially_refunded';

    const updatedSale: Sale = {
      ...sale,
      payment_status: newStatus,
      refunded_amount: newRefundedAmount,
      returns: updatedReturns,
      items: updatedSaleItems,
      updated_at: now,
    };

    localSales[saleIdx] = updatedSale;
    setStoredSales(localSales);

    // If refunded as store credit and customer is attached, credit their balance
    if (input.refundMethod === 'store_credit' && sale.customer_id) {
      try {
        await updateCustomerBalance(sale.customer_id, -totalRefundAmount);
      } catch (err) {
        console.warn('Error updating customer credit balance on refund:', err);
      }
    }

    if (sale.customer_id) {
      try {
        await recordCustomerRefund(
          sale.customer_id,
          sale.business_id,
          totalRefundAmount,
          returnNumber,
          input.processedById
        );
      } catch (err) {
        console.warn('Error recording customer refund activity:', err);
      }
    }
  }

  if (isSupabaseConfigured) {
    try {
      // Insert return record
      await supabase.from('sale_returns').insert({
        id: returnId,
        sale_id: input.saleId,
        business_id: input.businessId,
        branch_id: input.branchId,
        return_number: returnNumber,
        processed_by_id: input.processedById || null,
        refund_amount: totalRefundAmount,
        refund_method: input.refundMethod,
        reason: input.reason,
        notes: input.notes || null,
      });

      // Insert return items
      const itemsToInsert = input.items.map((it) => ({
        return_id: returnId,
        sale_item_id: it.saleItemId,
        product_id: it.productId,
        product_name: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        refund_amount: it.refundAmount,
        restock: it.restock,
        reason: it.reason,
        notes: it.notes || null,
      }));

      await supabase.from('sale_return_items').insert(itemsToInsert);

      // Update sale record
      if (saleIdx >= 0) {
        const sale = localSales[saleIdx];
        await supabase
          .from('sales')
          .update({
            payment_status: sale.payment_status,
            refunded_amount: sale.refunded_amount,
            updated_at: now,
          })
          .eq('id', input.saleId);
      }
    } catch (err) {
      console.warn('Supabase processSaleReturn insert error:', err);
    }
  }

  playPosBeep('success');
  return returnRecord;
}

// ----------------------------------------------------
// Cancel Sale
// ----------------------------------------------------
export async function cancelSale(saleId: string, cashierId?: string, reason?: string): Promise<Sale> {
  const now = new Date().toISOString();
  const localSales = getStoredSales();
  const saleIdx = localSales.findIndex((s) => s.id === saleId);

  if (saleIdx < 0) {
    throw new Error('Sale not found');
  }

  const sale = localSales[saleIdx];
  if (sale.payment_status === 'cancelled') {
    return sale;
  }

  // Restock all items
  for (const it of sale.items || []) {
    if (it.product_id) {
      try {
        const qtyToReturn = it.quantity - (it.returned_quantity || 0);
        if (qtyToReturn > 0) {
          await adjustStock({
            businessId: sale.business_id,
            branchId: sale.branch_id,
            productId: it.product_id,
            adjustmentType: 'add',
            movementType: 'return',
            quantity: qtyToReturn,
            reason: `Sale #${sale.receipt_number} Cancelled: ${reason || 'Cashier Void'}`,
            referenceId: sale.receipt_number,
            userId: cashierId,
          });
        }
      } catch (err) {
        console.warn('Error restocked on cancel:', err);
      }
    }
  }

  // If customer had balance due on this credit sale, reduce their balance
  if (sale.customer_id && sale.due_amount > 0) {
    try {
      await updateCustomerBalance(sale.customer_id, -sale.due_amount);
    } catch (err) {
      console.warn('Error reverting customer balance on sale cancellation:', err);
    }
  }

  const updatedSale: Sale = {
    ...sale,
    payment_status: 'cancelled',
    notes: [sale.notes, `Cancelled: ${reason || 'Voided by staff'}`].filter(Boolean).join(' | '),
    updated_at: now,
  };

  localSales[saleIdx] = updatedSale;
  setStoredSales(localSales);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('sales')
        .update({
          payment_status: 'cancelled',
          notes: updatedSale.notes,
          updated_at: now,
        })
        .eq('id', saleId);
    } catch (err) {
      console.warn('Supabase cancelSale error:', err);
    }
  }

  playPosBeep('warning');
  return updatedSale;
}

// ----------------------------------------------------
// Export Sales To CSV
// ----------------------------------------------------
export function exportSalesToCsv(sales: Sale[], currency = 'BIF'): string {
  const headers = [
    'Receipt Number',
    'Date & Time',
    'Branch',
    'Customer Name',
    'Customer Phone',
    'Cashier',
    'Items Count',
    `Subtotal (${currency})`,
    `Discount (${currency})`,
    `Tax (${currency})`,
    `Total Amount (${currency})`,
    `Paid Amount (${currency})`,
    `Refunded Amount (${currency})`,
    `Due Amount (${currency})`,
    'Payment Method',
    'Status',
    'Notes',
  ];

  const rows = sales.map((s) => {
    const itemsCount = (s.items || []).reduce((acc, it) => acc + it.quantity, 0);
    return [
      `"${s.receipt_number}"`,
      `"${formatDateTime(s.created_at)}"`,
      `"${s.branch?.name || 'Main Branch'}"`,
      `"${s.customer?.name || 'Walk-in Customer'}"`,
      `"${s.customer?.phone || ''}"`,
      `"${s.cashier?.full_name || 'Staff'}"`,
      itemsCount,
      s.subtotal,
      s.discount_amount,
      s.tax_amount,
      s.total_amount,
      s.paid_amount,
      s.refunded_amount || 0,
      s.due_amount,
      `"${s.payment_method.toUpperCase()}"`,
      `"${s.payment_status.toUpperCase()}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// ----------------------------------------------------
// Process Sale (Transaction + Stock Decrement + Audit)
// ----------------------------------------------------
export async function processSale(input: ProcessSaleInput): Promise<Sale> {
  const receiptNum = input.receiptNumber || generateReceiptNumber();
  const now = new Date().toISOString();
  const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Construct Sale Items
  const saleItems: SaleItem[] = input.items.map((it, idx) => ({
    id: `item-${Date.now()}-${idx}`,
    sale_id: saleId,
    product_id: it.productId,
    product_name: it.product.name,
    sku: it.product.sku,
    quantity: it.quantity,
    unit_price: it.unitPrice,
    cost_price: it.costPrice,
    discount_amount: it.lineDiscount,
    tax_amount: (it.lineTotal * (input.taxRate / 100)),
    total_price: it.lineTotal,
    created_at: now,
  }));

  const saleRecord: Sale = {
    id: saleId,
    business_id: input.businessId,
    branch_id: input.branchId,
    cashier_id: input.cashierId || null,
    customer_id: input.customerId || null,
    receipt_number: receiptNum,
    subtotal: input.subtotal,
    tax_amount: input.taxAmount,
    discount_amount: input.discountAmount,
    total_amount: input.totalAmount,
    paid_amount: input.paidAmount,
    due_amount: input.dueAmount,
    refunded_amount: 0,
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    due_date: input.dueDate || null,
    notes: input.notes || null,
    created_at: now,
    updated_at: now,
    branch: input.branch || null,
    cashier: input.cashierProfile || null,
    customer: input.customer || null,
    items: saleItems,
    returns: [],
  };

  if (isSupabaseConfigured) {
    try {
      // 1. Insert Sale record
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: input.businessId,
          branch_id: input.branchId,
          cashier_id: input.cashierId || null,
          customer_id: input.customerId || null,
          receipt_number: receiptNum,
          subtotal: input.subtotal,
          tax_amount: input.taxAmount,
          discount_amount: input.discountAmount,
          total_amount: input.totalAmount,
          paid_amount: input.paidAmount,
          due_amount: input.dueAmount,
          payment_method: input.paymentMethod,
          payment_status: input.paymentStatus,
          due_date: input.dueDate || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (!saleError && saleData) {
        const persistedSaleId = saleData.id;

        // 2. Insert Sale Items
        const itemsToInsert = input.items.map((it) => ({
          sale_id: persistedSaleId,
          product_id: it.productId,
          product_name: it.product.name,
          sku: it.product.sku,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          cost_price: it.costPrice,
          discount_amount: it.lineDiscount,
          tax_amount: (it.lineTotal * (input.taxRate / 100)),
          total_price: it.lineTotal,
        }));

        await supabase.from('sale_items').insert(itemsToInsert);

        // 3. Deduct stock & log movement for each item
        for (const it of input.items) {
          try {
            await adjustStock({
              businessId: input.businessId,
              branchId: input.branchId,
              productId: it.productId,
              adjustmentType: 'remove',
              movementType: 'sale',
              quantity: it.quantity,
              reason: `Sale ${receiptNum}`,
              referenceId: receiptNum,
              userId: input.cashierId,
            });
          } catch (stkErr) {
            console.warn('Error adjusting inventory for sale item:', stkErr);
          }
        }

        // 4. Update customer balance if there is an unpaid due amount
        if (input.customerId && input.dueAmount > 0) {
          await updateCustomerBalance(input.customerId, input.dueAmount);
        }

        // 5. Update customer stats & log sale activity
        if (input.customerId) {
          await recordCustomerSale(
            input.customerId,
            input.businessId,
            input.totalAmount,
            receiptNum,
            input.cashierId
          );
        }

        // Update local sales list as well
        const localSales = getStoredSales();
        setStoredSales([{ ...saleRecord, id: persistedSaleId }, ...localSales]);

        return { ...saleRecord, id: persistedSaleId };
      }
      console.warn('Supabase sale insert returned error, saving local:', saleError);
    } catch (err) {
      console.warn('Supabase sale processing error, using local fallback:', err);
    }
  }

  // Local Storage Fallback Execution:
  // 1. Save Sale
  const localSales = getStoredSales();
  setStoredSales([saleRecord, ...localSales]);

  // 2. Deduct Branch Inventory & log movement
  for (const it of input.items) {
    try {
      await adjustStock({
        businessId: input.businessId,
        branchId: input.branchId,
        productId: it.productId,
        adjustmentType: 'remove',
        movementType: 'sale',
        quantity: it.quantity,
        reason: `POS Sale ${receiptNum}`,
        referenceId: receiptNum,
        userId: input.cashierId,
      });
    } catch (err) {
      console.warn('Local stock deduction error:', err);
    }
  }

  // 3. Update customer balance if credit/due
  if (input.customerId && input.dueAmount > 0) {
    await updateCustomerBalance(input.customerId, input.dueAmount);
  }

  // 4. Update customer stats & log sale activity
  if (input.customerId) {
    await recordCustomerSale(
      input.customerId,
      input.businessId,
      input.totalAmount,
      receiptNum,
      input.cashierId
    );
  }

  playPosBeep('success');
  return saleRecord;
}

// ----------------------------------------------------
// Held Sales (Parked Carts)
// ----------------------------------------------------
export function getHeldSales(businessId?: string, branchId?: string): HeldSale[] {
  try {
    const raw = localStorage.getItem(DEMO_HELD_SALES_KEY);
    if (!raw) return [];
    const list: HeldSale[] = JSON.parse(raw);
    return list.filter((h) => {
      if (businessId && h.businessId !== businessId) return false;
      if (branchId && h.branchId !== branchId) return false;
      return true;
    });
  } catch (err) {
    console.error('Error fetching held sales:', err);
    return [];
  }
}

export function saveHeldSale(heldSale: HeldSale): void {
  try {
    const raw = localStorage.getItem(DEMO_HELD_SALES_KEY);
    const list: HeldSale[] = raw ? JSON.parse(raw) : [];
    const existingIdx = list.findIndex((h) => h.id === heldSale.id);
    if (existingIdx >= 0) {
      list[existingIdx] = heldSale;
    } else {
      list.unshift(heldSale);
    }
    localStorage.setItem(DEMO_HELD_SALES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving held sale:', err);
  }
}

export function removeHeldSale(heldSaleId: string): void {
  try {
    const raw = localStorage.getItem(DEMO_HELD_SALES_KEY);
    if (!raw) return;
    const list: HeldSale[] = JSON.parse(raw);
    const updated = list.filter((h) => h.id !== heldSaleId);
    localStorage.setItem(DEMO_HELD_SALES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error removing held sale:', err);
  }
}
