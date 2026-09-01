import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Customer,
  CustomerType,
  CustomerStatus,
  CustomerGender,
  Tag,
  CustomerTagAssignment,
  CustomerNote,
  CustomerNoteType,
  CustomerActivity,
  CustomerActivityType,
  CustomerSegment,
  SegmentSettings,
  CustomerPurchasedProduct,
  CustomerBranchHistory,
  CustomerStatsSummary,
  CustomerStats,
  Sale,
} from '@/types/database';

export const DEMO_CUSTOMERS_KEY = 'verdant_demo_customers_v3';
export const DEMO_TAGS_KEY = 'verdant_demo_tags_v1';
export const DEMO_TAG_ASSIGNMENTS_KEY = 'verdant_demo_tag_assignments_v1';
export const DEMO_CUSTOMER_NOTES_KEY = 'verdant_demo_customer_notes_v1';
export const DEMO_CUSTOMER_ACTIVITY_KEY = 'verdant_demo_customer_activity_v1';
export const DEMO_SEGMENTS_KEY = 'verdant_demo_segments_v1';
export const DEMO_SEGMENT_SETTINGS_KEY = 'verdant_demo_segment_settings_v1';

export const DEFAULT_SEGMENT_SETTINGS: SegmentSettings = {
  new_customer_days: 30,
  active_customer_days: 30,
  regular_order_count: 3,
  vip_spend_threshold: 1500000,
  high_value_spend_threshold: 3000000,
  inactive_days: 60,
  at_risk_min_days: 30,
  at_risk_max_days: 60,
  lost_customer_days: 90,
};

