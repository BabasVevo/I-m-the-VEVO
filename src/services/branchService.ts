import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Branch, Employee } from '@/types/database';
import { logActivity } from './activityLogService';
import { getStoredBranches, getEmployees } from './employeeService';

export const DEMO_BRANCHES_STORAGE_KEY = 'babas_demo_branches_v2';

export interface CreateBranchInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  manager_id?: string | null;
  is_active?: boolean;
}

export const INITIAL_EXTENDED_BRANCHES: Branch[] = [
  {
    id: 'branch-downtown',
    business_id: 'demo-biz-1',
    name: 'Bujumbura Flagship (Rohero)',
    address: 'Boulevard du 1er Novembre, Rohero',
    phone: '+257 22 25 1200',
    email: 'rohero@babaspos.bi',
    city: 'Bujumbura',
    manager_id: 'demo-user-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-01-15T08:30:00Z',
  },
  {
    id: 'branch-gitega',
    business_id: 'demo-biz-1',
    name: 'Gitega Commercial Hub',
    address: 'Avenue du Commerce, Centre-Ville',
    phone: '+257 22 40 2300',
    email: 'gitega@babaspos.bi',
    city: 'Gitega',
    manager_id: 'emp-cashier-2',
    is_active: true,
    created_at: '2024-06-15T00:00:00Z',
    updated_at: '2026-02-10T11:00:00Z',
  },
  {
    id: 'branch-ngozi',
    business_id: 'demo-biz-1',
    name: 'Ngozi Wholesale & Distribution',
    address: 'Route Nationale 1, Quartier Commercial',
    phone: '+257 22 30 1800',
    email: 'ngozi@babaspos.bi',
    city: 'Ngozi',
    manager_id: null,
    is_active: true,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: '2026-03-01T09:15:00Z',
  },
  {
    id: 'branch-rumonge',
    business_id: 'demo-biz-1',
    name: 'Rumonge Port Depot',
    address: 'Avenue du Lac, Zone Portuaire',
    phone: '+257 22 50 1100',
    email: 'rumonge@babaspos.bi',
    city: 'Rumonge',
    manager_id: null,
    is_active: false,
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2026-04-12T14:20:00Z',
  },
];

