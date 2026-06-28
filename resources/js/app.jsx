import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ToastProvider } from './Components/UI/ToastProvider';

const appName = import.meta.env.VITE_APP_NAME || 'Mabi Sip & Bites';

/**
 * ToastProvider is mounted ONCE here, wrapping <App />, rather than
 * inside AppLayout.jsx / Login.jsx / Register.jsx individually.
 *
 * THIS IS THE FIX for "no toast on login/logout/create/update/archive/
 * delete": every one of those actions ends in an Inertia navigation
 * (redirect to /dashboard after login, back to the same page after a
 * CRUD action, back to /login after logout). Inertia swaps out the page
 * component on every navigation — so a ToastProvider that lived INSIDE
 * a page component (as it did before) got unmounted and remounted on
 * every single navigation, wiping out any toast queued right before the
 * navigation fired, before the person ever saw it.
 *
 * By mounting ToastProvider here, above createInertiaApp's per-page
 * <App />, its state survives every page swap. AppLayout.jsx, Login.jsx,
 * and Register.jsx no longer wrap themselves in their own ToastProvider
 * — they just call useToast() and rely on this single top-level instance.
 */
createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);

    root.render(
      <ToastProvider>
        <App {...props} />
      </ToastProvider>
    );
  },
  progress: {
    color: '#FFDE59',
  },
});