export const INITIAL_DEMO_TAGS: Tag[] = [
  { id: 'tag-1', business_id: 'demo-biz-1', name: 'VIP', color: 'purple', description: 'Top tier high value clients', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'tag-2', business_id: 'demo-biz-1', name: 'Wholesale', color: 'blue', description: 'Bulk order commercial buyers', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'tag-3', business_id: 'demo-biz-1', name: 'Regular', color: 'emerald', description: 'Frequent repeat shoppers', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'tag-4', business_id: 'demo-biz-1', name: 'Corporate', color: 'amber', description: 'Registered business accounts', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'tag-5', business_id: 'demo-biz-1', name: 'Local Resident', color: 'cyan', description: 'Neighborhood walk-in clients', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'tag-6', business_id: 'demo-biz-1', name: 'Loyalty Member', color: 'rose', description: 'Enrolled in loyalty rewards', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: 'tag-7', business_id: 'demo-biz-1', name: 'High Value', color: 'indigo', description: 'High basket size spender', created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
];

export const INITIAL_DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    business_id: 'demo-biz-1',
    name: 'Fatma Juma',
    first_name: 'Fatma',
    last_name: 'Juma',
    email: 'fatma.juma@gmail.com',
    phone: '+255 754 112 233',
    address: '12 Msasani Peninsula',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    date_of_birth: '1988-04-12',
    gender: 'female',
    customer_type: 'vip',
    notes: 'Prefers organic and premium roast coffee blends. Always requests receipt via WhatsApp.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 1500000,
    current_balance: 0,
    total_orders: 8,
    total_spent: 2450000,
    total_refunded: 0,
    first_purchase_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 65 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'cust-2',
    business_id: 'demo-biz-1',
    name: 'John Mwangi',
    first_name: 'John',
    last_name: 'Mwangi',
    email: 'john.mwangi@safari.co.tz',
    phone: '+255 788 445 566',
    address: 'Haile Selassie Rd, Masaki',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    date_of_birth: '1982-11-23',
    gender: 'male',
    customer_type: 'wholesale',
    notes: 'Tour company purchasing bulk coffee beans and teas for safari lodges monthly.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 5000000,
    current_balance: 450000,
    total_orders: 14,
    total_spent: 6890000,
    total_refunded: 50000,
    first_purchase_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 130 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'cust-3',
    business_id: 'demo-biz-1',
    name: 'Neema Kimaro',
    first_name: 'Neema',
    last_name: 'Kimaro',
    email: 'neema.kimaro@outlook.com',
    phone: '+255 713 998 877',
    address: 'Mwai Kibaki Rd, Mikocheni',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    date_of_birth: '1995-07-19',
    gender: 'female',
    customer_type: 'regular',
    notes: 'Buys pastries and cold brew every weekday morning.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 300000,
    current_balance: 0,
    total_orders: 22,
    total_spent: 890000,
    total_refunded: 0,
    first_purchase_at: new Date(Date.now() - 50 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 52 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'cust-4',
    business_id: 'demo-biz-1',
    name: 'Hassan Rashid',
    first_name: 'Hassan',
    last_name: 'Rashid',
    email: 'hrashid@trading.co.tz',
    phone: '+255 767 334 455',
    address: 'Ali Hassan Mwinyi Rd, Upanga',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    date_of_birth: '1979-02-14',
    gender: 'male',
    customer_type: 'business',
    notes: 'Office supplies client. Outstanding balance paid at end of each quarter.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 2000000,
    current_balance: 185000,
    total_orders: 5,
    total_spent: 1250000,
    total_refunded: 0,
    first_purchase_at: new Date(Date.now() - 80 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 85 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'cust-5',
    business_id: 'demo-biz-1',
    name: 'Sarah Temba',
    first_name: 'Sarah',
    last_name: 'Temba',
    email: 'sarah.temba@kilicoffee.com',
    phone: '+255 755 889 900',
    address: 'Boma Road',
    city: 'Arusha',
    country: 'Tanzania',
    date_of_birth: '1991-09-08',
    gender: 'female',
    customer_type: 'vip',
    notes: 'Premium specialty customer. Visits when in Dar es Salaam.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 1000000,
    current_balance: 0,
    total_orders: 6,
    total_spent: 1820000,
    total_refunded: 0,
    first_purchase_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 42 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'cust-6',
    business_id: 'demo-biz-1',
    name: 'David Mollel',
    first_name: 'David',
    last_name: 'Mollel',
    email: 'david.mollel@gmail.com',
    phone: '+255 712 345 678',
    address: 'Njiro Block C',
    city: 'Arusha',
    country: 'Tanzania',
    date_of_birth: '1985-05-30',
    gender: 'male',
    customer_type: 'regular',
    notes: 'Occasional buyer, interested in French press accessories.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 200000,
    current_balance: 0,
    total_orders: 2,
    total_spent: 145000,
    total_refunded: 0,
    first_purchase_at: new Date(Date.now() - 75 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 55 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 55 * 86400000).toISOString(),
  },
  {
    id: 'cust-7',
    business_id: 'demo-biz-1',
    name: 'Amina Salum',
    first_name: 'Amina',
    last_name: 'Salum',
    email: 'amina.salum@coastal.co.tz',
    phone: '+255 777 654 321',
    address: 'Kenyatta Road, Stone Town',
    city: 'Zanzibar',
    country: 'Tanzania',
    date_of_birth: '1993-12-05',
    gender: 'female',
    customer_type: 'regular',
    notes: 'No recent orders in over 70 days. Sent follow-up discount coupon.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 500000,
    current_balance: 0,
    total_orders: 3,
    total_spent: 320000,
    total_refunded: 0,
    first_purchase_at: new Date(Date.now() - 110 * 86400000).toISOString(),
    last_purchase_at: new Date(Date.now() - 72 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 115 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 72 * 86400000).toISOString(),
  },
  {
    id: 'cust-8',
    business_id: 'demo-biz-1',
    name: 'Robert Kweka',
    first_name: 'Robert',
    last_name: 'Kweka',
    email: 'rkweka@gmail.com',
    phone: '+255 768 119 922',
    address: 'Old Moshi Road',
    city: 'Moshi',
    country: 'Tanzania',
    date_of_birth: '1975-08-20',
    gender: 'male',
    customer_type: 'walk_in',
    notes: 'Registered client account but has not placed any orders yet.',
    assigned_branch_id: 'branch-downtown',
    status: 'active',
    credit_limit: 0,
    current_balance: 0,
    total_orders: 0,
    total_spent: 0,
    total_refunded: 0,
    first_purchase_at: null,
    last_purchase_at: null,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
];

export const INITIAL_DEMO_TAG_ASSIGNMENTS: CustomerTagAssignment[] = [
  { id: 'cta-1', business_id: 'demo-biz-1', customer_id: 'cust-1', tag_id: 'tag-1', created_at: new Date().toISOString() },
  { id: 'cta-2', business_id: 'demo-biz-1', customer_id: 'cust-1', tag_id: 'tag-6', created_at: new Date().toISOString() },
  { id: 'cta-3', business_id: 'demo-biz-1', customer_id: 'cust-1', tag_id: 'tag-7', created_at: new Date().toISOString() },
  { id: 'cta-4', business_id: 'demo-biz-1', customer_id: 'cust-2', tag_id: 'tag-2', created_at: new Date().toISOString() },
  { id: 'cta-5', business_id: 'demo-biz-1', customer_id: 'cust-2', tag_id: 'tag-4', created_at: new Date().toISOString() },
  { id: 'cta-6', business_id: 'demo-biz-1', customer_id: 'cust-2', tag_id: 'tag-7', created_at: new Date().toISOString() },
  { id: 'cta-7', business_id: 'demo-biz-1', customer_id: 'cust-3', tag_id: 'tag-3', created_at: new Date().toISOString() },
  { id: 'cta-8', business_id: 'demo-biz-1', customer_id: 'cust-3', tag_id: 'tag-5', created_at: new Date().toISOString() },
  { id: 'cta-9', business_id: 'demo-biz-1', customer_id: 'cust-4', tag_id: 'tag-4', created_at: new Date().toISOString() },
  { id: 'cta-10', business_id: 'demo-biz-1', customer_id: 'cust-5', tag_id: 'tag-1', created_at: new Date().toISOString() },
  { id: 'cta-11', business_id: 'demo-biz-1', customer_id: 'cust-5', tag_id: 'tag-7', created_at: new Date().toISOString() },
];

export const INITIAL_DEMO_NOTES: CustomerNote[] = [
  {
    id: 'note-1',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    author_id: 'demo-user-1',
    content: 'Client expressed interest in our upcoming single-origin Ethiopian Guji harvest roast. Send notification when shipment arrives.',
    note_type: 'preference',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'note-2',
    business_id: 'demo-biz-1',
    customer_id: 'cust-2',
    author_id: 'demo-user-1',
    content: 'Quarterly invoice arrangement confirmed with managing director. Eligible for 10% wholesale discount on 20kg+ orders.',
    note_type: 'relationship',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'note-3',
    business_id: 'demo-biz-1',
    customer_id: 'cust-4',
    author_id: 'demo-user-1',
    content: 'Requested statement of accounts for tax filing sent to finance department.',
    note_type: 'follow_up',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const INITIAL_DEMO_ACTIVITY: CustomerActivity[] = [
  {
    id: 'act-1',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    activity_type: 'sale',
    description: 'Completed purchase of TZS 245,000 via Mobile Money (Receipt #REC-10024)',
    metadata: { receipt_number: 'REC-10024', amount: 245000 },
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act-2',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    activity_type: 'tag_assigned',
    description: 'Assigned tag: VIP and Loyalty Member',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'act-3',
    business_id: 'demo-biz-1',
    customer_id: 'cust-1',
    activity_type: 'created',
    description: 'Customer profile registered in CRM',
    created_at: new Date(Date.now() - 65 * 86400000).toISOString(),
  },
  {
    id: 'act-4',
    business_id: 'demo-biz-1',
    customer_id: 'cust-2',
    activity_type: 'sale',
    description: 'Completed purchase of TZS 1,450,000 on Corporate Credit (Receipt #REC-10019)',
    metadata: { receipt_number: 'REC-10019', amount: 1450000 },
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'act-5',
    business_id: 'demo-biz-1',
    customer_id: 'cust-2',
    activity_type: 'refund',
    description: 'Processed refund of TZS 50,000 for damaged packaging (Return #RET-004)',
    metadata: { return_number: 'RET-004', amount: 50000 },
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

// Helper storage functions
export function getStoredCustomers(): Customer[] {
  return getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS);
}

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key}:`, err);
  }
  return defaultVal;
}

function setStored<T>(key: string, val: T): void {
  localStorage.setItem(key, JSON.stringify(val));
}

// ----------------------------------------------------
// 1. Tags Management
// ----------------------------------------------------
export async function fetchTags(businessId: string): Promise<Tag[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('business_id', businessId)
        .order('name');
      if (!error && data) {
        return data as Tag[];
      }
    } catch (err) {
      console.warn('Supabase fetchTags fallback:', err);
    }
  }

  const tags = getStored<Tag[]>(DEMO_TAGS_KEY, INITIAL_DEMO_TAGS).filter((t) => t.business_id === businessId);
  const assignments = getStored<CustomerTagAssignment[]>(DEMO_TAG_ASSIGNMENTS_KEY, INITIAL_DEMO_TAG_ASSIGNMENTS);

  return tags.map((t) => ({
    ...t,
    customer_count: assignments.filter((a) => a.tag_id === t.id).length,
  }));
}

export async function createTag(
  businessId: string,
  name: string,
  color = 'emerald',
  description?: string
): Promise<Tag> {
  const newTag: Tag = {
    id: `tag-${Date.now()}`,
    business_id: businessId,
    name: name.trim(),
    color,
    description: description?.trim() || null,
    created_at: new Date().toISOString(),
    customer_count: 0,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          business_id: businessId,
          name: name.trim(),
          color,
          description: description?.trim() || null,
        })
        .select()
        .single();
      if (!error && data) return data as Tag;
    } catch (err) {
      console.warn('Supabase createTag fallback:', err);
    }
  }

  const all = getStored<Tag[]>(DEMO_TAGS_KEY, INITIAL_DEMO_TAGS);
  setStored(DEMO_TAGS_KEY, [newTag, ...all]);
  return newTag;
}

export async function updateTag(
  tagId: string,
  name: string,
  color: string,
  description?: string
): Promise<Tag> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .update({
          name: name.trim(),
          color,
          description: description?.trim() || null,
        })
        .eq('id', tagId)
        .select()
        .single();
      if (!error && data) return data as Tag;
    } catch (err) {
      console.warn('Supabase updateTag fallback:', err);
    }
  }

  const all = getStored<Tag[]>(DEMO_TAGS_KEY, INITIAL_DEMO_TAGS);
  const idx = all.findIndex((t) => t.id === tagId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], name: name.trim(), color, description: description?.trim() || null };
    setStored(DEMO_TAGS_KEY, all);
    return all[idx];
  }
  throw new Error('Tag not found');
}

export async function deleteTag(tagId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('tags').delete().eq('id', tagId);
    } catch (err) {
      console.warn('Supabase deleteTag fallback:', err);
    }
  }

  const all = getStored<Tag[]>(DEMO_TAGS_KEY, INITIAL_DEMO_TAGS).filter((t) => t.id !== tagId);
  const assignments = getStored<CustomerTagAssignment[]>(DEMO_TAG_ASSIGNMENTS_KEY, INITIAL_DEMO_TAG_ASSIGNMENTS).filter(
    (a) => a.tag_id !== tagId
  );
  setStored(DEMO_TAGS_KEY, all);
  setStored(DEMO_TAG_ASSIGNMENTS_KEY, assignments);
}

// ----------------------------------------------------
// 2. Customers List & Filter Operations
// ----------------------------------------------------
export interface CustomerFilterOptions {
  search?: string;
  segmentId?: string;
  tagId?: string;
  branchId?: string;
  status?: CustomerStatus | 'all';
  customerType?: CustomerType | 'all';
  hasBalanceOnly?: boolean;
  minSpending?: number;
  maxSpending?: number;
  minOrders?: number;
  maxOrders?: number;
  datePreset?: 'all' | '30d' | '60d' | '90d' | 'this_month' | 'this_year';
  sortBy?: 'name' | 'total_spent' | 'total_orders' | 'last_purchase_at' | 'created_at' | 'current_balance';
  sortOrder?: 'asc' | 'desc';
}

export async function fetchCustomers(
  businessId: string,
  filters?: CustomerFilterOptions
): Promise<Customer[]> {
  let list: Customer[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId);

      if (!error && data) {
        list = data as Customer[];
      }
    } catch (err) {
      console.warn('Supabase fetchCustomers fallback:', err);
    }
  }

  if (list.length === 0) {
    list = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS).filter(
      (c) => c.business_id === businessId
    );
  }

  // Populate tags for each customer
  const allTags = getStored<Tag[]>(DEMO_TAGS_KEY, INITIAL_DEMO_TAGS);
  const allAssignments = getStored<CustomerTagAssignment[]>(
    DEMO_TAG_ASSIGNMENTS_KEY,
    INITIAL_DEMO_TAG_ASSIGNMENTS
  );

  list = list.map((cust) => {
    const assignedTagIds = allAssignments
      .filter((a) => a.customer_id === cust.id)
      .map((a) => a.tag_id);
    const tags = allTags.filter((t) => assignedTagIds.includes(t.id));
    return {
      ...cust,
      tags,
      total_orders: cust.total_orders ?? 0,
      total_spent: Number(cust.total_spent || 0),
      total_refunded: Number(cust.total_refunded || 0),
      current_balance: Number(cust.current_balance || 0),
      credit_limit: Number(cust.credit_limit || 0),
    };
  });

  if (!filters) return list;

  // Apply filters
  let filtered = [...list];

  // Search
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone ? c.phone.toLowerCase().includes(q) : false;
      const matchEmail = c.email ? c.email.toLowerCase().includes(q) : false;
      const matchCity = c.city ? c.city.toLowerCase().includes(q) : false;
      const matchId = c.id.toLowerCase().includes(q);
      const matchTag = c.tags?.some((t) => t.name.toLowerCase().includes(q));
      return matchName || matchPhone || matchEmail || matchCity || matchId || matchTag;
    });
  }

  // Tag filter
  if (filters.tagId && filters.tagId !== 'all') {
    filtered = filtered.filter((c) => c.tags?.some((t) => t.id === filters.tagId));
  }

  // Branch filter
  if (filters.branchId && filters.branchId !== 'all') {
    filtered = filtered.filter((c) => c.assigned_branch_id === filters.branchId);
  }

  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((c) => (c.status || 'active') === filters.status);
  }

  // Customer Type filter
  if (filters.customerType && filters.customerType !== 'all') {
    filtered = filtered.filter((c) => (c.customer_type || 'regular') === filters.customerType);
  }

  // Has Balance
  if (filters.hasBalanceOnly) {
    filtered = filtered.filter((c) => (c.current_balance || 0) > 0);
  }

  // Spending Range
  if (filters.minSpending !== undefined) {
    filtered = filtered.filter((c) => (c.total_spent || 0) >= (filters.minSpending ?? 0));
  }
  if (filters.maxSpending !== undefined) {
    filtered = filtered.filter((c) => (c.total_spent || 0) <= (filters.maxSpending ?? 0));
  }

  // Orders Range
  if (filters.minOrders !== undefined) {
    filtered = filtered.filter((c) => (c.total_orders || 0) >= (filters.minOrders ?? 0));
  }
  if (filters.maxOrders !== undefined) {
    filtered = filtered.filter((c) => (c.total_orders || 0) <= (filters.maxOrders ?? 0));
  }

  // Date Joined preset
  if (filters.datePreset && filters.datePreset !== 'all') {
    const now = Date.now();
    if (filters.datePreset === '30d') {
      const cut = now - 30 * 86400000;
      filtered = filtered.filter((c) => new Date(c.created_at).getTime() >= cut);
    } else if (filters.datePreset === '60d') {
      const cut = now - 60 * 86400000;
      filtered = filtered.filter((c) => new Date(c.created_at).getTime() >= cut);
    } else if (filters.datePreset === '90d') {
      const cut = now - 90 * 86400000;
      filtered = filtered.filter((c) => new Date(c.created_at).getTime() >= cut);
    }
  }

  // Sorting
  const sortBy = filters.sortBy || 'name';
  const sortOrder = filters.sortOrder || 'asc';

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'total_spent') {
      comparison = (a.total_spent || 0) - (b.total_spent || 0);
    } else if (sortBy === 'total_orders') {
      comparison = (a.total_orders || 0) - (b.total_orders || 0);
    } else if (sortBy === 'current_balance') {
      comparison = (a.current_balance || 0) - (b.current_balance || 0);
    } else if (sortBy === 'last_purchase_at') {
      const tA = a.last_purchase_at ? new Date(a.last_purchase_at).getTime() : 0;
      const tB = b.last_purchase_at ? new Date(b.last_purchase_at).getTime() : 0;
      comparison = tA - tB;
    } else if (sortBy === 'created_at') {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

export async function fetchCustomerById(customerId: string): Promise<Customer | null> {
  const all = await fetchCustomers('demo-biz-1');
  return all.find((c) => c.id === customerId) || null;
}

// ----------------------------------------------------
// 3. Create / Edit / Archive Customer
// ----------------------------------------------------
export interface CreateCustomerInput {
  business_id: string;
  first_name?: string | null;
  last_name?: string | null;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  date_of_birth?: string | null;
  gender?: CustomerGender | null;
  customer_type?: CustomerType;
  notes?: string | null;
  tag_ids?: string[];
  assigned_branch_id?: string | null;
  status?: CustomerStatus;
  credit_limit?: number;
}

export async function createCustomer(
  input: CreateCustomerInput,
  authorId?: string | null
): Promise<{ customer: Customer; duplicateWarning?: string }> {
  const fullName = input.name?.trim() || `${input.first_name || ''} ${input.last_name || ''}`.trim() || 'Valued Customer';
  const newId = `cust-${Date.now()}`;
  const now = new Date().toISOString();

  // Check duplicate phone warning
  let duplicateWarning: string | undefined;
  const existing = await fetchCustomers(input.business_id);
  if (input.phone && input.phone.trim()) {
    const cleanPhone = input.phone.replace(/[^0-9+]/g, '');
    const foundDup = existing.find((c) => c.phone && c.phone.replace(/[^0-9+]/g, '') === cleanPhone);
    if (foundDup) {
      duplicateWarning = `Notice: Customer "${foundDup.name}" already uses phone number ${input.phone}.`;
    }
  }

  const customerObj: Customer = {
    id: newId,
    business_id: input.business_id,
    name: fullName,
    first_name: input.first_name?.trim() || null,
    last_name: input.last_name?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || 'Dar es Salaam',
    country: input.country?.trim() || 'Tanzania',
    date_of_birth: input.date_of_birth || null,
    gender: input.gender || null,
    customer_type: input.customer_type || 'regular',
    notes: input.notes?.trim() || null,
    assigned_branch_id: input.assigned_branch_id || null,
    status: input.status || 'active',
    credit_limit: Number(input.credit_limit) || 0,
    current_balance: 0,
    total_orders: 0,
    total_spent: 0,
    total_refunded: 0,
    first_purchase_at: null,
    last_purchase_at: null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          business_id: input.business_id,
          name: fullName,
          first_name: customerObj.first_name,
          last_name: customerObj.last_name,
          phone: customerObj.phone,
          email: customerObj.email,
          address: customerObj.address,
          city: customerObj.city,
          country: customerObj.country,
          date_of_birth: customerObj.date_of_birth,
          gender: customerObj.gender,
          customer_type: customerObj.customer_type,
          notes: customerObj.notes,
          assigned_branch_id: customerObj.assigned_branch_id,
          status: customerObj.status,
          credit_limit: customerObj.credit_limit,
          current_balance: 0,
        })
        .select()
        .single();

      if (!error && data) {
        customerObj.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase createCustomer fallback:', err);
    }
  }

  // Update local
  const currentList = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS);
  setStored(DEMO_CUSTOMERS_KEY, [customerObj, ...currentList]);

  // Handle Tags
  if (input.tag_ids && input.tag_ids.length > 0) {
    const currentAssignments = getStored<CustomerTagAssignment[]>(
      DEMO_TAG_ASSIGNMENTS_KEY,
      INITIAL_DEMO_TAG_ASSIGNMENTS
    );
    const newAssignments: CustomerTagAssignment[] = input.tag_ids.map((tagId) => ({
      id: `cta-${Date.now()}-${tagId}`,
      business_id: input.business_id,
      customer_id: customerObj.id,
      tag_id: tagId,
      created_at: now,
    }));
    setStored(DEMO_TAG_ASSIGNMENTS_KEY, [...newAssignments, ...currentAssignments]);
  }

  // Log activity
  await logCustomerActivity(
    customerObj.id,
    input.business_id,
    'created',
    `Customer profile created (${fullName})`,
    authorId
  );

  return { customer: customerObj, duplicateWarning };
}

export async function updateCustomer(
  id: string,
  input: Partial<CreateCustomerInput>,
  authorId?: string | null
): Promise<Customer> {
  const now = new Date().toISOString();
  const currentList = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS);
  const idx = currentList.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Customer not found');

  const existing = currentList[idx];
  const fullName =
    input.name !== undefined
      ? input.name.trim()
      : input.first_name || input.last_name
      ? `${input.first_name ?? existing.first_name ?? ''} ${input.last_name ?? existing.last_name ?? ''}`.trim()
      : existing.name;

  const updated: Customer = {
    ...existing,
    name: fullName || existing.name,
    first_name: input.first_name !== undefined ? input.first_name : existing.first_name,
    last_name: input.last_name !== undefined ? input.last_name : existing.last_name,
    phone: input.phone !== undefined ? input.phone : existing.phone,
    email: input.email !== undefined ? input.email : existing.email,
    address: input.address !== undefined ? input.address : existing.address,
    city: input.city !== undefined ? input.city : existing.city,
    country: input.country !== undefined ? input.country : existing.country,
    date_of_birth: input.date_of_birth !== undefined ? input.date_of_birth : existing.date_of_birth,
    gender: input.gender !== undefined ? input.gender : existing.gender,
    customer_type: input.customer_type !== undefined ? input.customer_type : existing.customer_type,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    assigned_branch_id: input.assigned_branch_id !== undefined ? input.assigned_branch_id : existing.assigned_branch_id,
    status: input.status !== undefined ? input.status : existing.status,
    credit_limit: input.credit_limit !== undefined ? Number(input.credit_limit) : existing.credit_limit,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('customers')
        .update({
          name: updated.name,
          first_name: updated.first_name,
          last_name: updated.last_name,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
          city: updated.city,
          country: updated.country,
          date_of_birth: updated.date_of_birth,
          gender: updated.gender,
          customer_type: updated.customer_type,
          notes: updated.notes,
          assigned_branch_id: updated.assigned_branch_id,
          status: updated.status,
          credit_limit: updated.credit_limit,
          updated_at: now,
        })
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase updateCustomer fallback:', err);
    }
  }

  currentList[idx] = updated;
  setStored(DEMO_CUSTOMERS_KEY, currentList);

  // Update tag assignments if provided
  if (input.tag_ids !== undefined) {
    const allAssignments = getStored<CustomerTagAssignment[]>(
      DEMO_TAG_ASSIGNMENTS_KEY,
      INITIAL_DEMO_TAG_ASSIGNMENTS
    ).filter((a) => a.customer_id !== id);

    const newAssignments: CustomerTagAssignment[] = input.tag_ids.map((tId) => ({
      id: `cta-${Date.now()}-${tId}`,
      business_id: existing.business_id,
      customer_id: id,
      tag_id: tId,
      created_at: now,
    }));

    setStored(DEMO_TAG_ASSIGNMENTS_KEY, [...newAssignments, ...allAssignments]);
  }

  await logCustomerActivity(
    id,
    existing.business_id,
    'status_change',
    `Customer profile details updated`,
    authorId
  );

  return updated;
}

export async function archiveCustomer(id: string, isArchived = true, authorId?: string | null): Promise<void> {
  const status: CustomerStatus = isArchived ? 'archived' : 'active';
  await updateCustomer(id, { status }, authorId);
  const cust = await fetchCustomerById(id);
  if (cust) {
    await logCustomerActivity(
      id,
      cust.business_id,
      'status_change',
      isArchived ? 'Customer archived' : 'Customer unarchived / restored',
      authorId
    );
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteCustomer fallback:', err);
    }
  }

  const currentList = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS).filter((c) => c.id !== id);
  setStored(DEMO_CUSTOMERS_KEY, currentList);
}

export async function recordCustomerSale(
  customerId: string,
  businessId: string,
  totalAmount: number,
  receiptNumber: string,
  authorId?: string | null
): Promise<void> {
  const currentList = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS);
  const idx = currentList.findIndex((c) => c.id === customerId);
  const now = new Date().toISOString();
  if (idx !== -1) {
    const cust = currentList[idx];
    cust.total_spent = (cust.total_spent || 0) + totalAmount;
    cust.total_orders = (cust.total_orders || 0) + 1;
    cust.last_purchase_at = now;
    if (!cust.first_purchase_at) {
      cust.first_purchase_at = now;
    }
    cust.updated_at = now;
    setStored(DEMO_CUSTOMERS_KEY, currentList);
  }

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('customers')
        .select('total_spent, total_orders, first_purchase_at')
        .eq('id', customerId)
        .single();
      if (data) {
        await supabase
          .from('customers')
          .update({
            total_spent: (Number(data.total_spent) || 0) + totalAmount,
            total_orders: (Number(data.total_orders) || 0) + 1,
            last_purchase_at: now,
            first_purchase_at: data.first_purchase_at || now,
            updated_at: now,
          })
          .eq('id', customerId);
      }
    } catch (err) {
      console.warn('Supabase recordCustomerSale fallback:', err);
    }
  }

  await logCustomerActivity(
    customerId,
    businessId,
    'sale',
    `Completed sale of TZS ${totalAmount.toLocaleString()} (Receipt #${receiptNumber})`,
    authorId,
    { receipt_number: receiptNumber, amount: totalAmount }
  );
}

export async function recordCustomerRefund(
  customerId: string,
  businessId: string,
  refundAmount: number,
  returnNumber: string,
  authorId?: string | null
): Promise<void> {
  const currentList = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS);
  const idx = currentList.findIndex((c) => c.id === customerId);
  const now = new Date().toISOString();
  if (idx !== -1) {
    const cust = currentList[idx];
    cust.total_refunded = (cust.total_refunded || 0) + refundAmount;
    cust.updated_at = now;
    setStored(DEMO_CUSTOMERS_KEY, currentList);
  }

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('customers')
        .select('total_refunded')
        .eq('id', customerId)
        .single();
      if (data) {
        await supabase
          .from('customers')
          .update({
            total_refunded: (Number(data.total_refunded) || 0) + refundAmount,
            updated_at: now,
          })
          .eq('id', customerId);
      }
    } catch (err) {
      console.warn('Supabase recordCustomerRefund fallback:', err);
    }
  }

  await logCustomerActivity(
    customerId,
    businessId,
    'refund',
    `Processed refund of TZS ${refundAmount.toLocaleString()} (Return #${returnNumber})`,
    authorId,
    { return_number: returnNumber, amount: refundAmount }
  );
}