function getStoredBranchesLocal(): Branch[] {
  try {
    const raw = localStorage.getItem(DEMO_BRANCHES_STORAGE_KEY);
    if (!raw) {
      const fallback = getStoredBranches();
      const initial = fallback && fallback.length > 0 ? fallback : INITIAL_EXTENDED_BRANCHES;
      localStorage.setItem(DEMO_BRANCHES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXTENDED_BRANCHES;
  }
}

function saveStoredBranchesLocal(branches: Branch[]): void {
  try {
    localStorage.setItem(DEMO_BRANCHES_STORAGE_KEY, JSON.stringify(branches));
  } catch (err) {
    console.error('Failed to save branches to localStorage', err);
  }
}

export async function fetchAllBranches(): Promise<Branch[]> {
  const employees = await getEmployees();
  const empMap = new Map(employees.map((e) => [e.id, e]));

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return (data as Branch[]).map((b) => {
          const assignedEmps = employees.filter((e) => e.branch_id === b.id);
          return {
            ...b,
            manager: b.manager_id ? empMap.get(b.manager_id) || null : null,
            employee_count: assignedEmps.length,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase branches fetch failed, using local storage:', err);
    }
  }

  const list = getStoredBranchesLocal();
  return list.map((b) => {
    const assignedEmps = employees.filter((e) => e.branch_id === b.id);
    return {
      ...b,
      manager: b.manager_id ? empMap.get(b.manager_id) || null : null,
      employee_count: assignedEmps.length,
    };
  });
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const all = await fetchAllBranches();
  return all.find((b) => b.id === id) || null;
}

export async function getEmployeesByBranch(branchId: string): Promise<Employee[]> {
  const all = await getEmployees();
  return all.filter((e) => e.branch_id === branchId);
}

export async function createBranch(
  input: CreateBranchInput,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<Branch> {
  const newBranch: Branch = {
    id: 'branch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    business_id: 'demo-biz-1',
    name: input.name.trim(),
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    city: input.city?.trim() || 'Bujumbura',
    manager_id: input.manager_id || null,
    is_active: input.is_active !== undefined ? input.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('branches')
        .insert([{
          name: newBranch.name,
          address: newBranch.address,
          phone: newBranch.phone,
          email: newBranch.email,
          manager_id: newBranch.manager_id,
          is_active: newBranch.is_active,
        }])
        .select()
        .single();
      if (!error && data) {
        await logActivity({
          business_id: 'demo-biz-1',
          branch_id: data.id,
          employee_id: actor?.id || 'admin',
          employee_name: actor?.name || 'Administrator',
          employee_role: actor?.role || 'Super Administrator',
          action_type: 'settings_updated',
          action_category: 'settings',
          description: `Created new branch "${newBranch.name}" (${newBranch.city || 'Burundi'})`,
          entity_type: 'branch',
          entity_id: data.id,
          entity_label: newBranch.name,
        });
        return data as Branch;
      }
    } catch (err) {
      console.warn('Supabase create branch failed:', err);
    }
  }

  const list = getStoredBranchesLocal();
  list.push(newBranch);
  saveStoredBranchesLocal(list);

  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: newBranch.id,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'settings_updated',
    action_category: 'settings',
    description: `Created new branch location "${newBranch.name}"`,
    entity_type: 'branch',
    entity_id: newBranch.id,
    entity_label: newBranch.name,
  });

  return newBranch;
}

export async function updateBranch(
  id: string,
  updates: Partial<Branch>,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<Branch> {
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('branches')
        .update({
          name: updates.name,
          address: updates.address,
          phone: updates.phone,
          email: updates.email,
          manager_id: updates.manager_id,
          is_active: updates.is_active,
          updated_at: updatedAt,
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        await logActivity({
          business_id: 'demo-biz-1',
          branch_id: id,
          employee_id: actor?.id || 'admin',
          employee_name: actor?.name || 'Administrator',
          employee_role: actor?.role || 'Super Administrator',
          action_type: 'settings_updated',
          action_category: 'settings',
          description: `Updated branch settings for "${updates.name || data.name}"`,
          entity_type: 'branch',
          entity_id: id,
          entity_label: updates.name || data.name,
        });
        return data as Branch;
      }
    } catch (err) {
      console.warn('Supabase update branch failed:', err);
    }
  }

  const list = getStoredBranchesLocal();
  const idx = list.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error('Branch not found');

  const existing = list[idx];
  const updated: Branch = {
    ...existing,
    ...updates,
    updated_at: updatedAt,
  };
  list[idx] = updated;
  saveStoredBranchesLocal(list);

  await logActivity({
    business_id: 'demo-biz-1',
    branch_id: id,
    employee_id: actor?.id || 'admin',
    employee_name: actor?.name || 'Administrator',
    employee_role: actor?.role || 'Super Administrator',
    action_type: 'settings_updated',
    action_category: 'settings',
    description: `Updated branch details for "${updated.name}"`,
    entity_type: 'branch',
    entity_id: id,
    entity_label: updated.name,
  });

  return updated;
}

export async function toggleBranchStatus(
  id: string,
  isActive: boolean,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<Branch> {
  return updateBranch(id, { is_active: isActive }, actor);
}

export async function deleteBranch(
  id: string,
  actor?: { id: string; name: string; role: string; branchId?: string }
): Promise<boolean> {
  // Check if branch has assigned employees or records
  const employees = await getEmployees();
  const assigned = employees.filter((e) => e.branch_id === id);
  if (assigned.length > 0) {
    throw new Error(`Cannot delete branch: ${assigned.length} employees are assigned. Please reassign them first.`);
  }

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (!error) {
        await logActivity({
          business_id: 'demo-biz-1',
          branch_id: id,
          employee_id: actor?.id || 'admin',
          employee_name: actor?.name || 'Administrator',
          employee_role: actor?.role || 'Super Administrator',
          action_type: 'settings_updated',
          action_category: 'settings',
          description: `Removed branch location ID #${id}`,
          entity_type: 'branch',
          entity_id: id,
        });
        return true;
      }
    } catch (err) {
      console.warn('Supabase delete branch failed:', err);
    }
  }

  const list = getStoredBranchesLocal();
  const branchToDelete = list.find((b) => b.id === id);
  const filtered = list.filter((b) => b.id !== id);
  saveStoredBranchesLocal(filtered);

  if (branchToDelete) {
    await logActivity({
      business_id: 'demo-biz-1',
      branch_id: id,
      employee_id: actor?.id || 'admin',
      employee_name: actor?.name || 'Administrator',
      employee_role: actor?.role || 'Super Administrator',
      action_type: 'settings_updated',
      action_category: 'settings',
      description: `Removed branch location "${branchToDelete.name}"`,
      entity_type: 'branch',
      entity_id: id,
      entity_label: branchToDelete.name,
    });
  }

  return true;
}
