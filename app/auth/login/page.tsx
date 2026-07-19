import { Navbar } from "@/components/landing/Navbar";
import { Suspense } from "react";

import LoginForm from "./LoginForm";

export default function LoginPage() {
	return (
		<>
			<Navbar />
			<Suspense fallback={null}>
				<LoginForm />
			</Suspense>
		</>
	);
}
