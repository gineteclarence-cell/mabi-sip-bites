import { useEffect } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import AuthSplitLayout from "@/Components/Layout/AuthSplitLayout";
import Input from "@/Components/UI/Input";
import Button from "@/Components/UI/Button";
import { useToast } from "@/Components/UI/ToastProvider";

export default function Login() {
    const { flash } = usePage().props;
    const { showToast } = useToast();

    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    useEffect(() => {
        if (flash?.success) {
            showToast({
                type: "success",
                title: flash.success,
            });
        }

        if (flash?.error) {
            showToast({
                type: "error",
                title: flash.error,
            });
        }
    }, [flash, showToast]);

    function handleSubmit(e) {
        e.preventDefault();

        post(route("login"), {
            onSuccess: () =>
                showToast({
                    type: "success",
                    title: "Logged in successfully.",
                }),
            onError: () =>
                showToast({
                    type: "error",
                    title: "Unable to log in. Check your details.",
                }),
        });
    }

    return (
        <>
            <Head title="Log in" />

            <AuthSplitLayout
                formTitle="Welcome back"
                formSubtitle="Sign in to continue to your workspace."
            >
                <div className="w-full">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email address"
                            inputModeType="email"
                            leftIcon={<Mail className="size-4" />}
                            value={data.email}
                            onChange={(value) => setData("email", value)}
                            error={errors.email}
                            placeholder="you@mabisipbites.test"
                            required
                            autoFocus
                        />

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-text-primary"
                                >
                                    Password
                                </label>

                                <a
                                    href="#"
                                    className="text-xs font-medium text-text-secondary transition-colors hover:text-brand-ink"
                                >
                                    Forgot password?
                                </a>
                            </div>

                            <Input
                                id="password"
                                inputModeType="password"
                                leftIcon={<Lock className="size-4" />}
                                value={data.password}
                                onChange={(value) => setData("password", value)}
                                error={errors.password}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="size-4 rounded border-border bg-transparent text-brand focus:ring-2 focus:ring-brand/30"
                                />

                                <span className="text-sm text-text-secondary">
                                    Keep me signed in
                                </span>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="mt-1 w-full"
                            loading={processing}
                            rightIcon={
                                !processing ? (
                                    <ArrowRight className="size-4" />
                                ) : null
                            }
                        >
                            Sign in
                        </Button>
                    </form>

                    <div className="mt-7 border-t border-border pt-5">
                        <p className="text-center text-xs leading-5 text-text-secondary">
                            Mabi Sip &amp; Bites Store Management
                        </p>
                    </div>
                </div>
            </AuthSplitLayout>
        </>
    );
}
