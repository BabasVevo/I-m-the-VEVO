/**
 * Runtime smoke-test entry: mounts the real <App /> inside jsdom so every
 * screen can be exercised headlessly (login, navigation, RBAC).
 */
import { createRoot } from 'react-dom/client';
import App from '@/App';

declare global {
  interface Window {
    __boot: () => Promise<void>;
    __navigate: (path: string) => void;
  }
}

async function boot(): Promise<void> {
  const el = document.getElementById('root');
  if (!el) throw new Error('#root missing');
  const root = createRoot(el);
  root.render(<App />);
}

function navigate(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new window.PopStateEvent('popstate', { state: {} }));
}

window.__boot = boot;
window.__navigate = navigate;

export { boot, navigate };
