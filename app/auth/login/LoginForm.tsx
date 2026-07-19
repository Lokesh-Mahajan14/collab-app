"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validators/auth";

type LoginFormState = {
	email: string;
	password: string;
};

const initialFormState: LoginFormState = {
	email: "",
	password: "",
};

export default function LoginForm() {
	const searchParams = useSearchParams();
	const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

	const [form, setForm] = useState<LoginFormState>(initialFormState);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	const updateField = (field: keyof LoginFormState, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);

		const parsed = loginSchema.safeParse(form);

		if (!parsed.success) {
			const firstIssue = parsed.error.issues[0];
			toast.error(firstIssue?.message ?? "Please check your form and try again");
			setIsSubmitting(false);
			return;
		}

		const result = await signIn("credentials", {
			email: parsed.data.email,
			password: parsed.data.password,
			redirect: false,
			callbackUrl,
		});

		if (result?.error) {
			toast.error("Invalid email or password");
			setIsSubmitting(false);
			return;
		}

		toast.success("Welcome back.");
		window.location.href = result?.url ?? callbackUrl;
	};

	const handleGoogleLogin = async () => {
		setIsGoogleLoading(true);
		await signIn("google", { callbackUrl });
		setIsGoogleLoading(false);
	};

	return (
		<AuthShell
			title="Welcome back"
			subtitle="Log in to manage projects, tasks, and team conversations."
			footerText="Don't have an account?"
			footerCtaLabel="Create one"
			footerCtaHref="/auth/signup"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
					<label htmlFor="email" className="text-sm font-medium">
						Email
					</label>
					<Input
						id="email"
						type="email"
						placeholder="you@company.com"
						autoComplete="email"
						value={form.email}
						onChange={(event) => updateField("email", event.target.value)}
						disabled={isSubmitting || isGoogleLoading}
					/>
				</div>

				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
					<div className="flex items-center justify-between">
						<label htmlFor="password" className="text-sm font-medium">
							Password
						</label>
						<Link href="#" className="text-xs font-medium text-muted-foreground hover:underline">
							Forgot password?
						</Link>
					</div>
					<Input
						id="password"
						type="password"
						placeholder="Enter your password"
						autoComplete="current-password"
						value={form.password}
						onChange={(event) => updateField("password", event.target.value)}
						disabled={isSubmitting || isGoogleLoading}
					/>
				</div>

				<Button
					className="h-10 w-full bg-amber-600 text-white hover:bg-amber-700 animate-fade-up"
					type="submit"
					disabled={isSubmitting || isGoogleLoading}
					style={{ animationDelay: "200ms", animationFillMode: "both" }}
				>
					{isSubmitting ? "Signing in..." : "Sign in"}
				</Button>

				<div className="relative py-1 text-center text-xs uppercase tracking-wide text-muted-foreground animate-fade-up" style={{ animationDelay: "250ms", animationFillMode: "both" }}>
					<span className="bg-white px-2">Or continue with</span>
					<div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-border" />
				</div>

				<Button
					type="button"
					variant="outline"
					className="h-10 w-full animate-fade-up"
					onClick={handleGoogleLogin}
					disabled={isSubmitting || isGoogleLoading}
					style={{ animationDelay: "300ms", animationFillMode: "both" }}
				>
					<GoogleIcon className="mr-2 size-4" />
					{isGoogleLoading ? "Redirecting..." : "Sign in with Google"}
				</Button>
			</form>
		</AuthShell>
	);
}