import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { 
  Supplier, 
  SupplierNote, 
  SupplierStats, 
  PaymentTerms, 
  SupplierType, 
  SupplierStatus,
  PurchaseOrder 
} from '@/types/database';

export const DEMO_SUPPLIERS_KEY = 'verdant_demo_suppliers_v1';
export const DEMO_SUPPLIER_NOTES_KEY = 'verdant_demo_supplier_notes_v1';

export const INITIAL_DEMO_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    business_id: 'demo-biz-1',
    name: 'Kibungo Coffee & Grains Ltd',
    contact_person: 'David Mrosso',
    supplier_type: 'manufacturer',
    tax_number: 'TRA-109-882-311',
    website: 'https://kibungocoffee.bi',
    phone: '+257 22 275 4321',
    alternative_phone: '+257 79 411 2233',
    email: 'orders@kibungocoffee.bi',
    address: 'Plot 45, Route de Gitega',
    city: 'Gitega',
    country: 'Burundi',
    payment_terms: 'net_30',
    credit_limit: 15000000,
    current_balance: 1800000,
    notes: 'Primary single-origin coffee supplier. Free delivery for orders over BIF 5,000,000.',
    assigned_branch_id: null,
    status: 'active',
    total_purchases_count: 8,
    total_purchases_amount: 14500000,
    total_paid_amount: 12700000,
    last_purchase_date: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'supp-2',
    business_id: 'demo-biz-1',
    name: 'Rumonge Spice Merchants Co.',
    contact_person: 'Fatma Al-Harthy',
    supplier_type: 'distributor',
    tax_number: 'TRA-204-551-900',
    website: 'https://rumongespices.bi',
    phone: '+257 22 323 9988',
    alternative_phone: '+257 79 445 566',
    email: 'supply@rumongespices.bi',
    address: 'Zone Commerciale, St. 12',
    city: 'Rumonge',
    country: 'Burundi',
    payment_terms: 'net_15',
    credit_limit: 8000000,
    current_balance: 450000,
    notes: 'Premium organic chai spices, cardamom, cloves, and vanilla beans.',
    assigned_branch_id: null,
    status: 'active',
    total_purchases_count: 5,
    total_purchases_amount: 6200000,
    total_paid_amount: 5750000,
    last_purchase_date: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'supp-3',
    business_id: 'demo-biz-1',
    name: 'Apex Retail Tech Hardware Ltd',
    contact_person: 'Kelvin Temba',
    supplier_type: 'distributor',
    tax_number: 'TRA-331-890-442',
    website: 'https://apexretailtech.bi',
    phone: '+257 22 212 6700',
    alternative_phone: '+257 79 900 888',
    email: 'sales@apexretailtech.bi',
    address: 'Avenue de l\'Indépendance, Centre-Ville',
    city: 'Bujumbura',
    country: 'Burundi',
    payment_terms: 'cod',
    credit_limit: 5000000,
    current_balance: 0,
    notes: 'Official distributor for barcode scanners, receipt printers, and cash drawers.',
    assigned_branch_id: null,
    status: 'active',
    total_purchases_count: 4,
    total_purchases_amount: 8900000,
    total_paid_amount: 8900000,
    last_purchase_date: new Date(Date.now() - 25 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'supp-4',
    business_id: 'demo-biz-1',
    name: 'Burundi Paper & Packaging Industries',
    contact_person: 'Grace Shirima',
    supplier_type: 'wholesaler',
    tax_number: 'TRA-409-112-887',
    website: 'https://bi-paperpack.com',
    phone: '+257 22 286 4400',
    alternative_phone: '+257 79 332 110',
    email: 'info@bi-paperpack.com',
    address: 'Zone Industrielle, Bujumbura',
    city: 'Bujumbura',
    country: 'Burundi',
    payment_terms: 'net_60',
    credit_limit: 10000000,
    current_balance: 1350000,
    notes: 'Thermal receipt rolls, take-away cups, and customized packaging boxes.',
    assigned_branch_id: null,
    status: 'active',
    total_purchases_count: 6,
    total_purchases_amount: 5400000,
    total_paid_amount: 4050000,
    last_purchase_date: new Date(Date.now() - 8 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 100 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'supp-5',
    business_id: 'demo-biz-1',
    name: 'Muyinga Dairy & Syrups Co.',
    contact_person: 'Peter Mwita',
    supplier_type: 'wholesaler',
    tax_number: 'TRA-551-778-992',
    website: null,
    phone: '+257 28 250 0980',
    alternative_phone: null,
    email: 'orders@muyingadairy.bi',
    address: 'Route de Ngozi, Zone Industrielle',
    city: 'Muyinga',
    country: 'Burundi',
    payment_terms: 'due_on_receipt',
    credit_limit: 3000000,
    current_balance: 0,
    notes: 'Barista oat milk, almond milk, and specialty flavoring syrups.',
    assigned_branch_id: null,
    status: 'active',
    total_purchases_count: 3,
    total_purchases_amount: 2800000,
    total_paid_amount: 2800000,
    last_purchase_date: new Date(Date.now() - 40 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 80 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
];

export function getStoredSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(DEMO_SUPPLIERS_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_SUPPLIERS_KEY, JSON.stringify(INITIAL_DEMO_SUPPLIERS));
      return INITIAL_DEMO_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_SUPPLIERS;
  }
}

