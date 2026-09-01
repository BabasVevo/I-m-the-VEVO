import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastInput {
  type?: ToastType;
  title?: string;
  message?: string;
  description?: string;
}

/**
 * Legacy calling conventions supported by `addToast` (kept for compatibility
 * with screens written before the toast API standardization):
 *  1. addToast('success', 'Saved')          — type first
 *  2. addToast('Saved', 'error')            — message first
 *  3. addToast({ type: 'success', title, message }) — object
 */
const TOAST_TYPES: string[] = ['success', 'error', 'info', 'warning'];

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  addToast: (
    ...args: [ToastType, string?] | [string, ToastType?] | [ToastInput]
  ) => void;
  /** Alias used across app pages: (message, type?) */
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const addToast = useCallback(
    (...args: [string | ToastInput, string?]) => {
      const a = args[0];
      const b = args[1];
      if (typeof a === 'string') {
        if (TOAST_TYPES.includes(a)) {
          toast(b || '', a as ToastType);
        } else {
          toast(a, (b as ToastType) || 'success');
        }
      } else {
        const body = a.message ?? a.description ?? '';
        const text = a.title && a.title !== body ? `${a.title}: ${body}` : body;
        toast(text, a.type || 'success');
      }
    },
    [toast]
  );

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    toast(message, type);
  }, [toast]);

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-brand-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-lg bg-white px-4 py-3 shadow-lg ring-1 ring-gray-200 dark:bg-navy-900 dark:ring-navy-700 animate-in slide-in-from-right"
          >
            {icons[t.type]}
            <p className="flex-1 text-sm text-navy-900 dark:text-navy-100">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-navy-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (message: string) => console.log('Toast:', message),
      addToast: (...args: [string | ToastInput, string?]) => {
        const a = args[0];
        const b = args[1];
        if (typeof a === 'string') console.log(`Toast (${TOAST_TYPES.includes(a) ? a : (b as string) || 'success'}):`, TOAST_TYPES.includes(a) ? b : a);
        else console.log(`Toast (${a.type || 'success'}):`, a.message ?? a.description);
      },
      showToast: (message: string) => console.log('Toast:', message),
    };
  }
  return ctx;
}
