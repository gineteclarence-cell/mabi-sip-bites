import { useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthSplitLayout from '@/Components/Layout/AuthSplitLayout';
import Input from '@/Components/UI/Input';
import Button from '@/Components/UI/Button';
import { ToastProvider, useToast } from '@/Components/UI/ToastProvider';

function LoginForm() {
  const { flash } = usePage().props;
  const { showToast } = useToast();
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    if (flash?.success) showToast({ type: 'success', title: flash.success });
    if (flash?.error) showToast({ type: 'error', title: flash.error });
  }, [flash]);

  function handleSubmit(e) {
    e.preventDefault();
    post(route('login'), {
      onSuccess: () => showToast({ type: 'success', title: 'Logged in successfully' }),
    });
  }

  return (
    <>
      <Head title="Log in" />

      <AuthSplitLayout
        formTitle="Welcome back"
        formSubtitle="Sign in to access your Mabi Sip & Bites workspace."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            inputModeType="email"
            leftIcon={<Mail className="size-4" />}
            value={data.email}
            onChange={(v) => setData('email', v)}
            error={errors.email}
            placeholder="you@mabisipbites.test"
            required
            autoFocus
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-text-primary">
                Password
              </label>
              <a href="#" className="text-sm font-medium text-brand-ink hover:underline">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              inputModeType="password"
              leftIcon={<Lock className="size-4" />}
              value={data.password}
              onChange={(v) => setData('password', v)}
              error={errors.password}
              placeholder="Enter your password"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={data.remember}
              onChange={(e) => setData('remember', e.target.checked)}
              className="size-4 rounded border-border text-brand focus:ring-brand"
            />
            Keep me signed in
          </label>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={processing}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <a href={route('register')} className="font-medium text-brand-ink hover:underline">
            Sign up
          </a>
        </p>
      </AuthSplitLayout>
    </>
  );
}

export default function Login() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}
