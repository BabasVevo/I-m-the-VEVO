import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-navy-950">
      {/* Left panel - branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 lg:flex">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Leaf className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Verdant</span>
        </div>
        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-bold leading-tight">
            Run your entire business from one place.
          </h1>
          <p className="mt-4 max-w-md text-lg text-brand-50/90">
            Point of sale, inventory, CRM, marketing automation, and analytics — all in a single, beautiful platform.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
            {['POS & Receipts', 'Inventory & Stock', 'Customer CRM', 'Marketing Automation', 'Multi-branch', 'Reports & Analytics'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-brand-50/80">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-brand-50/60">© 2026 Verdant. All rights reserved.</p>
        {/* Decorative circles */}
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5" />
      </div>

      {/* Right panel - form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-navy-900 dark:text-white">Verdant</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
