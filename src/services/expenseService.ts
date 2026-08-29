import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpenseStats,
  RecurringExpense,
  PaymentMethod,
} from '@/types/database';

export const DEMO_EXPENSE_CATEGORIES_KEY = 'verdant_demo_expense_categories_v1';
export const DEMO_EXPENSES_KEY = 'verdant_demo_expenses_v1';
export const DEMO_RECURRING_EXPENSES_KEY = 'verdant_demo_recurring_expenses_v1';

export const INITIAL_DEMO_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'expcat-rent',
    business_id: 'demo-biz-1',
    name: 'Rent & Lease',
    code: 'RENT',
    description: 'Store premises and warehouse leasing costs',
    color: 'amber',
    icon: 'Building2',
    is_active: true,
    expenses_count: 2,
    total_spent: 3500000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-salaries',
    business_id: 'demo-biz-1',
    name: 'Salaries & Wages',
    code: 'PAYROLL',
    description: 'Staff compensation, bonuses, and casual labor wages',
    color: 'emerald',
    icon: 'Users',
    is_active: true,
    expenses_count: 3,
    total_spent: 4200000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-utilities',
    business_id: 'demo-biz-1',
    name: 'Electricity & Water (TANESCO/DAWASA)',
    code: 'UTIL',
    description: 'Power grid tokens, clean water supply, and backup generator fuel',
    color: 'blue',
    icon: 'Zap',
    is_active: true,
    expenses_count: 4,
    total_spent: 850000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-internet',
    business_id: 'demo-biz-1',
    name: 'Internet & Telecom',
    code: 'NET',
    description: 'High-speed fiber optics, POS backup SIM cards, and VoIP subscriptions',
    color: 'indigo',
    icon: 'Wifi',
    is_active: true,
    expenses_count: 2,
    total_spent: 320000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-transport',
    business_id: 'demo-biz-1',
    name: 'Logistics & Transport',
    code: 'LOG',
    description: 'Inter-branch stock dispatch, courier fees, and cargo haulage',
    color: 'cyan',
    icon: 'Truck',
    is_active: true,
    expenses_count: 3,
    total_spent: 450000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-marketing',
    business_id: 'demo-biz-1',
    name: 'Marketing & Advertising',
    code: 'MKT',
    description: 'Social media promotions, billboard signage, flyers, and event sponsorships',
    color: 'purple',
    icon: 'Megaphone',
    is_active: true,
    expenses_count: 2,
    total_spent: 600000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-maintenance',
    business_id: 'demo-biz-1',
    name: 'Repairs & Maintenance',
    code: 'MAINT',
    description: 'Air conditioner servicing, espresso machine calibration, and store repairs',
    color: 'rose',
    icon: 'Wrench',
    is_active: true,
    expenses_count: 2,
    total_spent: 380000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-supplies',
    business_id: 'demo-biz-1',
    name: 'Office Supplies & Consumables',
    code: 'SUPP',
    description: 'Cleaning detergents, stationery, paper napkins, and store disposables',
    color: 'teal',
    icon: 'Package',
    is_active: true,
    expenses_count: 3,
    total_spent: 240000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'expcat-other',
    business_id: 'demo-biz-1',
    name: 'Miscellaneous / Other',
    code: 'MISC',
    description: 'Sundry administrative and incidental expenses',
    color: 'gray',
    icon: 'CreditCard',
    is_active: true,
    expenses_count: 1,
    total_spent: 120000,
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    category_id: 'expcat-rent',
    expense_number: 'EXP-2026-000401',
    expense_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    description: 'Monthly store rental payment for Downtown Flagship premises',
    amount: 2500000,
    tax_amount: 0,
    payment_method: 'bank_transfer',
    reference_number: 'TRX-NMB-884021',
    payee: 'Kivukoni Commercial Properties Ltd',
    status: 'paid',
    approved_by: 'demo-user-1',
    approved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    approval_notes: 'Verified against lease agreement.',
    paid_from_cash_register: false,
    notes: 'Paid via direct bank transfer from corporate operating account.',
    created_by: 'demo-user-1',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[0],
  },
  {
    id: 'exp-2',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    category_id: 'expcat-utilities',
    expense_number: 'EXP-2026-000402',
    expense_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    description: 'TANESCO 3-Phase Electricity Token Recharge (Meter #4410982)',
    amount: 350000,
    tax_amount: 0,
    payment_method: 'mobile_money',
    reference_number: 'M-PESA-QD9830219',
    payee: 'TANESCO',
    status: 'paid',
    approved_by: 'demo-user-1',
    approved_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    approval_notes: 'Auto-approved utility token',
    paid_from_cash_register: false,
    notes: '500 units purchased.',
    created_by: 'demo-user-1',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[2],
  },
  {
    id: 'exp-3',
    business_id: 'demo-biz-1',
    branch_id: 'branch-masaki',
    category_id: 'expcat-internet',
    expense_number: 'EXP-2026-000403',
    expense_date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    description: 'Dedicated Fiber Internet (50 Mbps Unlimited) Monthly Fee',
    amount: 180000,
    tax_amount: 0,
    payment_method: 'bank_transfer',
    reference_number: 'CRDB-NET-44901',
    payee: 'SimbaNET Tanzania',
    status: 'paid',
    approved_by: 'demo-user-1',
    approved_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    approval_notes: 'Monthly billing verified.',
    paid_from_cash_register: false,
    notes: null,
    created_by: 'demo-user-1',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[3],
  },
  {
    id: 'exp-4',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    category_id: 'expcat-supplies',
    expense_number: 'EXP-2026-000404',
    expense_date: new Date().toISOString().slice(0, 10),
    description: 'Emergency cleaning supplies and disinfectant spray from supermarket',
    amount: 45000,
    tax_amount: 0,
    payment_method: 'cash',
    reference_number: 'CSH-REC-019',
    payee: 'Shoppers Supermarket',
    status: 'paid',
    approved_by: 'demo-user-1',
    approved_at: new Date().toISOString(),
    approval_notes: 'Petty cash expense approved.',
    paid_from_cash_register: true,
    register_session_id: 'reg-session-today',
    notes: 'Paid from register drawer cash with physical receipt kept.',
    created_by: 'demo-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[7],
  },
  {
    id: 'exp-5',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    category_id: 'expcat-maintenance',
    expense_number: 'EXP-2026-000405',
    expense_date: new Date().toISOString().slice(0, 10),
    description: 'Commercial Espresso Machine quarterly gasket replacement and descaling service',
    amount: 220000,
    tax_amount: 0,
    payment_method: 'bank_transfer',
    reference_number: 'INV-TECH-8812',
    payee: 'Barista Tech Solutions Ltd',
    status: 'pending_approval',
    approved_by: null,
    approved_at: null,
    approval_notes: null,
    paid_from_cash_register: false,
    notes: 'Technician completed preventive servicing; awaiting manager approval for wire transfer.',
    created_by: 'demo-user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[6],
  },
];