export async function updateCustomerBalance(customerId: string, amountDelta: number): Promise<void> {
  const currentList = getStored<Customer[]>(DEMO_CUSTOMERS_KEY, INITIAL_DEMO_CUSTOMERS);
  const idx = currentList.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    const newBal = Math.max(0, (currentList[idx].current_balance || 0) + amountDelta);
    currentList[idx].current_balance = newBal;
    currentList[idx].updated_at = new Date().toISOString();
    setStored(DEMO_CUSTOMERS_KEY, currentList);
  }

  if (isSupabaseConfigured) {
    try {
      const { data: cust } = await supabase
        .from('customers')
        .select('current_balance')
        .eq('id', customerId)
        .single();
      if (cust) {
        const newBal = (Number(cust.current_balance) || 0) + amountDelta;
        await supabase
          .from('customers')
          .update({ current_balance: newBal, updated_at: new Date().toISOString() })
          .eq('id', customerId);
      }
    } catch (err) {
      console.warn('Supabase updateCustomerBalance fallback:', err);
    }
  }
}

// ----------------------------------------------------
// 4. Customer Notes & Activity
// ----------------------------------------------------
export async function fetchCustomerNotes(customerId: string): Promise<CustomerNote[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*, author:profiles(*)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as CustomerNote[];
    } catch (err) {
      console.warn('Supabase fetchCustomerNotes fallback:', err);
    }
  }

  const all = getStored<CustomerNote[]>(DEMO_CUSTOMER_NOTES_KEY, INITIAL_DEMO_NOTES);
  return all.filter((n) => n.customer_id === customerId);
}

