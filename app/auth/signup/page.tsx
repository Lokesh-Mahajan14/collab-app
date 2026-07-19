"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { Navbar } from "@/components/landing/Navbar";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/axios";
import { signupSchema } from "@/lib/validators/auth";

type SignupFormState = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
};

const initialFormState: SignupFormState = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

export default function SignupPage() {
	const router = useRouter();
	const [form, setForm] = useState<SignupFormState>(initialFormState);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);

	const updateField = (field: keyof SignupFormState, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setIsSubmitting(true);

		const parsed = signupSchema.safeParse(form);

		if (!parsed.success) {
			const firstIssue = parsed.error.issues[0];
			toast.error(firstIssue?.message ?? "Please check your form and try again");
			setIsSubmitting(false);
			return;
		}

		try {
			await api.post("/auth/signup", parsed.data);

			const loginResult = await signIn("credentials", {
				email: parsed.data.email,
				password: parsed.data.password,
				redirect: false,
			});

			if (loginResult?.error) {
				toast.success("Account created. Please log in.");
				router.push("/auth/login");
				return;
			}

			toast.success("Your account is ready. Welcome to CollabFlow.");
			router.push("/dashboard");
			router.refresh();
		} catch (error) {
			if (isAxiosError(error)) {
				const message =
					(error.response?.data as { message?: string } | undefined)?.message ??
					"Unable to create account";
				toast.error(message);
			} else {
				toast.error("Something went wrong. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoogleSignup = async () => {
		setIsGoogleLoading(true);
		await signIn("google", { callbackUrl: "/dashboard" });
		setIsGoogleLoading(false);
	};

	return (
		<>
			<Navbar />
			<AuthShell
				title="Create your account"
				subtitle="Start collaborating with your team in minutes."
				footerText="Already have an account?"
				footerCtaLabel="Log in"
				footerCtaHref="/auth/login"
			>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
					<label htmlFor="name" className="text-sm font-medium">
						Full name
					</label>
					<Input
						id="name"
						placeholder="Jane Doe"
						autoComplete="name"
						value={form.name}
						onChange={(event) => updateField("name", event.target.value)}
						disabled={isSubmitting || isGoogleLoading}
					/>
				</div>

				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
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

				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
					<label htmlFor="password" className="text-sm font-medium">
						Password
					</label>
					<Input
						id="password"
						type="password"
						placeholder="At least 8 characters"
						autoComplete="new-password"
						value={form.password}
						onChange={(event) => updateField("password", event.target.value)}
						disabled={isSubmitting || isGoogleLoading}
					/>
				</div>

				<div className="space-y-2 animate-fade-up" style={{ animationDelay: "250ms", animationFillMode: "both" }}>
					<label htmlFor="confirmPassword" className="text-sm font-medium">
						Confirm password
					</label>
					<Input
						id="confirmPassword"
						type="password"
						placeholder="Re-enter your password"
						autoComplete="new-password"
						value={form.confirmPassword}
						onChange={(event) => updateField("confirmPassword", event.target.value)}
						disabled={isSubmitting || isGoogleLoading}
					/>
				</div>

				<Button
					className="h-10 w-full bg-amber-600 text-white hover:bg-amber-700 animate-fade-up"
					type="submit"
					disabled={isSubmitting || isGoogleLoading}
					style={{ animationDelay: "300ms", animationFillMode: "both" }}
				>
					{isSubmitting ? "Creating account..." : "Create account"}
				</Button>

				<div className="relative py-1 text-center text-xs uppercase tracking-wide text-muted-foreground animate-fade-up" style={{ animationDelay: "350ms", animationFillMode: "both" }}>
					<span className="bg-white px-2">Or continue with</span>
					<div className="absolute inset-x-0 top-1/2 -z-10 h-px -translate-y-1/2 bg-border" />
				</div>

				<Button
					type="button"
					variant="outline"
					className="h-10 w-full animate-fade-up"
					onClick={handleGoogleSignup}
					disabled={isSubmitting || isGoogleLoading}
					style={{ animationDelay: "400ms", animationFillMode: "both" }}
				>
					<GoogleIcon className="mr-2 size-4" />
					{isGoogleLoading ? "Redirecting..." : "Sign up with Google"}
				</Button>
			</form>

				<p className="mt-4 text-center text-xs text-muted-foreground">
					By creating an account, you agree to our <Link href="#">Terms</Link> and <Link href="#">Privacy Policy</Link>.
				</p>
			</AuthShell>
		</>
	)
}
