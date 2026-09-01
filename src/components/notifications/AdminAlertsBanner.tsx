import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  FileCheck2,
  Truck,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchAllPendingApprovals } from '@/services/approvalService';
import { getStoredProducts, getStoredInventory } from '@/services/productService';
import { getStoredSuppliers } from '@/services/supplierService';

interface AdminAlertStats {
  outOfStockCount: number;
  lowStockCount: number;
  pendingExpensesCount: number;
  pendingPurchasesCount: number;
  overdueSuppliersCount: number;
}

export function AdminAlertsBanner() {
  const { business, branch, role } = useAuth();
  const businessId = business?.id || 'demo-biz-1';
  const branchId = branch?.id || null;

  const [dismissed, setDismissed] = useState(false);
  const [stats, setStats] = useState<AdminAlertStats>({
    outOfStockCount: 0,
    lowStockCount: 0,
    pendingExpensesCount: 0,
    pendingPurchasesCount: 0,
    overdueSuppliersCount: 0,
  });

  const isAuthorized =
    role?.name === 'super_admin' ||
    role?.name === 'admin' ||
    role?.name === 'business_owner' ||
    role?.name === 'branch_manager';

  useEffect(() => {
    if (!isAuthorized) return;

    async function checkAlerts() {
      try {
        const [apprRes] = await Promise.all([fetchAllPendingApprovals(businessId, branchId)]);

        const products = getStoredProducts();
        const inventory = getStoredInventory();
        let outOfStock = 0;
        let lowStock = 0;

        for (const prod of products) {
          const inv = inventory.filter((i) => i.product_id === prod.id);
          const totalQty = inv.reduce((sum, item) => sum + item.quantity, 0);
          const threshold = prod.min_stock_level || 10;
          if (totalQty <= 0) {
            outOfStock++;
          } else if (totalQty <= threshold) {
            lowStock++;
          }
        }

        const suppliers = getStoredSuppliers();
        const overdueSuppliers = suppliers.filter(
          (s) => s.current_balance >= 1000000 && s.status === 'active'
        ).length;

        const pendingExpenses = apprRes.items.filter((i) => i.entity_type === 'expense').length;
        const pendingPurchases = apprRes.items.filter((i) => i.entity_type === 'purchase_order').length;

        setStats({
          outOfStockCount: outOfStock,
          lowStockCount: lowStock,
          pendingExpensesCount: pendingExpenses,
          pendingPurchasesCount: pendingPurchases,
          overdueSuppliersCount: overdueSuppliers,
        });
      } catch (err) {
        console.warn('Error loading admin alert stats:', err);
      }
    }

    checkAlerts();
  }, [businessId, branchId, isAuthorized]);

  if (!isAuthorized || dismissed) return null;

  const totalUrgent =
    stats.outOfStockCount +
    stats.pendingExpensesCount +
    stats.pendingPurchasesCount +
    stats.overdueSuppliersCount;

  if (totalUrgent === 0 && stats.lowStockCount === 0) return null;

  return (
    <div
      id="admin-alerts-banner"
      className="relative mb-6 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 p-4 shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:bg-amber-500/30 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Action Required ({totalUrgent} Pending Items)
              </h4>
              <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                Manager Notice
              </span>
            </div>
            <p className="mt-0.5 text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Items require immediate operational review or management sign-off to maintain smooth business continuity.
            </p>

            {/* Quick Badges and Links */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {stats.outOfStockCount > 0 && (
                <Link
                  to="/stock"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100/80 px-2.5 py-1 text-xs font-bold text-rose-800 transition hover:bg-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:hover:bg-rose-900"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{stats.outOfStockCount} Out of Stock</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}

              {stats.lowStockCount > 0 && (
                <Link
                  to="/stock"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/80 px-2.5 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-800"
                >
                  <Boxes className="h-3.5 w-3.5" />
                  <span>{stats.lowStockCount} Low Stock</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}

              {(stats.pendingExpensesCount > 0 || stats.pendingPurchasesCount > 0) && (
                <Link
                  to="/approvals"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100/80 px-2.5 py-1 text-xs font-bold text-indigo-900 transition hover:bg-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>
                    {stats.pendingExpensesCount + stats.pendingPurchasesCount} Pending Approvals
                  </span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}

              {stats.overdueSuppliersCount > 0 && (
                <Link
                  to="/suppliers"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100/80 px-2.5 py-1 text-xs font-bold text-blue-900 transition hover:bg-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>{stats.overdueSuppliersCount} Overdue Payables</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-amber-700/70 hover:bg-amber-200/60 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/60 dark:hover:text-amber-200"
          title="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