export function saveStoredSuppliers(suppliers: Supplier[]) {
  localStorage.setItem(DEMO_SUPPLIERS_KEY, JSON.stringify(suppliers));
}

export function getStoredSupplierNotes(): SupplierNote[] {
  try {
    const raw = localStorage.getItem(DEMO_SUPPLIER_NOTES_KEY);
    if (!raw) {
      const initial: SupplierNote[] = [
        {
          id: 'snote-1',
          business_id: 'demo-biz-1',
          supplier_id: 'supp-1',
          author_id: 'demo-user-1',
          content: 'Negotiated 5% bulk volume discount on Burundi AAA grade beans for orders over 50kg.',
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
        {
          id: 'snote-2',
          business_id: 'demo-biz-1',
          supplier_id: 'supp-1',
          author_id: 'demo-user-1',
          content: 'Deliveries are scheduled weekly on Tuesdays and Fridays.',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ];
      localStorage.setItem(DEMO_SUPPLIER_NOTES_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSupplierNotes(notes: SupplierNote[]) {
  localStorage.setItem(DEMO_SUPPLIER_NOTES_KEY, JSON.stringify(notes));
}

// ----------------------------------------------------
// Public Supplier APIs
// ----------------------------------------------------

export interface FetchSuppliersFilter {
  search?: string;
  supplierType?: string;
  status?: SupplierStatus | 'all';
  paymentTerms?: string;
  hasBalance?: boolean;
  branchId?: string | null;
  sortBy?: 'name' | 'balance' | 'total_purchases' | 'recent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function fetchSuppliers(
  businessId: string,
  filter: FetchSuppliersFilter = {}
): Promise<{ suppliers: Supplier[]; totalCount: number }> {
  const {
    search,
    supplierType = 'all',
    status = 'all',
    paymentTerms = 'all',
    hasBalance,
    branchId,
    sortBy = 'recent',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = filter;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('suppliers')
        .select('*, assigned_branch:branches(*)', { count: 'exact' })
        .eq('business_id', businessId);

      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (supplierType !== 'all') {
        query = query.eq('supplier_type', supplierType);
      }
      if (paymentTerms !== 'all') {
        query = query.eq('payment_terms', paymentTerms);
      }
      if (branchId) {
        query = query.or(`assigned_branch_id.eq.${branchId},assigned_branch_id.is.null`);
      }
      if (hasBalance) {
        query = query.gt('current_balance', 0);
      }
      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`name.ilike.%${q}%,contact_person.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,city.ilike.%${q}%`);
      }

      if (sortBy === 'name') {
        query = query.order('name', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'balance') {
        query = query.order('current_balance', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to);

      if (!error && data) {
        return {
          suppliers: data as Supplier[],
          totalCount: count || 0,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchSuppliers error, falling back:', err);
    }
  }

  // Local fallback
  let list = getStoredSuppliers().filter((s) => s.business_id === businessId || businessId === 'demo-biz-1');

  if (status !== 'all') {
    list = list.filter((s) => s.status === status);
  }
  if (supplierType !== 'all') {
    list = list.filter((s) => s.supplier_type === supplierType);
  }
  if (paymentTerms !== 'all') {
    list = list.filter((s) => s.payment_terms === paymentTerms);
  }
  if (hasBalance) {
    list = list.filter((s) => s.current_balance > 0);
  }
  if (branchId) {
    list = list.filter((s) => !s.assigned_branch_id || s.assigned_branch_id === branchId);
  }
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'balance') {
      return sortOrder === 'asc' ? a.current_balance - b.current_balance : b.current_balance - a.current_balance;
    }
    if (sortBy === 'total_purchases') {
      const aPurch = a.total_purchases_amount || 0;
      const bPurch = b.total_purchases_amount || 0;
      return sortOrder === 'asc' ? aPurch - bPurch : bPurch - aPurch;
    }
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
  });

  const totalCount = list.length;
  const paginated = list.slice((page - 1) * pageSize, page * pageSize);

  return {
    suppliers: paginated,
    totalCount,
  };
}

export async function fetchSupplierById(supplierId: string): Promise<{
  supplier: Supplier | null;
  notes: SupplierNote[];
  purchases: PurchaseOrder[];
}> {
  if (isSupabaseConfigured) {
    try {
      const { data: sup, error } = await supabase
        .from('suppliers')
        .select('*, assigned_branch:branches(*)')
        .eq('id', supplierId)
        .maybeSingle();

      if (!error && sup) {
        const [notesRes, purchasesRes] = await Promise.all([
          supabase
            .from('supplier_notes')
            .select('*, author:profiles(*)')
            .eq('supplier_id', supplierId)
            .order('created_at', { ascending: false }),
          supabase
            .from('purchase_orders')
            .select('*, branch:branches(*)')
            .eq('supplier_id', supplierId)
            .order('order_date', { ascending: false }),
        ]);

        return {
          supplier: sup as Supplier,
          notes: (notesRes.data as SupplierNote[]) || [],
          purchases: (purchasesRes.data as PurchaseOrder[]) || [],
        };
      }
    } catch (err) {
      console.warn('Supabase fetchSupplierById error, falling back:', err);
    }
  }

  // Fallback
  const suppliers = getStoredSuppliers();
  const found = suppliers.find((s) => s.id === supplierId) || null;
  const notes = getStoredSupplierNotes().filter((n) => n.supplier_id === supplierId);
  return {
    supplier: found,
    notes,
    purchases: [],
  };
}

export interface CreateSupplierInput {
  name: string;
  contact_person?: string | null;
  supplier_type: SupplierType;
  tax_number?: string | null;
  website?: string | null;
  phone?: string | null;
  alternative_phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  payment_terms: PaymentTerms;
  credit_limit?: number;
  notes?: string | null;
  assigned_branch_id?: string | null;
  status?: SupplierStatus;
}

export async function createSupplier(
  businessId: string,
  input: CreateSupplierInput
): Promise<Supplier> {
  const now = new Date().toISOString();
  const newSupplier: Supplier = {
    id: `supp-${Date.now()}`,
    business_id: businessId,
    name: input.name.trim(),
    contact_person: input.contact_person?.trim() || null,
    supplier_type: input.supplier_type || 'wholesaler',
    tax_number: input.tax_number?.trim() || null,
    website: input.website?.trim() || null,
    phone: input.phone?.trim() || null,
    alternative_phone: input.alternative_phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    country: input.country?.trim() || 'Burundi',
    payment_terms: input.payment_terms || 'net_30',
    credit_limit: Number(input.credit_limit) || 0,
    current_balance: 0,
    notes: input.notes?.trim() || null,
    assigned_branch_id: input.assigned_branch_id || null,
    status: input.status || 'active',
    total_purchases_count: 0,
    total_purchases_amount: 0,
    total_paid_amount: 0,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          business_id: businessId,
          name: newSupplier.name,
          contact_person: newSupplier.contact_person,
          supplier_type: newSupplier.supplier_type,
          tax_number: newSupplier.tax_number,
          website: newSupplier.website,
          phone: newSupplier.phone,
          alternative_phone: newSupplier.alternative_phone,
          email: newSupplier.email,
          address: newSupplier.address,
          city: newSupplier.city,
          country: newSupplier.country,
          payment_terms: newSupplier.payment_terms,
          credit_limit: newSupplier.credit_limit,
          current_balance: 0,
          notes: newSupplier.notes,
          assigned_branch_id: newSupplier.assigned_branch_id,
          status: newSupplier.status,
        })
        .select('*, assigned_branch:branches(*)')
        .single();

      if (!error && data) {
        return data as Supplier;
      }
    } catch (err) {
      console.warn('Supabase createSupplier error, falling back:', err);
    }
  }

  const suppliers = getStoredSuppliers();
  suppliers.unshift(newSupplier);
  saveStoredSuppliers(suppliers);
  return newSupplier;
}

export async function updateSupplier(
  supplierId: string,
  updates: Partial<Supplier>
): Promise<Supplier> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', supplierId)
        .select('*, assigned_branch:branches(*)')
        .single();

      if (!error && data) {
        return data as Supplier;
      }
    } catch (err) {
      console.warn('Supabase updateSupplier error, falling back:', err);
    }
  }

  const suppliers = getStoredSuppliers();
  const idx = suppliers.findIndex((s) => s.id === supplierId);
  if (idx !== -1) {
    suppliers[idx] = {
      ...suppliers[idx],
      ...updates,
      updated_at: now,
    };
    saveStoredSuppliers(suppliers);
    return suppliers[idx];
  }
  throw new Error('Supplier not found');
}