export async function addCustomerNote(
  customerId: string,
  businessId: string,
  authorId: string | null,
  content: string,
  noteType: CustomerNoteType = 'general'
): Promise<CustomerNote> {
  const newNote: CustomerNote = {
    id: `note-${Date.now()}`,
    business_id: businessId,
    customer_id: customerId,
    author_id: authorId,
    content: content.trim(),
    note_type: noteType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          business_id: businessId,
          customer_id: customerId,
          author_id: authorId,
          content: content.trim(),
          note_type: noteType,
        })
        .select('*, author:profiles(*)')
        .single();
      if (!error && data) return data as CustomerNote;
    } catch (err) {
      console.warn('Supabase addCustomerNote fallback:', err);
    }
  }

  const all = getStored<CustomerNote[]>(DEMO_CUSTOMER_NOTES_KEY, INITIAL_DEMO_NOTES);
  setStored(DEMO_CUSTOMER_NOTES_KEY, [newNote, ...all]);

  await logCustomerActivity(
    customerId,
    businessId,
    'note_added',
    `Added staff note (${noteType}): "${content.length > 50 ? content.slice(0, 50) + '...' : content}"`,
    authorId
  );

  return newNote;
}

export async function deleteCustomerNote(noteId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('customer_notes').delete().eq('id', noteId);
    } catch (err) {
      console.warn('Supabase deleteCustomerNote fallback:', err);
    }
  }

  const all = getStored<CustomerNote[]>(DEMO_CUSTOMER_NOTES_KEY, INITIAL_DEMO_NOTES).filter(
    (n) => n.id !== noteId
  );
  setStored(DEMO_CUSTOMER_NOTES_KEY, all);
}

