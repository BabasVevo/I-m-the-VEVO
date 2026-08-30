import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchasePayment,
  PurchaseReturn,
  PurchasingStats,
  PurchaseOrderStatus,
  PurchaseOrderPaymentStatus,
  PaymentTerms,
  PaymentMethod,
} from '@/types/database';
import { getStoredSuppliers, saveStoredSuppliers } from './supplierService';
import { getStoredInventory, saveStoredInventory, getStoredMovements, saveStoredMovements } from './productService';

export const DEMO_PURCHASES_KEY = 'verdant_demo_purchases_v1';
export const DEMO_PURCHASE_PAYMENTS_KEY = 'verdant_demo_purchase_payments_v1';
export const DEMO_PURCHASE_RETURNS_KEY = 'verdant_demo_purchase_returns_v1';

export const INITIAL_DEMO_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    supplier_id: 'supp-1',
    po_number: 'PO-2026-000101',
    order_date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    expected_delivery_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    payment_terms: 'net_30',
    status: 'received',
    payment_status: 'partial',
    subtotal: 3600000,
    discount_amount: 0,
    tax_amount: 648000,
    grand_total: 4248000,
    paid_amount: 2448000,
    due_amount: 1800000,
    notes: 'Urgent restocking for Kilimanjaro Arabica coffee beans.',
    receiving_notes: 'All 200 bags received in good condition.',
    created_by: 'demo-user-1',
    received_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    items: [
      {
        id: 'poi-1',
        purchase_order_id: 'po-1',
        product_id: 'prod-1',
        product_name: 'Organic Arabica Coffee Beans (1kg)',
        sku: 'COF-ARA-001',
        unit: 'kg',
        quantity_ordered: 200,
        quantity_received: 200,
        quantity_damaged: 0,
        unit_cost: 18000,
        discount_amount: 0,
        tax_rate: 18,
        tax_amount: 648000,
        line_total: 4248000,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'po-2',
    business_id: 'demo-biz-1',
    branch_id: 'branch-masaki',
    supplier_id: 'supp-2',
    po_number: 'PO-2026-000102',
    order_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    expected_delivery_date: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    payment_terms: 'net_15',
    status: 'ordered',
    payment_status: 'unpaid',
    subtotal: 950000,
    discount_amount: 0,
    tax_amount: 171000,
    grand_total: 1121000,
    paid_amount: 0,
    due_amount: 1121000,
    notes: 'Direct delivery to Masaki branch warehouse.',
    created_by: 'demo-user-1',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    items: [
      {
        id: 'poi-2',
        purchase_order_id: 'po-2',
        product_id: 'prod-2',
        product_name: 'African Spiced Chai Tea (500g)',
        sku: 'TEA-CHAI-002',
        unit: 'box',
        quantity_ordered: 100,
        quantity_received: 0,
        quantity_damaged: 0,
        unit_cost: 9500,
        discount_amount: 0,
        tax_rate: 18,
        tax_amount: 171000,
        line_total: 1121000,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'po-3',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    supplier_id: 'supp-4',
    po_number: 'PO-2026-000103',
    order_date: new Date(Date.now() - 9 * 86400000).toISOString().slice(0, 10),
    expected_delivery_date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    payment_terms: 'net_60',
    status: 'partially_received',
    payment_status: 'partial',
    subtotal: 2250000,
    discount_amount: 0,
    tax_amount: 405000,
    grand_total: 2655000,
    paid_amount: 1305000,
    due_amount: 1350000,
    notes: 'POS consumables - receipt paper rolls.',
    receiving_notes: 'Received 30 out of 50 boxes. Remaining 20 boxes backordered for next week.',
    created_by: 'demo-user-1',
    received_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    items: [
      {
        id: 'poi-3',
        purchase_order_id: 'po-3',
        product_id: 'prod-3',
        product_name: 'Thermal Receipt Paper Roll 80x80mm (Box of 50)',
        sku: 'POS-PPR-080',
        unit: 'box',
        quantity_ordered: 50,
        quantity_received: 30,
        quantity_damaged: 0,
        unit_cost: 45000,
        discount_amount: 0,
        tax_rate: 18,
        tax_amount: 405000,
        line_total: 2655000,
        created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      },
    ],
  },
  {
    id: 'po-4',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    supplier_id: 'supp-3',
    po_number: 'PO-2026-000104',
    order_date: new Date(Date.now() - 1).toISOString().slice(0, 10),
    expected_delivery_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    payment_terms: 'cod',
    status: 'draft',
    payment_status: 'unpaid',
    subtotal: 1350000,
    discount_amount: 0,
    tax_amount: 243000,
    grand_total: 1593000,
    paid_amount: 0,
    due_amount: 1593000,
    notes: 'Draft PO for 10 units of wireless barcode scanners.',
    created_by: 'demo-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'poi-4',
        purchase_order_id: 'po-4',
        product_id: 'prod-4',
        product_name: 'Wireless 2D Barcode Scanner Bluetooth',
        sku: 'HDW-SCN-200',
        unit: 'pcs',
        quantity_ordered: 10,
        quantity_received: 0,
        quantity_damaged: 0,
        unit_cost: 135000,
        discount_amount: 0,
        tax_rate: 18,
        tax_amount: 243000,
        line_total: 1593000,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

export function getStoredPurchases(): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(DEMO_PURCHASES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(INITIAL_DEMO_PURCHASES));
      return INITIAL_DEMO_PURCHASES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PURCHASES;
  }
}

export function saveStoredPurchases(orders: PurchaseOrder[]) {
  localStorage.setItem(DEMO_PURCHASES_KEY, JSON.stringify(orders));
}

export function getStoredPurchasePayments(): PurchasePayment[] {
  try {
    const raw = localStorage.getItem(DEMO_PURCHASE_PAYMENTS_KEY);
    if (!raw) {
      const initial: PurchasePayment[] = [
        {
          id: 'pp-1',
          business_id: 'demo-biz-1',
          purchase_order_id: 'po-1',
          supplier_id: 'supp-1',
          amount: 2448000,
          payment_method: 'bank_transfer',
          payment_date: new Date(Date.now() - 4 * 86400000).toISOString(),
          reference_number: 'NMB-TRX-994821',
          notes: 'Advance deposit upon shipment arrival',
          created_by: 'demo-user-1',
          created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
        {
          id: 'pp-2',
          business_id: 'demo-biz-1',
          purchase_order_id: 'po-3',
          supplier_id: 'supp-4',
          amount: 1305000,
          payment_method: 'bank_transfer',
          payment_date: new Date(Date.now() - 7 * 86400000).toISOString(),
          reference_number: 'CRDB-TX-811902',
          notes: 'First installment payment for 30 receipt roll boxes',
          created_by: 'demo-user-1',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      ];
      localStorage.setItem(DEMO_PURCHASE_PAYMENTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredPurchasePayments(payments: PurchasePayment[]) {
  localStorage.setItem(DEMO_PURCHASE_PAYMENTS_KEY, JSON.stringify(payments));
}

// ----------------------------------------------------
// Number Generator
// ----------------------------------------------------
export function generatePoNumber(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `PO-${currentYear}-${randomSuffix}`;
}

// ----------------------------------------------------
// Public Purchasing APIs
// ----------------------------------------------------

export interface FetchPurchasesFilter {
  branchId?: string | null;
  supplierId?: string | null;
  status?: PurchaseOrderStatus | 'all';
  paymentStatus?: PurchaseOrderPaymentStatus | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchPurchaseOrders(
  businessId: string,
  filter: FetchPurchasesFilter = {}
): Promise<{ orders: PurchaseOrder[]; totalCount: number }> {
  const {
    branchId,
    supplierId,
    status = 'all',
    paymentStatus = 'all',
    search,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('purchase_orders')
        .select('*, branch:branches(*), supplier:suppliers(*), creator:profiles(*), items:purchase_order_items(*)', { count: 'exact' })
        .eq('business_id', businessId);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      if (supplierId && supplierId !== 'all') {
        query = query.eq('supplier_id', supplierId);
      }
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (paymentStatus !== 'all') {
        query = query.eq('payment_status', paymentStatus);
      }
      if (startDate) {
        query = query.gte('order_date', startDate);
      }
      if (endDate) {
        query = query.lte('order_date', endDate);
      }
      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`po_number.ilike.%${q}%,notes.ilike.%${q}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

      if (!error && data) {
        return {
          orders: data as PurchaseOrder[],
          totalCount: count || 0,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchPurchaseOrders error, falling back:', err);
    }
  }

  // Fallback
  let list = getStoredPurchases().filter((p) => p.business_id === businessId || businessId === 'demo-biz-1');
  const suppliers = getStoredSuppliers();

  list = list.map((p) => {
    const supp = suppliers.find((s) => s.id === p.supplier_id) || null;
    return {
      ...p,
      supplier: supp,
    };
  });

  if (branchId) {
    list = list.filter((p) => p.branch_id === branchId);
  }
  if (supplierId && supplierId !== 'all') {
    list = list.filter((p) => p.supplier_id === supplierId);
  }
  if (status !== 'all') {
    list = list.filter((p) => p.status === status);
  }
  if (paymentStatus !== 'all') {
    list = list.filter((p) => p.payment_status === paymentStatus);
  }
  if (startDate) {
    list = list.filter((p) => p.order_date >= startDate);
  }
  if (endDate) {
    list = list.filter((p) => p.order_date <= endDate);
  }
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.po_number.toLowerCase().includes(q) ||
        (p.supplier?.name && p.supplier.name.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalCount = list.length;
  const paginated = list.slice((page - 1) * pageSize, page * pageSize);

  return {
    orders: paginated,
    totalCount,
  };
}

export async function fetchPurchaseOrderById(poId: string): Promise<PurchaseOrder | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          branch:branches(*),
          supplier:suppliers(*),
          creator:profiles(*),
          items:purchase_order_items(*),
          payments:purchase_payments(*, creator:profiles(*))
        `)
        .eq('id', poId)
        .maybeSingle();

      if (!error && data) {
        return data as PurchaseOrder;
      }
    } catch (err) {
      console.warn('Supabase fetchPurchaseOrderById error, falling back:', err);
    }
  }

  // Fallback
  const orders = getStoredPurchases();
  const order = orders.find((o) => o.id === poId);
  if (!order) return null;

  const suppliers = getStoredSuppliers();
  const payments = getStoredPurchasePayments().filter((p) => p.purchase_order_id === poId);

  return {
    ...order,
    supplier: suppliers.find((s) => s.id === order.supplier_id) || null,
    payments,
  };
}

export interface CreatePurchaseOrderItemInput {
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  unit: string;
  quantity_ordered: number;
  unit_cost: number;
  discount_amount?: number;
  tax_rate?: number;
}

export interface CreatePurchaseOrderInput {
  branch_id: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string | null;
  payment_terms?: PaymentTerms;
  status?: PurchaseOrderStatus;
  notes?: string | null;
  items: CreatePurchaseOrderItemInput[];
}

export async function createPurchaseOrder(
  businessId: string,
  input: CreatePurchaseOrderInput,
  userId?: string | null
): Promise<PurchaseOrder> {
  const poNumber = generatePoNumber();
  const now = new Date().toISOString();

  // Compute item line totals
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  const calculatedItems: PurchaseOrderItem[] = input.items.map((item, idx) => {
    const qty = Number(item.quantity_ordered) || 1;
    const cost = Number(item.unit_cost) || 0;
    const disc = Number(item.discount_amount) || 0;
    const itemSub = qty * cost - disc;
    const taxRate = Number(item.tax_rate) || 0;
    const taxAmount = (itemSub * taxRate) / 100;
    const lineTotal = itemSub + taxAmount;

    subtotal += qty * cost;
    totalDiscount += disc;
    totalTax += taxAmount;

    return {
      id: `poi-${Date.now()}-${idx}`,
      purchase_order_id: '', // filled below
      product_id: item.product_id || null,
      product_name: item.product_name.trim(),
      sku: item.sku?.trim() || null,
      unit: item.unit || 'pcs',
      quantity_ordered: qty,
      quantity_received: 0,
      quantity_damaged: 0,
      unit_cost: cost,
      discount_amount: disc,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      line_total: lineTotal,
      created_at: now,
    };
  });

  const grandTotal = subtotal - totalDiscount + totalTax;
  const status: PurchaseOrderStatus = input.status || 'ordered';

  const newPO: PurchaseOrder = {
    id: `po-${Date.now()}`,
    business_id: businessId,
    branch_id: input.branch_id,
    supplier_id: input.supplier_id,
    po_number: poNumber,
    order_date: input.order_date || now.slice(0, 10),
    expected_delivery_date: input.expected_delivery_date || null,
    payment_terms: input.payment_terms || 'net_30',
    status,
    payment_status: 'unpaid',
    subtotal,
    discount_amount: totalDiscount,
    tax_amount: totalTax,
    grand_total: grandTotal,
    paid_amount: 0,
    due_amount: grandTotal,
    notes: input.notes?.trim() || null,
    created_by: userId || null,
    created_at: now,
    updated_at: now,
    items: calculatedItems.map((item) => ({ ...item, purchase_order_id: `po-${Date.now()}` })),
  };

  if (isSupabaseConfigured) {
    try {
      const { data: poData, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({
          business_id: businessId,
          branch_id: newPO.branch_id,
          supplier_id: newPO.supplier_id,
          po_number: newPO.po_number,
          order_date: newPO.order_date,
          expected_delivery_date: newPO.expected_delivery_date,
          payment_terms: newPO.payment_terms,
          status: newPO.status,
          payment_status: newPO.payment_status,
          subtotal: newPO.subtotal,
          discount_amount: newPO.discount_amount,
          tax_amount: newPO.tax_amount,
          grand_total: newPO.grand_total,
          paid_amount: 0,
          due_amount: newPO.grand_total,
          notes: newPO.notes,
          created_by: userId || null,
        })
        .select('*, branch:branches(*), supplier:suppliers(*)')
        .single();

      if (!poErr && poData) {
        const poId = poData.id;
        const itemsToInsert = calculatedItems.map((item) => ({
          purchase_order_id: poId,
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          unit: item.unit,
          quantity_ordered: item.quantity_ordered,
          quantity_received: 0,
          quantity_damaged: 0,
          unit_cost: item.unit_cost,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          line_total: item.line_total,
        }));

        await supabase.from('purchase_order_items').insert(itemsToInsert);

        // Update supplier balance if marked ordered
        if (status === 'ordered') {
          const { data: sup } = await supabase.from('suppliers').select('current_balance').eq('id', newPO.supplier_id).single();
          if (sup) {
            await supabase
              .from('suppliers')
              .update({
                current_balance: Number(sup.current_balance || 0) + grandTotal,
                updated_at: now,
              })
              .eq('id', newPO.supplier_id);
          }
        }

        return fetchPurchaseOrderById(poId) as Promise<PurchaseOrder>;
      }
    } catch (err) {
      console.warn('Supabase createPurchaseOrder error, falling back:', err);
    }
  }

  // Fallback
  const orders = getStoredPurchases();
  orders.unshift(newPO);
  saveStoredPurchases(orders);

  // Update supplier balance and stats
  const suppliers = getStoredSuppliers();
  const suppIdx = suppliers.findIndex((s) => s.id === input.supplier_id);
  if (suppIdx !== -1) {
    suppliers[suppIdx].total_purchases_count = (suppliers[suppIdx].total_purchases_count || 0) + 1;
    suppliers[suppIdx].total_purchases_amount = (suppliers[suppIdx].total_purchases_amount || 0) + grandTotal;
    suppliers[suppIdx].current_balance = (suppliers[suppIdx].current_balance || 0) + grandTotal;
    suppliers[suppIdx].last_purchase_date = now;
    saveStoredSuppliers(suppliers);
  }

  return newPO;
}

export interface ReceiveItemInput {
  item_id: string;
  product_id?: string | null;
  product_name: string;
  quantity_to_receive: number;
  quantity_damaged?: number;
}

export async function receivePurchaseStock(
  businessId: string,
  poId: string,
  itemsReceived: ReceiveItemInput[],
  receivingNotes: string | null,
  userId?: string | null
): Promise<PurchaseOrder> {
  const now = new Date().toISOString();

  // Load PO first
  const po = await fetchPurchaseOrderById(poId);
  if (!po) throw new Error('Purchase Order not found');

  if (po.status === 'cancelled') {
    throw new Error('Cannot receive goods on a cancelled purchase order');
  }

  const existingItems = po.items || [];
  let allFullyReceived = true;
  let anyReceived = false;

  const updatedItems = existingItems.map((item) => {
    const rcv = itemsReceived.find((r) => r.item_id === item.id || (r.product_id && r.product_id === item.product_id));
    if (!rcv) {
      if (item.quantity_received < item.quantity_ordered) {
        allFullyReceived = false;
      }
      if (item.quantity_received > 0) {
        anyReceived = true;
      }
      return item;
    }

    const newlyReceivedQty = Math.max(0, Number(rcv.quantity_to_receive) || 0);
    const damagedQty = Math.max(0, Number(rcv.quantity_damaged) || 0);
    const totalReceived = (item.quantity_received || 0) + newlyReceivedQty;

    if (totalReceived < item.quantity_ordered) {
      allFullyReceived = false;
    }
    if (totalReceived > 0) {
      anyReceived = true;
    }

    return {
      ...item,
      quantity_received: totalReceived,
      quantity_damaged: (item.quantity_damaged || 0) + damagedQty,
    };
  });

  const newStatus: PurchaseOrderStatus = allFullyReceived ? 'received' : anyReceived ? 'partially_received' : po.status;

  // Process inventory increments and stock movements for newly received items
  const inventoryDeltas = itemsReceived.filter((r) => Number(r.quantity_to_receive) > 0);

  if (isSupabaseConfigured) {
    try {
      // 1. Update purchase_order_items
      for (const item of updatedItems) {
        await supabase
          .from('purchase_order_items')
          .update({
            quantity_received: item.quantity_received,
            quantity_damaged: item.quantity_damaged || 0,
          })
          .eq('id', item.id);
      }

      // 2. Update purchase order status & notes
      await supabase
        .from('purchase_orders')
        .update({
          status: newStatus,
          receiving_notes: receivingNotes ? `${po.receiving_notes || ''}\n${receivingNotes}`.trim() : po.receiving_notes,
          received_at: now,
          updated_at: now,
        })
        .eq('id', poId);

      // 3. Increment stock in inventory and insert stock_movements
      for (const delta of inventoryDeltas) {
        if (!delta.product_id) continue;
        const qtyToAdd = Number(delta.quantity_to_receive);

        // Fetch current stock
        const { data: invRow } = await supabase
          .from('inventory')
          .select('*')
          .eq('branch_id', po.branch_id)
          .eq('product_id', delta.product_id)
          .maybeSingle();

        const prevStock = invRow ? Number(invRow.quantity || 0) : 0;
        const newStock = prevStock + qtyToAdd;

        if (invRow) {
          await supabase
            .from('inventory')
            .update({ quantity: newStock, updated_at: now })
            .eq('id', invRow.id);
        } else {
          await supabase.from('inventory').insert({
            business_id: businessId,
            branch_id: po.branch_id,
            product_id: delta.product_id,
            quantity: newStock,
            min_quantity: 5,
            reorder_point: 10,
          });
        }

        // Insert stock movement
        await supabase.from('stock_movements').insert({
          business_id: businessId,
          branch_id: po.branch_id,
          product_id: delta.product_id,
          movement_type: 'purchase',
          quantity: qtyToAdd,
          previous_stock: prevStock,
          new_stock: newStock,
          reason: `Goods received against PO #${po.po_number}`,
          reference_id: po.po_number,
          created_by: userId || null,
        });
      }

      return (await fetchPurchaseOrderById(poId)) as PurchaseOrder;
    } catch (err) {
      console.warn('Supabase receivePurchaseStock error, falling back:', err);
    }
  }

  // Fallback update
  const orders = getStoredPurchases();
  const orderIdx = orders.findIndex((o) => o.id === poId);
  if (orderIdx !== -1) {
    orders[orderIdx].status = newStatus;
    orders[orderIdx].items = updatedItems;
    orders[orderIdx].receiving_notes = receivingNotes ? `${po.receiving_notes || ''}\n${receivingNotes}`.trim() : po.receiving_notes;
    orders[orderIdx].received_at = now;
    orders[orderIdx].updated_at = now;
    saveStoredPurchases(orders);
  }

  // Update local inventory and movements
  const inventory = getStoredInventory();
  const movements = getStoredMovements();

  inventoryDeltas.forEach((delta) => {
    if (!delta.product_id) return;
    const qtyToAdd = Number(delta.quantity_to_receive);
    const invIdx = inventory.findIndex((i) => i.branch_id === po.branch_id && i.product_id === delta.product_id);
    let prevStock = 0;
    let newStock = qtyToAdd;

    if (invIdx !== -1) {
      prevStock = Number(inventory[invIdx].quantity) || 0;
      newStock = prevStock + qtyToAdd;
      inventory[invIdx].quantity = newStock;
      inventory[invIdx].updated_at = now;
    } else {
      inventory.push({
        id: `inv-${Date.now()}-${delta.product_id}`,
        business_id: businessId,
        branch_id: po.branch_id,
        product_id: delta.product_id,
        quantity: newStock,
        min_quantity: 5,
        reorder_point: 10,
        location_in_store: 'Main Shelf',
        created_at: now,
        updated_at: now,
      });
    }

    movements.unshift({
      id: `mov-${Date.now()}-${delta.product_id}`,
      business_id: businessId,
      branch_id: po.branch_id,
      product_id: delta.product_id,
      movement_type: 'purchase',
      quantity: qtyToAdd,
      previous_stock: prevStock,
      new_stock: newStock,
      reason: `Goods received against PO #${po.po_number}`,
      reference_id: po.po_number,
      created_by: userId || 'demo-user-1',
      created_at: now,
    });
  });

  saveStoredInventory(inventory);
  saveStoredMovements(movements);

  return orders[orderIdx];
}

export interface RecordPurchasePaymentInput {
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  reference_number?: string | null;
  notes?: string | null;
}

export async function recordPurchasePayment(
  businessId: string,
  poId: string,
  input: RecordPurchasePaymentInput,
  userId?: string | null
): Promise<PurchasePayment> {
  const po = await fetchPurchaseOrderById(poId);
  if (!po) throw new Error('Purchase Order not found');

  const payAmount = Number(input.amount);
  if (payAmount <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }
  if (payAmount > po.due_amount + 0.01) {
    throw new Error(`Payment amount (TZS ${payAmount.toLocaleString()}) cannot exceed remaining balance (TZS ${po.due_amount.toLocaleString()})`);
  }

  const now = new Date().toISOString();
  const newPayment: PurchasePayment = {
    id: `pp-${Date.now()}`,
    business_id: businessId,
    purchase_order_id: poId,
    supplier_id: po.supplier_id,
    amount: payAmount,
    payment_method: input.payment_method || 'bank_transfer',
    payment_date: input.payment_date || now,
    reference_number: input.reference_number?.trim() || null,
    notes: input.notes?.trim() || null,
    created_by: userId || null,
    created_at: now,
  };

  const newPaidAmount = po.paid_amount + payAmount;
  const newDueAmount = Math.max(0, po.grand_total - newPaidAmount);
  const newPaymentStatus: PurchaseOrderPaymentStatus = newDueAmount <= 0.01 ? 'paid' : 'partial';

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('purchase_payments')
        .insert({
          business_id: businessId,
          purchase_order_id: poId,
          supplier_id: po.supplier_id,
          amount: payAmount,
          payment_method: newPayment.payment_method,
          payment_date: newPayment.payment_date,
          reference_number: newPayment.reference_number,
          notes: newPayment.notes,
          created_by: userId || null,
        })
        .select('*, creator:profiles(*)')
        .single();

      if (!error && data) {
        // Update PO paid and due amounts
        await supabase
          .from('purchase_orders')
          .update({
            paid_amount: newPaidAmount,
            due_amount: newDueAmount,
            payment_status: newPaymentStatus,
            updated_at: now,
          })
          .eq('id', poId);

        // Update supplier balance & paid totals
        const { data: supp } = await supabase.from('suppliers').select('current_balance, total_paid_amount').eq('id', po.supplier_id).single();
        if (supp) {
          await supabase
            .from('suppliers')
            .update({
              current_balance: Math.max(0, Number(supp.current_balance || 0) - payAmount),
              total_paid_amount: Number(supp.total_paid_amount || 0) + payAmount,
              updated_at: now,
            })
            .eq('id', po.supplier_id);
        }

        return data as PurchasePayment;
      }
    } catch (err) {
      console.warn('Supabase recordPurchasePayment error, falling back:', err);
    }
  }

  // Fallback
  const payments = getStoredPurchasePayments();
  payments.unshift(newPayment);
  saveStoredPurchasePayments(payments);

  const orders = getStoredPurchases();
  const oIdx = orders.findIndex((o) => o.id === poId);
  if (oIdx !== -1) {
    orders[oIdx].paid_amount = newPaidAmount;
    orders[oIdx].due_amount = newDueAmount;
    orders[oIdx].payment_status = newPaymentStatus;
    orders[oIdx].updated_at = now;
    saveStoredPurchases(orders);
  }

  const suppliers = getStoredSuppliers();
  const sIdx = suppliers.findIndex((s) => s.id === po.supplier_id);
  if (sIdx !== -1) {
    suppliers[sIdx].current_balance = Math.max(0, (suppliers[sIdx].current_balance || 0) - payAmount);
    suppliers[sIdx].total_paid_amount = (suppliers[sIdx].total_paid_amount || 0) + payAmount;
    saveStoredSuppliers(suppliers);
  }

  return newPayment;
}

export async function createPurchaseReturn(
  businessId: string,
  poId: string,
  returnItems: { item_id: string; product_id: string; product_name: string; quantity: number; unit_cost: number; reason: string }[],
  reason: string,
  notes?: string | null,
  userId?: string | null
): Promise<PurchaseReturn> {
  const po = await fetchPurchaseOrderById(poId);
  if (!po) throw new Error('Purchase Order not found');

  const now = new Date().toISOString();
  const returnNumber = `PRET-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  let totalRefund = 0;
  const calcItems = returnItems.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const cost = Number(item.unit_cost) || 0;
    const total = qty * cost;
    totalRefund += total;
    return {
      id: `preti-${Date.now()}-${idx}`,
      return_id: '',
      purchase_item_id: item.item_id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: qty,
      unit_cost: cost,
      total_amount: total,
      reason: item.reason,
      created_at: now,
    };
  });

  const newReturn: PurchaseReturn = {
    id: `pret-${Date.now()}`,
    business_id: businessId,
    branch_id: po.branch_id,
    purchase_order_id: poId,
    supplier_id: po.supplier_id,
    return_number: returnNumber,
    return_date: now.slice(0, 10),
    total_refund_amount: totalRefund,
    reason,
    notes: notes || null,
    created_by: userId || null,
    created_at: now,
    items: calcItems,
  };

  // Decrement inventory for returned products and add stock movements
  const inventory = getStoredInventory();
  const movements = getStoredMovements();

  returnItems.forEach((r) => {
    const invIdx = inventory.findIndex((i) => i.branch_id === po.branch_id && i.product_id === r.product_id);
    let prevStock = 0;
    let newStock = 0;
    if (invIdx !== -1) {
      prevStock = Number(inventory[invIdx].quantity) || 0;
      newStock = Math.max(0, prevStock - Number(r.quantity));
      inventory[invIdx].quantity = newStock;
    }

    movements.unshift({
      id: `mov-${Date.now()}-${r.product_id}`,
      business_id: businessId,
      branch_id: po.branch_id,
      product_id: r.product_id,
      movement_type: 'return',
      quantity: -Number(r.quantity),
      previous_stock: prevStock,
      new_stock: newStock,
      reason: `Returned to Supplier (${po.supplier?.name || 'Supplier'}): ${r.reason}`,
      reference_id: returnNumber,
      created_by: userId || 'demo-user-1',
      created_at: now,
    });
  });

  saveStoredInventory(inventory);
  saveStoredMovements(movements);

  // Reduce supplier balance
  const suppliers = getStoredSuppliers();
  const sIdx = suppliers.findIndex((s) => s.id === po.supplier_id);
  if (sIdx !== -1) {
    suppliers[sIdx].current_balance = Math.max(0, (suppliers[sIdx].current_balance || 0) - totalRefund);
    saveStoredSuppliers(suppliers);
  }

  return newReturn;
}

export async function updatePurchaseOrderStatus(
  poId: string,
  status: PurchaseOrderStatus
): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('purchase_orders')
        .update({ status, updated_at: now })
        .eq('id', poId);
      return;
    } catch (err) {
      console.warn('Supabase updatePurchaseOrderStatus error, falling back:', err);
    }
  }

  const orders = getStoredPurchases();
  const idx = orders.findIndex((o) => o.id === poId);
  if (idx !== -1) {
    orders[idx].status = status;
    orders[idx].updated_at = now;
    saveStoredPurchases(orders);
  }
}

export function exportPurchasesToCSV(orders: PurchaseOrder[]) {
  const headers = [
    'PO Number',
    'Supplier',
    'Order Date',
    'Expected Delivery',
    'Status',
    'Payment Status',
    'Subtotal',
    'Tax Amount',
    'Grand Total',
    'Paid Amount',
    'Due Amount',
  ];

  const rows = orders.map((o) => [
    `"${o.po_number}"`,
    `"${(o.supplier?.name || '').replace(/"/g, '""')}"`,
    o.order_date,
    o.expected_delivery_date || '',
    o.status,
    o.payment_status,
    o.subtotal,
    o.tax_amount,
    o.grand_total,
    o.paid_amount,
    o.due_amount,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function fetchPurchasingStats(
  businessId: string,
  branchId?: string | null
): Promise<PurchasingStats> {
  const { orders } = await fetchPurchaseOrders(businessId, { branchId, pageSize: 1000 });

  const totalOrders = orders.length;
  const totalPurchasesAmount = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0);
  const totalPayablesDue = orders.reduce((sum, o) => sum + (o.due_amount || 0), 0);
  const pendingDeliveriesCount = orders.filter((o) => o.status === 'ordered').length;
  const partiallyReceivedCount = orders.filter((o) => o.status === 'partially_received').length;
  const draftsCount = orders.filter((o) => o.status === 'draft').length;

  return {
    totalOrders,
    totalPurchasesAmount,
    totalPaid,
    totalPayablesDue,
    pendingDeliveriesCount,
    partiallyReceivedCount,
    draftsCount,
  };
}

