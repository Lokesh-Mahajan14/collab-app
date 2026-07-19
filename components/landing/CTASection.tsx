import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="relative rounded-2xl border border-border bg-foreground text-background p-12 sm:p-16 overflow-hidden">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-background/10 border border-background/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-6 h-6 fill-background text-background" />
            </div>

            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-balance">
              Start building together today.
            </h2>
            <p className="mt-4 text-background/70 text-lg max-w-md mx-auto">
              Free for small teams. No credit card. Set up in 60 seconds.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 gap-2 min-w-[200px]"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-background/30 text-background hover:bg-background/10 min-w-[160px]"
                >
                  Watch demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
  Support: ["Documentation", "Status", "Contact", "Community"],
};

export function Footer() {
  return (
    <footer className="border-t border-border py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-background fill-background" />
              </div>
              <span className="font-semibold text-sm">CollabFlow</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[160px]">
              Real-time collaboration for modern teams.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
                {category}
              </p>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CollabFlow, Inc. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, TypeScript & shadcn/ui
          </p>
        </div>
      </div>
    </footer>
  );
}