export async function fetchCustomerActivity(customerId: string): Promise<CustomerActivity[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customer_activity')
        .select('*, performer:profiles(*)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as CustomerActivity[];
    } catch (err) {
      console.warn('Supabase fetchCustomerActivity fallback:', err);
    }
  }

  const all = getStored<CustomerActivity[]>(DEMO_CUSTOMER_ACTIVITY_KEY, INITIAL_DEMO_ACTIVITY);
  return all
    .filter((a) => a.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function logCustomerActivity(
  customerId: string,
  businessId: string,
  activityType: CustomerActivityType,
  description: string,
  performedBy?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  const newActivity: CustomerActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    business_id: businessId,
    customer_id: customerId,
    activity_type: activityType,
    description,
    metadata: metadata || null,
    performed_by: performedBy || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('customer_activity').insert({
        business_id: businessId,
        customer_id: customerId,
        activity_type: activityType,
        description,
        performed_by: performedBy || null,
        metadata: metadata || {},
      });
    } catch (err) {
      console.warn('Supabase logCustomerActivity fallback:', err);
    }
  }

  const all = getStored<CustomerActivity[]>(DEMO_CUSTOMER_ACTIVITY_KEY, INITIAL_DEMO_ACTIVITY);
  setStored(DEMO_CUSTOMER_ACTIVITY_KEY, [newActivity, ...all]);
}

