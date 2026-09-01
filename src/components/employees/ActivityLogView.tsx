import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Download,
  User,
  Shield,
  Receipt,
  Boxes,
  Truck,
  CreditCard,
  Settings,
  Info,
  RefreshCw,
} from 'lucide-react';
import type { ActivityLog, ActivityActionCategory, Employee, Branch } from '@/types/database';
import { getActivityLogs, exportActivityLogsAsCSV } from '@/services/activityLogService';

interface ActivityLogViewProps {
  employees: Employee[];
  branches: Branch[];
}

export function ActivityLogView({ employees, branches }: ActivityLogViewProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [inspectLog, setInspectLog] = useState<ActivityLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string | undefined = undefined;
      const now = Date.now();
      if (selectedTimeRange === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        startDate = d.toISOString();
      } else if (selectedTimeRange === '7days') {
        startDate = new Date(now - 7 * 86400000).toISOString();
      } else if (selectedTimeRange === '30days') {
        startDate = new Date(now - 30 * 86400000).toISOString();
      }

      const res = await getActivityLogs({
        actionCategory: selectedCategory,
        employeeId: selectedEmployee,
        branchId: selectedBranch,
        search: search.trim() || undefined,
        startDate,
        limit: 100,
      });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedEmployee, selectedBranch, selectedTimeRange, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getCategoryBadge = (cat: ActivityActionCategory) => {
    switch (cat) {
      case 'auth':
        return {
          label: 'Auth & Login',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Shield,
        };
      case 'sales':
        return {
          label: 'Sales & POS',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Receipt,
        };
      case 'inventory':
        return {
          label: 'Inventory',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Boxes,
        };
      case 'purchases':
        return {
          label: 'Purchases',
          color: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Truck,
        };
      case 'expenses':
        return {
          label: 'Expenses',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: CreditCard,
        };
      case 'employees':
        return {
          label: 'Staff & Roles',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: User,
        };
      case 'settings':
        return {
          label: 'Settings',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Settings,
        };
      default:
        return {
          label: cat,
          color: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Info,
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by keyword, staff name, receipt or PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Event Categories</option>
              <option value="auth">Auth & Logins</option>
              <option value="sales">Sales & Receipts</option>
              <option value="inventory">Inventory & Stock</option>
              <option value="purchases">Purchases & Orders</option>
              <option value="expenses">Expenses & Petty Cash</option>
              <option value="employees">Staff & Roles</option>
              <option value="settings">Settings & Config</option>
            </select>

            {/* Branch */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Employee */}
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Staff Members</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.job_title?.split(' ')[0] || 'Staff'})
                </option>
              ))}
            </select>

            {/* Timeframe */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchLogs}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Refresh Activity Log"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={() => exportActivityLogsAsCSV(logs)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
            <span>Loading security audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No activity logs recorded</h4>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search or filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">User / Staff</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action Summary</th>
                  <th className="py-3 px-4">Related Record</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {logs.map((log) => {
                  const badge = getCategoryBadge(log.action_category);
                  const Icon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Staff */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              log.employee_avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                log.employee_name
                              )}&background=0D8ABC&color=fff`
                            }
                            alt={log.employee_name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {log.employee_name}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {log.employee_role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Summary */}
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {log.description}
                      </td>

                      {/* Related Record */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.entity_label ? (
                          <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {log.entity_label}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Inspect details button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectLog(log)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="View raw event details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Audit Event Metadata</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Event ID:</span>
                  <span className="font-mono text-slate-800">{inspectLog.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Timestamp:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(inspectLog.created_at).toISOString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Actor / Staff:</span>
                  <span className="font-bold text-slate-900">
                    {inspectLog.employee_name} ({inspectLog.employee_role})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Action Type:</span>
                  <span className="font-mono font-semibold text-primary-700">
                    {inspectLog.action_type}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Branch Location:</span>
                  <span className="text-slate-800">{inspectLog.branch_name || 'Flagship HQ'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Client IP Address:</span>
                  <span className="font-mono text-slate-800">{inspectLog.ip_address || '197.234.12.8'}</span>
                </div>
              </div>

              {inspectLog.details && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Payload JSON:</span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(inspectLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
