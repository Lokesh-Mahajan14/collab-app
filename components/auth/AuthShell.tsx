import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  title: string;
  subtitle: string;
  footerText: string;
  footerCtaLabel: string;
  footerCtaHref: string;
  children: ReactNode;
};

export function AuthShell({
  title,
  subtitle,
  footerText,
  footerCtaLabel,
  footerCtaHref,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background gradient - matching landing page */}
      <div className="absolute inset-0 bg-background" />

      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Warm gradient orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, hsl(28 85% 52% / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4 py-16">
        <div
          className="rounded-3xl border border-border bg-white/90 p-8 shadow-[0_20px_80px_-25px_rgba(120,53,15,0.28)] backdrop-blur-sm animate-fade-up"
          style={{ animationDelay: "0ms", animationFillMode: "both" }}
        >
          <div className="mb-8 space-y-3 text-center">
            <p className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              CollabFlow Auth
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          <p
            className={cn(
              "mt-6 text-center text-sm text-muted-foreground",
              "[&_a]:font-semibold [&_a]:text-amber-700 [&_a]:underline-offset-4 [&_a]:hover:underline"
            )}
          >
            {footerText} <Link href={footerCtaHref}>{footerCtaLabel}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