// ----------------------------------------------------
// 5. Customer Purchase History, Product Breakdown & Insights
// ----------------------------------------------------
export async function fetchCustomerSalesHistory(customerId: string): Promise<Sale[]> {
  try {
    const rawSales = localStorage.getItem('verdant_demo_sales_v2');
    if (rawSales) {
      const list = JSON.parse(rawSales) as Sale[];
      return list
        .filter((s) => s.customer_id === customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } catch (err) {
    console.error('Error fetching sales for customer:', err);
  }
  return [];
}

export async function fetchCustomerPurchasedProducts(customerId: string): Promise<CustomerPurchasedProduct[]> {
  const sales = await fetchCustomerSalesHistory(customerId);
  const map = new Map<string, CustomerPurchasedProduct>();

  for (const sale of sales) {
    if (!sale.items) continue;
    for (const item of sale.items) {
      const key = item.product_id || item.product_name;
      const existing = map.get(key);
      if (existing) {
        existing.quantity_purchased += item.quantity;
        existing.total_spent += item.total_price;
        existing.order_count += 1;
        if (new Date(sale.created_at).getTime() > new Date(existing.last_purchase_date).getTime()) {
          existing.last_purchase_date = sale.created_at;
        }
      } else {
        map.set(key, {
          product_id: item.product_id || null,
          product_name: item.product_name,
          sku: item.sku || null,
          quantity_purchased: item.quantity,
          order_count: 1,
          total_spent: item.total_price,
          last_purchase_date: sale.created_at,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent);
}

export async function fetchCustomerBranchHistory(customerId: string): Promise<CustomerBranchHistory[]> {
  const sales = await fetchCustomerSalesHistory(customerId);
  const map = new Map<string, CustomerBranchHistory>();

  for (const sale of sales) {
    const branchId = sale.branch_id || 'branch-downtown';
    const branchName = sale.branch?.name || 'Downtown Flagship';
    const existing = map.get(branchId);
    if (existing) {
      existing.purchase_count += 1;
      existing.total_spent += sale.total_amount;
      if (new Date(sale.created_at).getTime() > new Date(existing.last_visit).getTime()) {
        existing.last_visit = sale.created_at;
      }
    } else {
      map.set(branchId, {
        branch_id: branchId,
        branch_name: branchName,
        purchase_count: 1,
        total_spent: sale.total_amount,
        last_visit: sale.created_at,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent);
}

// ----------------------------------------------------
// 6. Customer Segments Engine & Automatic Rules
// ----------------------------------------------------
export const DEFAULT_SYSTEM_SEGMENTS: CustomerSegment[] = [
  {
    id: 'seg-all',
    business_id: 'demo-biz-1',
    name: 'All Customers',
    description: 'Every registered customer in the database',
    segment_type: 'system',
    color: 'emerald',
    is_active: true,
    conditions_logic: 'AND',
    rules: [],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-new',
    business_id: 'demo-biz-1',
    name: 'New Customers',
    description: 'Joined within the last 30 days',
    segment_type: 'system',
    color: 'cyan',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'first_purchase_days', operator: 'less_or_equal', value: 30 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-active',
    business_id: 'demo-biz-1',
    name: 'Active Customers',
    description: 'Purchased within the last 30 days',
    segment_type: 'system',
    color: 'blue',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'last_purchase_days', operator: 'less_or_equal', value: 30 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-regular',
    business_id: 'demo-biz-1',
    name: 'Regular Customers',
    description: 'Made 3 or more total orders',
    segment_type: 'system',
    color: 'emerald',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'total_orders', operator: 'greater_or_equal', value: 3 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-vip',
    business_id: 'demo-biz-1',
    name: 'VIP Customers',
    description: 'Lifetime spending exceeds TZS 1,500,000',
    segment_type: 'system',
    color: 'purple',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'total_spent', operator: 'greater_or_equal', value: 1500000 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-high-value',
    business_id: 'demo-biz-1',
    name: 'High-Spending Customers',
    description: 'Lifetime spending exceeds TZS 3,000,000',
    segment_type: 'system',
    color: 'amber',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'total_spent', operator: 'greater_or_equal', value: 3000000 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-inactive',
    business_id: 'demo-biz-1',
    name: 'Inactive Customers',
    description: 'No purchases in the past 60 days',
    segment_type: 'system',
    color: 'gray',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'last_purchase_days', operator: 'greater_than', value: 60 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-at-risk',
    business_id: 'demo-biz-1',
    name: 'At-Risk Customers',
    description: 'Previously bought, but no purchase in 30 to 60 days',
    segment_type: 'system',
    color: 'rose',
    is_active: true,
    conditions_logic: 'AND',
    rules: [
      { field: 'last_purchase_days', operator: 'greater_than', value: 30 },
      { field: 'last_purchase_days', operator: 'less_or_equal', value: 60 },
      { field: 'total_orders', operator: 'greater_than', value: 0 },
    ],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-no-purchase',
    business_id: 'demo-biz-1',
    name: 'Customers With No Purchase',
    description: 'Registered accounts with 0 orders placed',
    segment_type: 'system',
    color: 'indigo',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'total_orders', operator: 'equals', value: 0 }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seg-wholesale',
    business_id: 'demo-biz-1',
    name: 'Wholesale Customers',
    description: 'Commercial and wholesale buyer accounts',
    segment_type: 'system',
    color: 'blue',
    is_active: true,
    conditions_logic: 'AND',
    rules: [{ field: 'customer_type', operator: 'equals', value: 'wholesale' }],
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchSegmentSettings(businessId: string): Promise<SegmentSettings> {
  const stored = getStored<Record<string, SegmentSettings>>(DEMO_SEGMENT_SETTINGS_KEY, {});
  return stored[businessId] || DEFAULT_SEGMENT_SETTINGS;
}

export async function saveSegmentSettings(
  businessId: string,
  settings: SegmentSettings
): Promise<SegmentSettings> {
  const stored = getStored<Record<string, SegmentSettings>>(DEMO_SEGMENT_SETTINGS_KEY, {});
  stored[businessId] = settings;
  setStored(DEMO_SEGMENT_SETTINGS_KEY, stored);
  return settings;
}

export function evaluateCustomerForSegment(
  customer: Customer,
  segment: CustomerSegment,
  settings: SegmentSettings = DEFAULT_SEGMENT_SETTINGS
): boolean {
  if (segment.id === 'seg-all' || segment.rules.length === 0) return true;

  const now = Date.now();
  const daysSinceJoin = Math.floor((now - new Date(customer.created_at).getTime()) / 86400000);
  const daysSinceLastPurchase = customer.last_purchase_at
    ? Math.floor((now - new Date(customer.last_purchase_at).getTime()) / 86400000)
    : 9999;

  // Handle default system segments based on configurable thresholds
  if (segment.id === 'seg-new') {
    return daysSinceJoin <= settings.new_customer_days;
  }
  if (segment.id === 'seg-active') {
    return daysSinceLastPurchase <= settings.active_customer_days;
  }
  if (segment.id === 'seg-regular') {
    return (customer.total_orders || 0) >= settings.regular_order_count;
  }
  if (segment.id === 'seg-vip') {
    return (customer.total_spent || 0) >= settings.vip_spend_threshold;
  }
  if (segment.id === 'seg-high-value') {
    return (customer.total_spent || 0) >= settings.high_value_spend_threshold;
  }
  if (segment.id === 'seg-inactive') {
    return daysSinceLastPurchase >= settings.inactive_days && (customer.total_orders || 0) > 0;
  }
  if (segment.id === 'seg-at-risk') {
    return (
      daysSinceLastPurchase >= settings.at_risk_min_days &&
      daysSinceLastPurchase <= settings.at_risk_max_days &&
      (customer.total_orders || 0) > 0
    );
  }
  if (segment.id === 'seg-no-purchase') {
    return (customer.total_orders || 0) === 0;
  }
  if (segment.id === 'seg-wholesale') {
    return customer.customer_type === 'wholesale';
  }

  // Custom Segment evaluation with AND / OR
  const results = segment.rules.map((rule) => {
    let targetVal: string | number | boolean | undefined;
    if (rule.field === 'total_spent') targetVal = customer.total_spent || 0;
    else if (rule.field === 'total_orders') targetVal = customer.total_orders || 0;
    else if (rule.field === 'credit_balance') targetVal = customer.current_balance || 0;
    else if (rule.field === 'last_purchase_days') targetVal = daysSinceLastPurchase;
    else if (rule.field === 'first_purchase_days') targetVal = daysSinceJoin;
    else if (rule.field === 'customer_type') targetVal = customer.customer_type || 'regular';
    else if (rule.field === 'status') targetVal = customer.status || 'active';
    else if (rule.field === 'city') targetVal = (customer.city || '').toLowerCase();
    else if (rule.field === 'assigned_branch_id') targetVal = customer.assigned_branch_id || '';
    else if (rule.field === 'has_tag') {
      const tagIds = (customer.tags || []).map((t) => t.id);
      return tagIds.includes(String(rule.value));
    }

    const val = typeof rule.value === 'string' && !isNaN(Number(rule.value)) ? Number(rule.value) : rule.value;

    switch (rule.operator) {
      case 'equals':
        return String(targetVal).toLowerCase() === String(val).toLowerCase();
      case 'not_equals':
        return String(targetVal).toLowerCase() !== String(val).toLowerCase();
      case 'greater_than':
        return Number(targetVal) > Number(val);
      case 'less_than':
        return Number(targetVal) < Number(val);
      case 'greater_or_equal':
        return Number(targetVal) >= Number(val);
      case 'less_or_equal':
        return Number(targetVal) <= Number(val);
      case 'contains':
        return String(targetVal).toLowerCase().includes(String(val).toLowerCase());
      case 'in':
        return Array.isArray(rule.value)
          ? rule.value.map(String).includes(String(targetVal))
          : String(targetVal) === String(val);
      default:
        return false;
    }
  });

  return segment.conditions_logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
}

export async function fetchSegments(businessId: string): Promise<CustomerSegment[]> {
  const settings = await fetchSegmentSettings(businessId);
  const customers = await fetchCustomers(businessId);

  let customSegments: CustomerSegment[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at');
      if (!error && data) customSegments = data as CustomerSegment[];
    } catch (err) {
      console.warn('Supabase fetchSegments fallback:', err);
    }
  }

  if (customSegments.length === 0) {
    customSegments = getStored<CustomerSegment[]>(DEMO_SEGMENTS_KEY, []).filter(
      (s) => s.business_id === businessId
    );
  }

  const allSegments = [...DEFAULT_SYSTEM_SEGMENTS, ...customSegments];

  // Calculate dynamic customer count for each segment
  return allSegments.map((seg) => {
    const matching = customers.filter((c) => evaluateCustomerForSegment(c, seg, settings));
    return {
      ...seg,
      customer_count: matching.length,
    };
  });
}

export async function createCustomSegment(
  businessId: string,
  data: Omit<CustomerSegment, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'customer_count'>
): Promise<CustomerSegment> {
  const newSegment: CustomerSegment = {
    id: `seg-${Date.now()}`,
    business_id: businessId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    segment_type: 'custom',
    color: data.color || 'purple',
    is_active: true,
    conditions_logic: data.conditions_logic || 'AND',
    rules: data.rules,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data: res, error } = await supabase
        .from('customer_segments')
        .insert({
          business_id: businessId,
          name: newSegment.name,
          description: newSegment.description,
          segment_type: 'custom',
          color: newSegment.color,
          is_active: true,
          conditions_logic: newSegment.conditions_logic,
          rules: newSegment.rules,
        })
        .select()
        .single();
      if (!error && res) return res as CustomerSegment;
    } catch (err) {
      console.warn('Supabase createCustomSegment fallback:', err);
    }
  }

  const current = getStored<CustomerSegment[]>(DEMO_SEGMENTS_KEY, []);
  setStored(DEMO_SEGMENTS_KEY, [newSegment, ...current]);
  return newSegment;
}

export async function deleteCustomSegment(segmentId: string): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('customer_segments').delete().eq('id', segmentId);
    } catch (err) {
      console.warn('Supabase deleteCustomSegment fallback:', err);
    }
  }

  const current = getStored<CustomerSegment[]>(DEMO_SEGMENTS_KEY, []).filter((s) => s.id !== segmentId);
  setStored(DEMO_SEGMENTS_KEY, current);
}

export const deleteSegment = deleteCustomSegment;
export const createSegment = createCustomSegment;

export async function updateSegment(
  segmentId: string,
  data: Partial<Omit<CustomerSegment, 'id' | 'created_at' | 'updated_at' | 'customer_count'>>
): Promise<CustomerSegment> {
  if (isSupabaseConfigured) {
    try {
      const { data: res, error } = await supabase
        .from('customer_segments')
        .update({
          name: data.name,
          description: data.description,
          color: data.color,
          conditions_logic: data.conditions_logic,
          rules: data.rules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', segmentId)
        .select()
        .single();
      if (!error && res) return res as CustomerSegment;
    } catch (err) {
      console.warn('Supabase updateSegment fallback:', err);
    }
  }

  const current = getStored<CustomerSegment[]>(DEMO_SEGMENTS_KEY, []);
  const idx = current.findIndex((s) => s.id === segmentId);
  if (idx !== -1) {
    current[idx] = {
      ...current[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    setStored(DEMO_SEGMENTS_KEY, current);
    return current[idx];
  }
  throw new Error('Segment not found');
}

export async function fetchCustomerStats(businessId: string): Promise<CustomerStats> {
  const crm = await fetchCrmDashboardStats(businessId);
  const customers = await fetchCustomers(businessId);
  const debtors = customers.filter((c: Customer) => (c.current_balance || 0) > 0);
  
  return {
    totalCustomers: crm.summary.total_customers,
    activeCustomers: crm.summary.active_customers,
    newThisMonth: crm.summary.new_customers_this_month,
    vipCustomers: crm.summary.vip_customers,
    wholesaleCustomers: customers.filter(c => c.customer_type === 'wholesale').length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    averageCustomerSpend: crm.summary.avg_customer_spending,
    totalOutstandingBalance: crm.summary.total_receivables,
    debtorsCount: debtors.length,
  };
}

// ----------------------------------------------------
// 7. CRM Dashboard & Summary Analytics
// ----------------------------------------------------
export async function fetchCrmDashboardStats(businessId: string): Promise<{
  summary: CustomerStatsSummary;
  growthChart: { month: string; customers: number; returning: number }[];
  spendingDistribution: { range: string; count: number }[];
  segmentDistribution: { name: string; count: number; color: string }[];
  branchDistribution: { name: string; customers: number; revenue: number }[];
}> {
  const customers = await fetchCustomers(businessId);
  const settings = await fetchSegmentSettings(businessId);
  const segments = await fetchSegments(businessId);

  const total = customers.length;
  const newCustomersThisMonth = customers.filter(
    (c) => new Date(c.created_at).getTime() >= Date.now() - 30 * 86400000
  ).length;

  const active = customers.filter(
    (c) => c.last_purchase_at && new Date(c.last_purchase_at).getTime() >= Date.now() - 30 * 86400000
  ).length;

  const inactive = customers.filter(
    (c) => !c.last_purchase_at || new Date(c.last_purchase_at).getTime() < Date.now() - 60 * 86400000
  ).length;

  const vip = customers.filter(
    (c) => (c.total_spent || 0) >= settings.vip_spend_threshold
  ).length;

  const totalSpending = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
  const totalReceivables = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);

  const avgSpending = total > 0 ? totalSpending / total : 0;
  const avgOrderValue = totalOrders > 0 ? totalSpending / totalOrders : 0;
  const repeatCustomers = customers.filter((c) => (c.total_orders || 0) > 1).length;
  const repeatRate = total > 0 ? (repeatCustomers / total) * 100 : 0;

  // Chart data: Growth over last 6 months
  const growthChart = [
    { month: 'Mar', customers: Math.max(1, total - 6), returning: Math.max(1, repeatCustomers - 4) },
    { month: 'Apr', customers: Math.max(2, total - 5), returning: Math.max(1, repeatCustomers - 3) },
    { month: 'May', customers: Math.max(3, total - 3), returning: Math.max(2, repeatCustomers - 2) },
    { month: 'Jun', customers: Math.max(4, total - 2), returning: Math.max(3, repeatCustomers - 1) },
    { month: 'Jul', customers: Math.max(5, total - 1), returning: Math.max(3, repeatCustomers) },
    { month: 'Aug', customers: total, returning: repeatCustomers },
  ];

  // Spending brackets
  const spendingDistribution = [
    { range: '0 - 100k', count: customers.filter((c) => (c.total_spent || 0) < 100000).length },
    { range: '100k - 500k', count: customers.filter((c) => (c.total_spent || 0) >= 100000 && (c.total_spent || 0) < 500000).length },
    { range: '500k - 1.5M', count: customers.filter((c) => (c.total_spent || 0) >= 500000 && (c.total_spent || 0) < 1500000).length },
    { range: '1.5M - 3M', count: customers.filter((c) => (c.total_spent || 0) >= 1500000 && (c.total_spent || 0) < 3000000).length },
    { range: '3M+', count: customers.filter((c) => (c.total_spent || 0) >= 3000000).length },
  ];

  // Segment distribution
  const segmentDistribution = segments
    .filter((s) => s.id !== 'seg-all')
    .slice(0, 6)
    .map((s) => ({
      name: s.name,
      count: s.customer_count || 0,
      color: s.color,
    }));

  // Branch breakdown
  const branchDistribution = [
    { name: 'Downtown Flagship', customers: Math.ceil(total * 0.75), revenue: Math.round(totalSpending * 0.8) },
    { name: 'Masaki Mall', customers: Math.floor(total * 0.25), revenue: Math.round(totalSpending * 0.2) },
  ];

  return {
    summary: {
      total_customers: total,
      new_customers_this_month: newCustomersThisMonth,
      active_customers: active,
      inactive_customers: inactive,
      vip_customers: vip,
      avg_customer_spending: avgSpending,
      avg_order_value: avgOrderValue,
      repeat_customer_rate: repeatRate,
      total_receivables: totalReceivables,
    },
    growthChart,
    spendingDistribution,
    segmentDistribution,
    branchDistribution,
  };
}

// ----------------------------------------------------
// 8. Export to CSV
// ----------------------------------------------------
/** Build the customer directory CSV as a plain string (no download). */
export function buildCustomersCsv(customers: Customer[], currency = 'BIF'): string {
  const headers = [
    'Customer ID',
    'Full Name',
    'Phone',
    'Email',
    'Customer Type',
    'Status',
    'City',
    'Address',
    'Tags',
    'Total Orders',
    `Total Spent (${currency})`,
    `Total Refunded (${currency})`,
    `Outstanding Balance (${currency})`,
    `Credit Limit (${currency})`,
    'First Purchase',
    'Last Purchase',
    'Date Joined',
  ];

  const rows = customers.map((c) => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${c.customer_type || 'regular'}"`,
    `"${c.status || 'active'}"`,
    `"${(c.city || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.tags || []).map((t) => t.name).join(', ')}"`,
    c.total_orders || 0,
    c.total_spent || 0,
    c.total_refunded || 0,
    c.current_balance || 0,
    c.credit_limit || 0,
    c.first_purchase_at ? new Date(c.first_purchase_at).toLocaleDateString() : 'N/A',
    c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString() : 'Never',
    new Date(c.created_at).toLocaleDateString(),
  ]);

  return [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
}

export function exportCustomersToCSV(customers: Customer[], currency = 'BIF'): void {
  const csv = buildCustomersCsv(customers, currency);
  const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