export const INITIAL_DEMO_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    id: 'rec-1',
    business_id: 'demo-biz-1',
    branch_id: 'branch-downtown',
    category_id: 'expcat-rent',
    title: 'Downtown Flagship Store Rent',
    amount: 2500000,
    frequency: 'monthly',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    last_generated_date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    next_due_date: new Date(Date.now() + 27 * 86400000).toISOString().slice(0, 10),
    payment_method: 'bank_transfer',
    payee: 'Kivukoni Commercial Properties Ltd',
    is_active: true,
    auto_generate: false,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[0],
  },
  {
    id: 'rec-2',
    business_id: 'demo-biz-1',
    branch_id: 'branch-masaki',
    category_id: 'expcat-internet',
    title: 'SimbaNET Fiber Internet Connection',
    amount: 180000,
    frequency: 'monthly',
    start_date: '2026-01-01',
    end_date: null,
    last_generated_date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    next_due_date: new Date(Date.now() + 26 * 86400000).toISOString().slice(0, 10),
    payment_method: 'bank_transfer',
    payee: 'SimbaNET Tanzania',
    is_active: true,
    auto_generate: false,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    category: INITIAL_DEMO_EXPENSE_CATEGORIES[3],
  },
];

export function getStoredExpenseCategories(): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(DEMO_EXPENSE_CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_EXPENSE_CATEGORIES_KEY, JSON.stringify(INITIAL_DEMO_EXPENSE_CATEGORIES));
      return INITIAL_DEMO_EXPENSE_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_EXPENSE_CATEGORIES;
  }
}

