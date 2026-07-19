"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardPreview } from "@/components/landing/DashboardPreview";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* Warm gradient orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, hsl(28 85% 52% / 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Announcement badge */}
        <div
          className="mb-8 animate-fade-up"
          style={{ animationDelay: "0ms", animationFillMode: "both" }}
        >
          <div className="inline-flex items-center rounded-full border border-border bg-background gap-1.5 text-xs font-medium px-3 py-1">
            <Star className="w-3 h-3 fill-current text-amber-500" />
            <span>Now with AI-powered task suggestions</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Main heading */}
        <h1
          className="text-[clamp(2.5rem,8vw,5rem)] font-semibold tracking-tight leading-[1.05] text-balance max-w-4xl animate-fade-up"
          style={{ animationDelay: "80ms", animationFillMode: "both" }}
        >
          Where your team{" "}
          <span className="relative">
            <span className="relative z-10">builds together</span>
            <span
              className="absolute bottom-1 left-0 right-0 h-3 -z-0 opacity-30 rounded"
              style={{ background: "hsl(28 85% 52%)" }}
            />
          </span>
        </h1>

        {/* Subheading */}
        <p
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed animate-fade-up"
          style={{ animationDelay: "160ms", animationFillMode: "both" }}
        >
          Projects, tasks, docs, and real-time chat — unified in one calm
          workspace. No noise, just work.
        </p>

        {/* CTA buttons */}
        <div
          className="mt-8 flex flex-col sm:flex-row items-center gap-3 animate-fade-up"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          <Link href="/auth/signup">
            <Button size="lg" className="gap-2 min-w-[180px]">
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              variant="outline"
              size="lg"
              className="min-w-[160px]"
            >
              See how it works
            </Button>
          </Link>
        </div>

        {/* Social proof micro-line */}
        <p
          className="mt-5 text-xs text-muted-foreground animate-fade-up"
          style={{ animationDelay: "320ms", animationFillMode: "both" }}
        >
          Free forever for small teams · No credit card required
        </p>

        {/* Dashboard preview screenshot */}
        <div
          className="mt-16 w-full max-w-5xl animate-fade-up"
          style={{ animationDelay: "440ms", animationFillMode: "both" }}
        >
          <div className="relative rounded-xl border border-border shadow-2xl shadow-black/8 overflow-hidden bg-card">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 mx-3">
                <div className="max-w-xs mx-auto h-6 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    app.collabflow.dev/dashboard
                  </span>
                </div>
              </div>
            </div>
            {/* Mock dashboard */}
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
