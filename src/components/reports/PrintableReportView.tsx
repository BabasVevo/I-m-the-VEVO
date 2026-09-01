import type {
  ReportsSummary,
  SalesReportData,
  ProfitLossReportData,
  InventoryReportData,
  ExpenseReportData,
  PurchaseReportData,
  CustomerReportData,
} from '@/services/reportService';
import { formatCurrency } from '@/lib/format';

interface PrintableReportViewProps {
  reportType: 'dashboard' | 'sales' | 'pnl' | 'inventory' | 'expenses' | 'purchases' | 'customers';
  periodLabel: string;
  branchName: string;
  summary: ReportsSummary;
  salesData?: SalesReportData;
  pnlData?: ProfitLossReportData;
  inventoryData?: InventoryReportData;
  expenseData?: ExpenseReportData;
  purchaseData?: PurchaseReportData;
  customerData?: CustomerReportData;
  currency?: string;
}

export function PrintableReportView({
  reportType,
  periodLabel,
  branchName,
  summary,
  salesData,
  pnlData,
  inventoryData,
  expenseData,
  purchaseData,
  customerData,
  currency = 'BIF',
}: PrintableReportViewProps) {
  return (
    <div className="hidden print:block print:p-8 bg-white text-black font-sans">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black tracking-tight">BABAS POS & INVENTORY</h1>
          <p className="text-sm font-semibold uppercase text-gray-700">
            Business Intelligence & Analytics Report
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Report Type: <span className="font-bold text-black uppercase">{reportType}</span> | Location: <span className="font-bold text-black">{branchName}</span>
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-bold">Period: {periodLabel}</p>
          <p className="text-gray-600">Printed: {new Date().toLocaleString()}</p>
          <p className="text-gray-600">Currency: {currency}</p>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8 border border-gray-300 p-4 rounded-lg bg-gray-50">
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Net Sales</div>
          <div className="text-lg font-black">{formatCurrency(summary.totalSalesNet, currency)}</div>
          <div className="text-[10px] text-gray-600">{summary.totalTransactions} transactions</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Gross Profit</div>
          <div className="text-lg font-black">{formatCurrency(summary.grossProfit, currency)}</div>
          <div className="text-[10px] text-gray-600">Margin: {summary.grossProfitMargin.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Operating Expenses</div>
          <div className="text-lg font-black">{formatCurrency(summary.totalExpenses, currency)}</div>
          <div className="text-[10px] text-gray-600">Overhead</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold">Net Operating Profit</div>
          <div className="text-lg font-black">{formatCurrency(summary.netProfit, currency)}</div>
          <div className="text-[10px] text-gray-600">Net Margin: {summary.netProfitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Sales Content */}
      {reportType === 'sales' && salesData && (
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase border-b pb-1">Top Selling Products</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Product</th>
                <th className="py-1">SKU</th>
                <th className="py-1">Category</th>
                <th className="py-1 text-center">Units</th>
                <th className="py-1 text-right">Revenue</th>
                <th className="py-1 text-right">Profit</th>
                <th className="py-1 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesData.salesByProduct.slice(0, 25).map((p) => (
                <tr key={p.productId}>
                  <td className="py-1.5 font-medium">{p.productName}</td>
                  <td className="py-1.5 font-mono text-gray-600">{p.sku}</td>
                  <td className="py-1.5">{p.categoryName}</td>
                  <td className="py-1.5 text-center">{p.unitsSold}</td>
                  <td className="py-1.5 text-right font-semibold">{formatCurrency(p.revenue, currency)}</td>
                  <td className="py-1.5 text-right">{formatCurrency(p.grossProfit, currency)}</td>
                  <td className="py-1.5 text-right">{p.marginPercentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* P&L Content */}
      {reportType === 'pnl' && pnlData && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase border-b pb-1">Income Statement (Profit & Loss)</h2>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-gray-200">
              <tr className="font-bold bg-gray-100">
                <td className="py-2 pl-2">1. REVENUE</td>
                <td className="py-2 text-right pr-2">Amount</td>
                <td className="py-2 text-right pr-2">% Net Sales</td>
              </tr>
              <tr>
                <td className="py-1 pl-4">Gross Sales Revenue</td>
                <td className="py-1 text-right pr-2">{formatCurrency(pnlData.revenue.grossSales, currency)}</td>
                <td className="py-1 text-right pr-2"></td>
              </tr>
              <tr>
                <td className="py-1 pl-4 text-red-600">Less: Discounts & Returns</td>
                <td className="py-1 text-right pr-2">-{formatCurrency(pnlData.revenue.discounts + pnlData.revenue.returnsAndRefunds, currency)}</td>
                <td className="py-1 text-right pr-2"></td>
              </tr>
              <tr className="font-bold bg-blue-50">
                <td className="py-1.5 pl-2">NET SALES REVENUE</td>
                <td className="py-1.5 text-right pr-2">{formatCurrency(pnlData.revenue.netSales, currency)}</td>
                <td className="py-1.5 text-right pr-2">100.0%</td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="py-2 pl-2">2. COST OF GOODS SOLD</td>
                <td className="py-2 text-right pr-2">{formatCurrency(pnlData.costOfGoodsSold.totalCOGS, currency)}</td>
                <td className="py-2 text-right pr-2">{((pnlData.costOfGoodsSold.totalCOGS / (pnlData.revenue.netSales || 1)) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="font-bold bg-emerald-50 text-emerald-900">
                <td className="py-2 pl-2">3. GROSS PROFIT</td>
                <td className="py-2 text-right pr-2">{formatCurrency(pnlData.grossProfit, currency)}</td>
                <td className="py-2 text-right pr-2">{pnlData.grossMarginPercent.toFixed(1)}%</td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="py-2 pl-2" colSpan={3}>4. OPERATING EXPENSES</td>
              </tr>
              {pnlData.operatingExpenses.categoryBreakdown.map((cat) => (
                <tr key={cat.categoryId}>
                  <td className="py-1 pl-4">{cat.categoryName} ({cat.code})</td>
                  <td className="py-1 text-right pr-2">{formatCurrency(cat.amount, currency)}</td>
                  <td className="py-1 text-right pr-2">{cat.percentageOfRevenue.toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="font-bold bg-purple-50">
                <td className="py-1.5 pl-2">TOTAL OPERATING EXPENSES</td>
                <td className="py-1.5 text-right pr-2">{formatCurrency(pnlData.operatingExpenses.totalOperatingExpenses, currency)}</td>
                <td className="py-1.5 text-right pr-2">{((pnlData.operatingExpenses.totalOperatingExpenses / (pnlData.revenue.netSales || 1)) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="font-black text-sm bg-gray-900 text-white">
                <td className="py-2 pl-2">5. NET OPERATING PROFIT (EBIT)</td>
                <td className="py-2 text-right pr-2">{formatCurrency(pnlData.netOperatingProfit, currency)}</td>
                <td className="py-2 text-right pr-2">{pnlData.netMarginPercent.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Inventory Content */}
      {reportType === 'inventory' && inventoryData && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase border-b pb-1">Inventory Valuation Summary</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Category</th>
                <th className="py-1 text-center">Products</th>
                <th className="py-1 text-center">Total Quantity</th>
                <th className="py-1 text-right">Cost Value</th>
                <th className="py-1 text-right">Retail Value</th>
                <th className="py-1 text-right">Unrealized Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventoryData.categoryValuations.map((cat) => (
                <tr key={cat.categoryId}>
                  <td className="py-1.5 font-medium">{cat.categoryName}</td>
                  <td className="py-1.5 text-center">{cat.productCount}</td>
                  <td className="py-1.5 text-center">{cat.totalUnits}</td>
                  <td className="py-1.5 text-right">{formatCurrency(cat.costValue, currency)}</td>
                  <td className="py-1.5 text-right font-semibold">{formatCurrency(cat.retailValue, currency)}</td>
                  <td className="py-1.5 text-right">{cat.marginPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses Content */}
      {reportType === 'expenses' && expenseData && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase border-b pb-1">Operating Expense Breakdown</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Expense Category</th>
                <th className="py-1 text-center">Entries</th>
                <th className="py-1 text-right">Total Amount</th>
                <th className="py-1 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenseData.byCategory.map((cat) => (
                <tr key={cat.categoryId}>
                  <td className="py-1.5 font-medium">{cat.name}</td>
                  <td className="py-1.5 text-center">{cat.count}</td>
                  <td className="py-1.5 text-right font-semibold">{formatCurrency(cat.amount, currency)}</td>
                  <td className="py-1.5 text-right">{cat.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchases Content */}
      {reportType === 'purchases' && purchaseData && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase border-b pb-1">Procurement & Supplier Purchases</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Supplier Name</th>
                <th className="py-1 text-center">Orders</th>
                <th className="py-1 text-right">Total Ordered</th>
                <th className="py-1 text-right">Paid Amount</th>
                <th className="py-1 text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchaseData.bySupplier.map((sup) => (
                <tr key={sup.supplierId}>
                  <td className="py-1.5 font-medium">{sup.supplierName}</td>
                  <td className="py-1.5 text-center">{sup.ordersCount}</td>
                  <td className="py-1.5 text-right font-semibold">{formatCurrency(sup.totalAmount, currency)}</td>
                  <td className="py-1.5 text-right text-emerald-700">{formatCurrency(sup.paidAmount, currency)}</td>
                  <td className="py-1.5 text-right text-rose-700 font-bold">{formatCurrency(sup.dueAmount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customers Content */}
      {reportType === 'customers' && customerData && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase border-b pb-1">Top Customer Accounts & Receivables</h2>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Customer</th>
                <th className="py-1">Type</th>
                <th className="py-1 text-center">Orders</th>
                <th className="py-1 text-right">Total Spent</th>
                <th className="py-1 text-right">Receivable Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customerData.topCustomers.slice(0, 20).map((c) => (
                <tr key={c.customerId}>
                  <td className="py-1.5 font-medium">{c.name}</td>
                  <td className="py-1.5 uppercase">{c.customerType}</td>
                  <td className="py-1.5 text-center">{c.ordersCount}</td>
                  <td className="py-1.5 text-right font-semibold">{formatCurrency(c.totalSpent, currency)}</td>
                  <td className="py-1.5 text-right font-bold text-rose-700">{c.creditBalance > 0 ? formatCurrency(c.creditBalance, currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-400 flex justify-between text-[10px] text-gray-500">
        <span>BABAS Enterprise POS & Inventory System</span>
        <span>Confidential Internal Financial & Operational Document</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}
