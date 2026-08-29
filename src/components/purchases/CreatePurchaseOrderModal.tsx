import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  Package,
} from 'lucide-react';
import type {
  Supplier,
  Product,
  PaymentTerms,
  PurchaseOrderStatus,
} from '@/types/database';
import { formatCurrency, PAYMENT_TERMS_LABELS } from '@/lib/format';
import { fetchProducts } from '@/services/productService';
import { fetchSuppliers } from '@/services/supplierService';
import { useAuth } from '@/context/AuthContext';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  preselectedSupplierId?: string | null;
  currency?: string;
  onClose: () => void;
  onSubmit: (data: {
    branch_id: string;
    supplier_id: string;
    order_date: string;
    expected_delivery_date: string | null;
    payment_terms: PaymentTerms;
    status: PurchaseOrderStatus;
    notes: string | null;
    items: Array<{
      product_id?: string | null;
      product_name: string;
      sku?: string | null;
      unit: string;
      quantity_ordered: number;
      unit_cost: number;
      discount_amount?: number;
      tax_rate?: number;
    }>;
  }) => Promise<void>;
}

interface OrderItemRow {
  product_id?: string | null;
  product_name: string;
  sku?: string | null;
  unit: string;
  quantity_ordered: number;
  unit_cost: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
}

export function CreatePurchaseOrderModal({
  isOpen,
  preselectedSupplierId,
  currency = 'TZS',
  onClose,
  onSubmit,
}: CreatePurchaseOrderModalProps) {
  const { business, branch } = useAuth();
  const businessId = business?.id || 'demo-biz-1';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_30');
  const [notes, setNotes] = useState<string>('');
  const [poStatus, setPoStatus] = useState<PurchaseOrderStatus>('ordered');

  const [items, setItems] = useState<OrderItemRow[]>([
    {
      product_id: null,
      product_name: '',
      sku: '',
      unit: 'pcs',
      quantity_ordered: 1,
      unit_cost: 0,
      discount_amount: 0,
      tax_rate: 18,
      line_total: 0,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        fetchSuppliers(businessId, { pageSize: 200 }),
        fetchProducts({ pageSize: 500 }),
      ]);
      setSuppliers(supRes.suppliers);
      setProducts(prodRes.products);

      if (supRes.suppliers.length > 0 && !selectedSupplierId && !preselectedSupplierId) {
        setSelectedSupplierId(supRes.suppliers[0].id);
        setPaymentTerms(supRes.suppliers[0].payment_terms || 'net_30');
      }
    } catch (err) {
      console.error('Error loading suppliers/products:', err);
    }
  }, [businessId, selectedSupplierId, preselectedSupplierId]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (branch) {
        setSelectedBranchId(branch.id);
      }
      if (preselectedSupplierId) {
        setSelectedSupplierId(preselectedSupplierId);
      }
    }
  }, [isOpen, preselectedSupplierId, branch, loadInitialData]);

  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const found = suppliers.find((s) => s.id === supId);
    if (found?.payment_terms) {
      setPaymentTerms(found.payment_terms);
    }
  };

  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    const qty = newItems[index].quantity_ordered || 1;
    const cost = Number(prod.cost_price) || 0;
    const disc = newItems[index].discount_amount || 0;
    const taxRate = newItems[index].tax_rate ?? 18;
    const sub = qty * cost - disc;
    const tax = (sub * taxRate) / 100;

    newItems[index] = {
      product_id: prod.id,
      product_name: prod.name,
      sku: prod.sku || '',
      unit: prod.unit || 'pcs',
      quantity_ordered: qty,
      unit_cost: cost,
      discount_amount: disc,
      tax_rate: taxRate,
      line_total: sub + tax,
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItemRow, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    const qty = Number(newItems[index].quantity_ordered) || 0;
    const cost = Number(newItems[index].unit_cost) || 0;
    const disc = Number(newItems[index].discount_amount) || 0;
    const taxRate = Number(newItems[index].tax_rate) || 0;

    const sub = qty * cost - disc;
    const tax = (sub * taxRate) / 100;
    newItems[index].line_total = Math.max(0, sub + tax);
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_id: null,
        product_name: '',
        sku: '',
        unit: 'pcs',
        quantity_ordered: 1,
        unit_cost: 0,
        discount_amount: 0,
        tax_rate: 18,
        line_total: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Compute Totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity_ordered) || 0) * (Number(item.unit_cost) || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (Number(item.discount_amount) || 0), 0);
  const totalTax = items.reduce((sum, item) => {
    const itemSub = (Number(item.quantity_ordered) || 0) * (Number(item.unit_cost) || 0) - (Number(item.discount_amount) || 0);
    return sum + (itemSub * (Number(item.tax_rate) || 0)) / 100;
  }, 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  const handleSubmit = async (statusOverride?: PurchaseOrderStatus) => {
    if (!selectedSupplierId) {
      setError('Please select a supplier.');
      return;
    }
    const finalBranchId = selectedBranchId || branch?.id || 'branch-downtown';

    const validItems = items.filter((i) => i.product_name.trim() && i.quantity_ordered > 0);
    if (validItems.length === 0) {
      setError('Please add at least one valid product line item with quantity.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        branch_id: finalBranchId,
        supplier_id: selectedSupplierId,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || null,
        payment_terms: paymentTerms,
        status: statusOverride || poStatus,
        notes: notes.trim() || null,
        items: validItems.map((i) => ({
          product_id: i.product_id || null,
          product_name: i.product_name,
          sku: i.sku || null,
          unit: i.unit || 'pcs',
          quantity_ordered: Number(i.quantity_ordered),
          unit_cost: Number(i.unit_cost),
          discount_amount: Number(i.discount_amount) || 0,
          tax_rate: Number(i.tax_rate) || 0,
        })),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create Purchase Order.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs">
      <div
        id="create-po-modal"
        className="relative w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all dark:border-navy-800 dark:bg-navy-900 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Purchase Order</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Order goods and restock inventory directly from suppliers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-navy-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Supplier & Branch Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Supplier / Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city || 'Tanzania'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Delivery Branch / Destination
              </label>
              <input
                type="text"
                disabled
                value={branch?.name || 'Downtown Flagship'}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                {Object.entries(PAYMENT_TERMS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Initial PO Status
              </label>
              <select
                value={poStatus}
                onChange={(e) => setPoStatus(e.target.value as PurchaseOrderStatus)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              >
                <option value="ordered">Ordered / Sent to Supplier</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Package className="h-4 w-4" /> Ordered Products & Materials
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Item
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-navy-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 dark:bg-navy-950 dark:text-gray-400 border-b border-gray-200 dark:border-navy-800">
                  <tr>
                    <th className="px-3 py-2.5 min-w-[200px]">Product / Item Name</th>
                    <th className="px-3 py-2.5 w-20">Unit</th>
                    <th className="px-3 py-2.5 w-24">Qty Ordered</th>
                    <th className="px-3 py-2.5 w-32">Unit Cost (TZS)</th>
                    <th className="px-3 py-2.5 w-24">Tax (%)</th>
                    <th className="px-3 py-2.5 text-right w-32">Line Total</th>
                    <th className="px-2 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-navy-800 bg-white dark:bg-navy-900">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50">
                      <td className="p-2">
                        <div className="space-y-1">
                          <select
                            value={item.product_id || ''}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                          >
                            <option value="">-- Choose Catalog Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku || 'No SKU'})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Custom item name..."
                            value={item.product_name}
                            onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                            className="w-full rounded-md border border-gray-200 px-2 py-1 text-2xs text-gray-800 dark:border-navy-800 dark:bg-navy-950/60 dark:text-gray-200"
                          />
                        </div>
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={item.quantity_ordered}
                          onChange={(e) => handleItemChange(idx, 'quantity_ordered', e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={item.unit_cost}
                          onChange={(e) => handleItemChange(idx, 'unit_cost', e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                        />
                      </td>

                      <td className="p-2">
                        <select
                          value={item.tax_rate}
                          onChange={(e) => handleItemChange(idx, 'tax_rate', e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs text-gray-900 dark:border-navy-700 dark:bg-navy-950 dark:text-white"
                        >
                          <option value="0">0% Excl</option>
                          <option value="18">18% VAT</option>
                        </select>
                      </td>

                      <td className="p-2 text-right font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.line_total, currency)}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="text-gray-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes and Grand Total Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Order Notes & Special Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please deliver to downtown warehouse entrance before 2:00 PM."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-brand-500 focus:outline-hidden dark:border-navy-700 dark:bg-navy-950 dark:text-white"
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-navy-800 dark:bg-navy-950/60 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Total Tax / VAT (18%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalTax, currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-sm text-gray-900 dark:border-navy-800 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-base text-brand-600 dark:text-brand-400">
                  {formatCurrency(grandTotal, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('draft')}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-300 dark:hover:bg-navy-700"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('ordered')}
            className="rounded-lg bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {loading ? 'Creating...' : 'Submit & Order Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
