import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const { isDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        setSent(true);
        toast('Reset link simulated in Demo Mode.', 'success');
      }, 500);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      setSent(true);
      toast('Reset link sent. Check your inbox.', 'success');
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-navy-900 dark:text-white">Reset password</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-navy-400">
        Enter your email and we'll send you a reset link.
      </p>

      {sent ? (
        <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200">
          A password reset link has been sent to <strong>{email}</strong>. Follow the link in the email to set a new password.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="email" required className="input pl-10" placeholder="you@business.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-navy-900 dark:text-navy-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </AuthLayout>
  );
}