export function saveStoredExpenseCategories(categories: ExpenseCategory[]) {
  localStorage.setItem(DEMO_EXPENSE_CATEGORIES_KEY, JSON.stringify(categories));
}

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(DEMO_EXPENSES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_EXPENSES_KEY, JSON.stringify(INITIAL_DEMO_EXPENSES));
      return INITIAL_DEMO_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_EXPENSES;
  }
}

export function saveStoredExpenses(expenses: Expense[]) {
  localStorage.setItem(DEMO_EXPENSES_KEY, JSON.stringify(expenses));
}

export function getStoredRecurringExpenses(): RecurringExpense[] {
  try {
    const raw = localStorage.getItem(DEMO_RECURRING_EXPENSES_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_RECURRING_EXPENSES_KEY, JSON.stringify(INITIAL_DEMO_RECURRING_EXPENSES));
      return INITIAL_DEMO_RECURRING_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_RECURRING_EXPENSES;
  }
}

export function saveStoredRecurringExpenses(recs: RecurringExpense[]) {
  localStorage.setItem(DEMO_RECURRING_EXPENSES_KEY, JSON.stringify(recs));
}

export function generateExpenseNumber(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `EXP-${currentYear}-${randomSuffix}`;
}

// ----------------------------------------------------
// Public Expense Category APIs
// ----------------------------------------------------

export async function fetchExpenseCategories(businessId: string): Promise<ExpenseCategory[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('business_id', businessId)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as ExpenseCategory[];
      }
    } catch (err) {
      console.warn('Supabase fetchExpenseCategories error, falling back:', err);
    }
  }

  const categories = getStoredExpenseCategories().filter(
    (c) => c.business_id === businessId || businessId === 'demo-biz-1'
  );
  return categories;
}

export async function createExpenseCategory(
  businessId: string,
  input: { name: string; code?: string; description?: string; color?: string; icon?: string }
): Promise<ExpenseCategory> {
  const now = new Date().toISOString();
  const newCat: ExpenseCategory = {
    id: `expcat-${Date.now()}`,
    business_id: businessId,
    name: input.name.trim(),
    code: input.code?.trim() || null,
    description: input.description?.trim() || null,
    color: input.color || 'emerald',
    icon: input.icon || 'CreditCard',
    is_active: true,
    expenses_count: 0,
    total_spent: 0,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({
          business_id: businessId,
          name: newCat.name,
          code: newCat.code,
          description: newCat.description,
          color: newCat.color,
          icon: newCat.icon,
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        return data as ExpenseCategory;
      }
    } catch (err) {
      console.warn('Supabase createExpenseCategory error, falling back:', err);
    }
  }

  const categories = getStoredExpenseCategories();
  categories.push(newCat);
  saveStoredExpenseCategories(categories);
  return newCat;
}

export async function updateExpenseCategory(
  categoryId: string,
  updates: Partial<ExpenseCategory>
): Promise<ExpenseCategory> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .update({ ...updates, updated_at: now })
        .eq('id', categoryId)
        .select()
        .single();

      if (!error && data) return data as ExpenseCategory;
    } catch (err) {
      console.warn('Supabase updateExpenseCategory error, falling back:', err);
    }
  }

  const categories = getStoredExpenseCategories();
  const idx = categories.findIndex((c) => c.id === categoryId);
  if (idx !== -1) {
    categories[idx] = { ...categories[idx], ...updates, updated_at: now };
    saveStoredExpenseCategories(categories);
    return categories[idx];
  }
  throw new Error('Category not found');
}

export async function deleteExpenseCategory(categoryId: string): Promise<boolean> {
  // Check if expenses exist for this category
  const expenses = getStoredExpenses();
  const inUse = expenses.some((e) => e.category_id === categoryId);
  if (inUse) {
    throw new Error('Cannot delete category because it contains associated expenses. Please reassign or archive instead.');
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('expense_categories').delete().eq('id', categoryId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteExpenseCategory error, falling back:', err);
    }
  }

  const categories = getStoredExpenseCategories();
  saveStoredExpenseCategories(categories.filter((c) => c.id !== categoryId));
  return true;
}

// ----------------------------------------------------
// Public Expense APIs
// ----------------------------------------------------

