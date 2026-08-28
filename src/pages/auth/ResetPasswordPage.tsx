import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);

    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        toast('Password updated in Demo Mode.', 'success');
        navigate('/login');
      }, 500);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast('Password updated successfully.', 'success');
      navigate('/login');
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Set new password</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-navy-400">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="password" required className="input pl-10" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="password" required className="input pl-10" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <Link to="/login" className="mt-6 block text-center text-sm text-gray-500 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white">
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
