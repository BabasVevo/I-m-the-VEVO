import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Customer } from '@/types/database';

export const DEMO_CUSTOMERS_KEY = 'verdant_demo_customers_v1';

export const INITIAL_DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    business_id: 'demo-biz-1',
    name: 'Fatma Juma',
    email: 'fatma.juma@gmail.com',
    phone: '+255 754 112 233',
    address: '12 Msasani Peninsula, Dar es Salaam',
    credit_limit: 500000,
    current_balance: 0,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'cust-2',
    business_id: 'demo-biz-1',
    name: 'John Mwangi',
    email: 'john.mwangi@safari.co.tz',
    phone: '+255 788 445 566',
    address: 'Haile Selassie Rd, Masaki',
    credit_limit: 1000000,
    current_balance: 0,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'cust-3',
    business_id: 'demo-biz-1',
    name: 'Neema Kimaro',
    email: 'neema.kimaro@outlook.com',
    phone: '+255 713 998 877',
    address: 'Mwai Kibaki Rd, Mikocheni',
    credit_limit: 350000,
    current_balance: 0,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'cust-4',
    business_id: 'demo-biz-1',
    name: 'Hassan Rashid',
    email: 'hrashid@trading.co.tz',
    phone: '+255 767 334 455',
    address: 'Ali Hassan Mwinyi Rd, Upanga',
    credit_limit: 800000,
    current_balance: 120000,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'cust-5',
    business_id: 'demo-biz-1',
    name: 'Sarah Temba',
    email: 'sarah.temba@kilicoffee.com',
    phone: '+255 755 889 900',
    address: 'Boma Road, Arusha',
    credit_limit: 600000,
    current_balance: 0,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(DEMO_CUSTOMERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading stored customers:', err);
  }
  setStoredCustomers(INITIAL_DEMO_CUSTOMERS);
  return INITIAL_DEMO_CUSTOMERS;
}

export function setStoredCustomers(customers: Customer[]): void {
  localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(customers));
}

export async function fetchCustomers(businessId: string, search?: string): Promise<Customer[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(`name.ilike.${q},phone.ilike.${q},email.ilike.${q}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as Customer[];
      }
      console.warn('Supabase customers query error, using local fallback:', error);
    } catch (err) {
      console.warn('Supabase fetch customers failed, using local fallback:', err);
    }
  }

  // Fallback
  const list = getStoredCustomers().filter((c) => c.business_id === businessId);
  if (!search || !search.trim()) return list;

  const q = search.toLowerCase();
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
  );
}

export interface CreateCustomerInput {
  business_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  credit_limit?: number;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const newId = `cust-${Date.now()}`;
  const now = new Date().toISOString();

  const customerObj: Customer = {
    id: newId,
    business_id: input.business_id,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    credit_limit: Number(input.credit_limit) || 0,
    current_balance: 0,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          business_id: input.business_id,
          name: input.name.trim(),
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          address: input.address?.trim() || null,
          credit_limit: Number(input.credit_limit) || 0,
          current_balance: 0,
        })
        .select()
        .single();

      if (!error && data) {
        // Also sync local
        const current = getStoredCustomers();
        setStoredCustomers([data as Customer, ...current]);
        return data as Customer;
      }
      console.warn('Supabase customer create error, writing to local store:', error);
    } catch (err) {
      console.warn('Supabase create customer failed, writing to local store:', err);
    }
  }

  // Fallback
  const current = getStoredCustomers();
  const updated = [customerObj, ...current];
  setStoredCustomers(updated);
  return customerObj;
}

export async function updateCustomerBalance(
  customerId: string,
  amountDelta: number
): Promise<void> {
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
      console.warn('Failed to update customer balance on Supabase:', err);
    }
  }

  // Local fallback
  const list = getStoredCustomers();
  const idx = list.findIndex((c) => c.id === customerId);
  if (idx !== -1) {
    list[idx].current_balance = (list[idx].current_balance || 0) + amountDelta;
    list[idx].updated_at = new Date().toISOString();
    setStoredCustomers([...list]);
  }
}