export interface FetchExpensesFilter {
  branchId?: string | null;
  categoryId?: string | null;
  status?: ExpenseStatus | 'all';
  paymentMethod?: PaymentMethod | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchExpenses(
  businessId: string,
  filter: FetchExpensesFilter = {}
): Promise<{ expenses: Expense[]; totalCount: number }> {
  const {
    branchId,
    categoryId,
    status = 'all',
    paymentMethod = 'all',
    search,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
  } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('expenses')
        .select('*, branch:branches(*), category:expense_categories(*), supplier:suppliers(*), creator:profiles(*), approver:profiles(*), attachments:expense_attachments(*)', { count: 'exact' })
        .eq('business_id', businessId);

      if (branchId) query = query.eq('branch_id', branchId);
      if (categoryId && categoryId !== 'all') query = query.eq('category_id', categoryId);
      if (status !== 'all') query = query.eq('status', status);
      if (paymentMethod !== 'all') query = query.eq('payment_method', paymentMethod);
      if (startDate) query = query.gte('expense_date', startDate);
      if (endDate) query = query.lte('expense_date', endDate);
      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`expense_number.ilike.%${q}%,description.ilike.%${q}%,payee.ilike.%${q}%,reference_number.ilike.%${q}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.order('expense_date', { ascending: false }).range(from, to);

      if (!error && data) {
        return {
          expenses: data as Expense[],
          totalCount: count || 0,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchExpenses error, falling back:', err);
    }
  }

  // Fallback
  let list = getStoredExpenses().filter((e) => e.business_id === businessId || businessId === 'demo-biz-1');
  const categories = getStoredExpenseCategories();

  list = list.map((e) => ({
    ...e,
    category: categories.find((c) => c.id === e.category_id) || e.category || null,
  }));

  if (branchId) list = list.filter((e) => e.branch_id === branchId);
  if (categoryId && categoryId !== 'all') list = list.filter((e) => e.category_id === categoryId);
  if (status !== 'all') list = list.filter((e) => e.status === status);
  if (paymentMethod !== 'all') list = list.filter((e) => e.payment_method === paymentMethod);
  if (startDate) list = list.filter((e) => e.expense_date >= startDate);
  if (endDate) list = list.filter((e) => e.expense_date <= endDate);
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.expense_number.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.payee && e.payee.toLowerCase().includes(q)) ||
        (e.reference_number && e.reference_number.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

  const totalCount = list.length;
  const paginated = list.slice((page - 1) * pageSize, page * pageSize);

  return {
    expenses: paginated,
    totalCount,
  };
}

export async function fetchExpenseById(expenseId: string): Promise<Expense | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, branch:branches(*), category:expense_categories(*), supplier:suppliers(*), creator:profiles(*), approver:profiles(*), attachments:expense_attachments(*)')
        .eq('id', expenseId)
        .maybeSingle();

      if (!error && data) return data as Expense;
    } catch (err) {
      console.warn('Supabase fetchExpenseById error, falling back:', err);
    }
  }

  const expenses = getStoredExpenses();
  const found = expenses.find((e) => e.id === expenseId) || null;
  return found;
}

export interface CreateExpenseInput {
  branch_id: string;
  category_id: string;
  expense_date: string;
  description: string;
  amount: number;
  tax_amount?: number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  payee?: string | null;
  supplier_id?: string | null;
  status?: ExpenseStatus;
  paid_from_cash_register?: boolean;
  notes?: string | null;
  attachments?: { file_name: string; file_type: string; file_size: number; file_url: string }[];
}

export async function createExpense(
  businessId: string,
  input: CreateExpenseInput,
  userId?: string | null
): Promise<Expense> {
  const expenseNumber = generateExpenseNumber();
  const now = new Date().toISOString();
  const amount = Number(input.amount) || 0;
  const status: ExpenseStatus = input.status || 'paid';

  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    business_id: businessId,
    branch_id: input.branch_id,
    category_id: input.category_id,
    expense_number: expenseNumber,
    expense_date: input.expense_date || now.slice(0, 10),
    description: input.description.trim(),
    amount,
    tax_amount: Number(input.tax_amount) || 0,
    payment_method: input.payment_method || 'cash',
    reference_number: input.reference_number?.trim() || null,
    payee: input.payee?.trim() || null,
    supplier_id: input.supplier_id || null,
    status,
    approved_by: status === 'paid' || status === 'approved' ? userId || null : null,
    approved_at: status === 'paid' || status === 'approved' ? now : null,
    approval_notes: null,
    paid_from_cash_register: Boolean(input.paid_from_cash_register),
    register_session_id: input.paid_from_cash_register ? 'reg-current' : null,
    notes: input.notes?.trim() || null,
    created_by: userId || null,
    created_at: now,
    updated_at: now,
    attachments: (input.attachments || []).map((a, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      expense_id: `exp-${Date.now()}`,
      file_name: a.file_name,
      file_type: a.file_type,
      file_size: a.file_size,
      file_url: a.file_url,
      uploaded_by: userId || null,
      created_at: now,
    })),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          business_id: businessId,
          branch_id: newExpense.branch_id,
          category_id: newExpense.category_id,
          expense_number: newExpense.expense_number,
          expense_date: newExpense.expense_date,
          description: newExpense.description,
          amount: newExpense.amount,
          tax_amount: newExpense.tax_amount,
          payment_method: newExpense.payment_method,
          reference_number: newExpense.reference_number,
          payee: newExpense.payee,
          supplier_id: newExpense.supplier_id,
          status: newExpense.status,
          approved_by: newExpense.approved_by,
          approved_at: newExpense.approved_at,
          paid_from_cash_register: newExpense.paid_from_cash_register,
          register_session_id: newExpense.register_session_id,
          notes: newExpense.notes,
          created_by: userId || null,
        })
        .select('*, branch:branches(*), category:expense_categories(*), supplier:suppliers(*)')
        .single();

      if (!error && data) {
        if (input.attachments && input.attachments.length > 0) {
          const atts = input.attachments.map((a) => ({
            expense_id: data.id,
            file_name: a.file_name,
            file_type: a.file_type,
            file_size: a.file_size,
            file_url: a.file_url,
            uploaded_by: userId || null,
          }));
          await supabase.from('expense_attachments').insert(atts);
        }
        return fetchExpenseById(data.id) as Promise<Expense>;
      }
    } catch (err) {
      console.warn('Supabase createExpense error, falling back:', err);
    }
  }

  // Fallback
  const expenses = getStoredExpenses();
  const categories = getStoredExpenseCategories();
  newExpense.category = categories.find((c) => c.id === newExpense.category_id) || null;
  expenses.unshift(newExpense);
  saveStoredExpenses(expenses);

  // Update category stats
  const catIdx = categories.findIndex((c) => c.id === input.category_id);
  if (catIdx !== -1) {
    categories[catIdx].expenses_count = (categories[catIdx].expenses_count || 0) + 1;
    categories[catIdx].total_spent = (categories[catIdx].total_spent || 0) + amount;
    saveStoredExpenseCategories(categories);
  }

  return newExpense;
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>
): Promise<Expense> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({ ...updates, updated_at: now })
        .eq('id', expenseId)
        .select('*, branch:branches(*), category:expense_categories(*), supplier:suppliers(*)')
        .single();

      if (!error && data) return data as Expense;
    } catch (err) {
      console.warn('Supabase updateExpense error, falling back:', err);
    }
  }

  const expenses = getStoredExpenses();
  const idx = expenses.findIndex((e) => e.id === expenseId);
  if (idx !== -1) {
    expenses[idx] = { ...expenses[idx], ...updates, updated_at: now };
    saveStoredExpenses(expenses);
    return expenses[idx];
  }
  throw new Error('Expense not found');
}

export async function approveExpense(
  expenseId: string,
  approverId: string,
  notes?: string
): Promise<Expense> {
  const now = new Date().toISOString();
  return updateExpense(expenseId, {
    status: 'approved',
    approved_by: approverId,
    approved_at: now,
    approval_notes: notes || 'Approved by management',
  });
}

export async function rejectExpense(
  expenseId: string,
  approverId: string,
  reason: string
): Promise<Expense> {
  const now = new Date().toISOString();
  return updateExpense(expenseId, {
    status: 'rejected',
    approved_by: approverId,
    approved_at: now,
    approval_notes: reason,
  });
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteExpense error, falling back:', err);
    }
  }

  const expenses = getStoredExpenses();
  saveStoredExpenses(expenses.filter((e) => e.id !== expenseId));
  return true;
}

// ----------------------------------------------------
// Recurring Expenses APIs
// ----------------------------------------------------

export async function fetchRecurringExpenses(
  businessId: string,
  branchId?: string | null
): Promise<RecurringExpense[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('recurring_expenses')
        .select('*, branch:branches(*), category:expense_categories(*)')
        .eq('business_id', businessId);

      if (branchId) query = query.eq('branch_id', branchId);
      const { data, error } = await query.order('next_due_date', { ascending: true });

      if (!error && data) return data as RecurringExpense[];
    } catch (err) {
      console.warn('Supabase fetchRecurringExpenses error, falling back:', err);
    }
  }

  let list = getStoredRecurringExpenses().filter(
    (r) => r.business_id === businessId || businessId === 'demo-biz-1'
  );
  if (branchId) list = list.filter((r) => r.branch_id === branchId);
  return list;
}

export async function createRecurringExpense(
  businessId: string,
  input: {
    branch_id: string;
    category_id: string;
    title: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    start_date: string;
    end_date?: string | null;
    next_due_date: string;
    payment_method: PaymentMethod;
    payee?: string | null;
    is_active?: boolean;
    auto_generate?: boolean;
  }
): Promise<RecurringExpense> {
  const now = new Date().toISOString();
  const newRec: RecurringExpense = {
    id: `rec-${Date.now()}`,
    business_id: businessId,
    branch_id: input.branch_id,
    category_id: input.category_id,
    title: input.title.trim(),
    amount: Number(input.amount) || 0,
    frequency: input.frequency || 'monthly',
    start_date: input.start_date,
    end_date: input.end_date || null,
    next_due_date: input.next_due_date,
    payment_method: input.payment_method || 'bank_transfer',
    payee: input.payee?.trim() || null,
    is_active: input.is_active ?? true,
    auto_generate: input.auto_generate ?? false,
    created_at: now,
    updated_at: now,
  };

  const recs = getStoredRecurringExpenses();
  const categories = getStoredExpenseCategories();
  newRec.category = categories.find((c) => c.id === newRec.category_id) || null;
  recs.push(newRec);
  saveStoredRecurringExpenses(recs);
  return newRec;
}

export async function deleteRecurringExpense(recurringId: string): Promise<boolean> {
  const recs = getStoredRecurringExpenses();
  saveStoredRecurringExpenses(recs.filter((r) => r.id !== recurringId));
  return true;
}

export async function generateExpenseFromRecurring(
  businessId: string,
  recurringId: string,
  userId?: string | null
): Promise<Expense> {
  const recs = getStoredRecurringExpenses();
  const rec = recs.find((r) => r.id === recurringId);
  if (!rec) throw new Error('Recurring schedule not found');

  const exp = await createExpense(
    businessId,
    {
      branch_id: rec.branch_id,
      category_id: rec.category_id,
      expense_date: new Date().toISOString().slice(0, 10),
      description: `Scheduled recurring: ${rec.title}`,
      amount: rec.amount,
      payment_method: rec.payment_method,
      payee: rec.payee,
      status: 'pending_approval',
      notes: `Generated automatically from recurring schedule #${rec.title}`,
    },
    userId
  );

  // Update last generated date
  const now = new Date();
  rec.last_generated_date = now.toISOString().slice(0, 10);
  // Bump next due date
  if (rec.frequency === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else if (rec.frequency === 'weekly') {
    now.setDate(now.getDate() + 7);
  } else if (rec.frequency === 'quarterly') {
    now.setMonth(now.getMonth() + 3);
  } else if (rec.frequency === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  }
  rec.next_due_date = now.toISOString().slice(0, 10);
  saveStoredRecurringExpenses(recs);

  return exp;
}

export async function fetchExpenseStats(
  businessId: string,
  branchId?: string | null
): Promise<ExpenseStats> {
  const { expenses } = await fetchExpenses(businessId, { branchId, pageSize: 1000 });

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthPrefix = todayStr.slice(0, 7);

  const totalExpensesToday = expenses
    .filter((e) => e.expense_date === todayStr && (e.status === 'paid' || e.status === 'approved'))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalExpensesThisMonth = expenses
    .filter((e) => e.expense_date.startsWith(currentMonthPrefix) && (e.status === 'paid' || e.status === 'approved'))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const pendingApprovalExpenses = expenses.filter((e) => e.status === 'pending_approval');
  const pendingApprovalCount = pendingApprovalExpenses.length;
  const pendingApprovalAmount = pendingApprovalExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const approvedPaidThisMonth = expenses
    .filter((e) => e.expense_date.startsWith(currentMonthPrefix) && (e.status === 'paid' || e.status === 'approved'))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    totalExpensesToday,
    totalExpensesThisMonth,
    pendingApprovalCount,
    pendingApprovalAmount,
    approvedPaidThisMonth,
  };
}
