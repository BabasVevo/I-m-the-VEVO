import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, User, Building2, MapPin, Phone } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode, registerDemo } = useAuth();
  const [loading, setLoading] = useState(false);

  // Business + branch + admin form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }
    setLoading(true);

    if (isDemoMode) {
      await registerDemo({
        fullName,
        email,
        businessName,
        branchName,
        phone,
        address: businessAddress,
      });
      toast('Account created in Demo Mode! Welcome to BABAS.', 'success');
      navigate('/dashboard');
      setLoading(false);
      return;
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed — no user returned.');

      const userId = authData.user.id;

      // 2. Create business
      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .insert({ name: businessName, phone: businessPhone, address: businessAddress, email })
        .select()
        .single();
      if (bizError) throw bizError;

      // 3. Get or create super_admin system role
      let { data: ownerRole } = await supabase
        .from('roles')
        .select('id')
        .or('name.eq.super_admin,name.eq.business_owner,name.eq.admin')
        .eq('is_system', true)
        .order('name', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!ownerRole) {
        const { data: createdRole } = await supabase
          .from('roles')
          .insert({
            business_id: biz.id,
            name: 'super_admin',
            display_name: 'Super Administrator',
            description: 'Super Administrator with unrestricted master access across all business modules.',
            is_system: true,
          })
          .select('id')
          .single();
        ownerRole = createdRole;
      }

      // 4. Create profile with Super Administrator role
      const { error: profError } = await supabase.from('profiles').insert({
        id: userId,
        business_id: biz.id,
        employee_id: 'EMP-001',
        full_name: fullName,
        email,
        phone,
        role_id: ownerRole?.id ?? null,
        job_title: 'Super Administrator & Founder',
        is_active: true,
      });
      if (profError) throw profError;

      // 5. Create first branch
      const { data: br, error: brError } = await supabase
        .from('branches')
        .insert({ business_id: biz.id, name: branchName, address: branchAddress, is_active: true })
        .select()
        .single();
      if (brError) throw brError;

      // 6. Link branch to profile + set as branch manager
      await supabase.from('profiles').update({ branch_id: br.id }).eq('id', userId);
      await supabase.from('branches').update({ manager_id: userId }).eq('id', br.id);

      toast('Account created successfully! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Create your account</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-navy-400">
        Register your business, first branch, and admin user in one step.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Admin user */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">Your Account</h3>
          <div>
            <label className="label">Full name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input required className="input pl-10" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" required className="input pl-10" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className="input pl-10" placeholder="+1 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="password" required className="input pl-10" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Business */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">Business</h3>
          <div>
            <label className="label">Business name</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input required className="input pl-10" placeholder="Acme Retail Co." value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Business phone</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className="input pl-10" placeholder="+1 555-0100" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Business address</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input className="input pl-10" placeholder="123 Main St" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* First branch */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">First Branch</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Branch name</label>
              <input required className="input" placeholder="Main Branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            </div>
            <div>
              <label className="label">Branch address</label>
              <input className="input" placeholder="123 Main St" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-navy-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