export async function deleteSupplier(supplierId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteSupplier error, falling back:', err);
    }
  }

  const suppliers = getStoredSuppliers();
  const filtered = suppliers.filter((s) => s.id !== supplierId);
  saveStoredSuppliers(filtered);
  return true;
}

export async function addSupplierNote(
  businessId: string,
  supplierId: string,
  content: string,
  authorId: string | null
): Promise<SupplierNote> {
  const newNote: SupplierNote = {
    id: `snote-${Date.now()}`,
    business_id: businessId,
    supplier_id: supplierId,
    author_id: authorId,
    content: content.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('supplier_notes')
        .insert({
          business_id: businessId,
          supplier_id: supplierId,
          author_id: authorId,
          content: content.trim(),
        })
        .select('*, author:profiles(*)')
        .single();

      if (!error && data) {
        return data as SupplierNote;
      }
    } catch (err) {
      console.warn('Supabase addSupplierNote error, falling back:', err);
    }
  }

  const notes = getStoredSupplierNotes();
  notes.unshift(newNote);
  saveStoredSupplierNotes(notes);
  return newNote;
}

export async function deleteSupplierNote(noteId: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('supplier_notes').delete().eq('id', noteId);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteSupplierNote error, falling back:', err);
    }
  }

  const notes = getStoredSupplierNotes();
  saveStoredSupplierNotes(notes.filter((n) => n.id !== noteId));
  return true;
}

