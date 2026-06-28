import { Head, useForm } from '@inertiajs/react';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import AuthSplitLayout from '@/Components/Layout/AuthSplitLayout';
import Input from '@/Components/UI/Input';
import Button from '@/Components/UI/Button';
import { useToast } from '@/Components/UI/ToastProvider';
import { isStrongPassword } from '@/lib/validators';

/**
 * Register no longer wraps itself in <ToastProvider> — see Login.jsx's
 * docblock for the full explanation. ToastProvider now lives once, at
 * the top of resources/js/app.jsx.
 */
export default function Register() {
  const { showToast } = useToast();
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    contact_number: '',
    password: '',
    password_confirmation: '',
  });

  const passwordIsStrong = data.password === '' || isStrongPassword(data.password);

  function handleSubmit(e) {
    e.preventDefault();
    post(route('register'), {
      onSuccess: () => showToast({ type: 'success', title: 'Account created successfully.' }),
      onError: () => showToast({ type: 'error', title: 'Please fix the errors below.' }),
    });
  }

  return (
    <>
      <Head title="Sign up" />

      <AuthSplitLayout
        formTitle="Create your account"
        formSubtitle="Join the Mabi Sip & Bites workspace."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            inputModeType="alpha"
            leftIcon={<User className="size-4" />}
            value={data.name}
            onChange={(v) => setData('name', v)}
            error={errors.name}
            placeholder="Juan Dela Cruz"
            required
            autoFocus
          />

          <Input
            label="Email address"
            inputModeType="email"
            leftIcon={<Mail className="size-4" />}
            value={data.email}
            onChange={(v) => setData('email', v)}
            error={errors.email}
            placeholder="you@mabisipbites.test"
            required
          />

          <Input
            label="Contact number"
            inputModeType="contact"
            leftIcon={<Phone className="size-4" />}
            value={data.contact_number}
            onChange={(v) => setData('contact_number', v)}
            error={errors.contact_number}
            placeholder="09171234567"
            helpText="11 digits, starts with 09"
            required
          />

          <Input
            label="Password"
            inputModeType="password"
            leftIcon={<Lock className="size-4" />}
            value={data.password}
            onChange={(v) => setData('password', v)}
            error={
              errors.password ||
              (!passwordIsStrong ? 'Min 8 characters with a letter, number, and symbol' : undefined)
            }
            placeholder="Create a password"
            required
          />

          <Input
            label="Confirm password"
            inputModeType="password"
            leftIcon={<Lock className="size-4" />}
            value={data.password_confirmation}
            onChange={(v) => setData('password_confirmation', v)}
            error={errors.password_confirmation}
            placeholder="Re-enter your password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={processing}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <a href={route('login')} className="font-medium text-brand-ink hover:underline">
            Log in
          </a>
        </p>
      </AuthSplitLayout>
    </>
  );
}