export async function fetchSupplierStats(
  businessId: string,
  branchId?: string | null
): Promise<SupplierStats> {
  const { suppliers } = await fetchSuppliers(businessId, { branchId, pageSize: 1000 });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === 'active').length;
  const totalPurchased = suppliers.reduce((sum, s) => sum + (s.total_purchases_amount || 0), 0);
  const totalOutstandingPayables = suppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0);
  const overduePayablesCount = suppliers.filter((s) => s.current_balance > 0).length;

  return {
    totalSuppliers,
    activeSuppliers,
    totalPurchased,
    totalOutstandingPayables,
    overduePayablesCount,
  };
}

export function exportSuppliersToCSV(suppliers: Supplier[]) {
  const headers = [
    'Name',
    'Contact Person',
    'Type',
    'Phone',
    'Email',
    'City',
    'Payment Terms',
    'Credit Limit',
    'Outstanding Balance',
    'Status',
  ];

  const rows = suppliers.map((s) => [
    `"${s.name.replace(/"/g, '""')}"`,
    `"${(s.contact_person || '').replace(/"/g, '""')}"`,
    s.supplier_type,
    s.phone || '',
    s.email || '',
    s.city || '',
    s.payment_terms,
    s.credit_limit,
    s.current_balance,
    s.status,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `suppliers_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
