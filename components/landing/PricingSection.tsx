import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For small teams just getting started.",
    cta: "Get started",
    href: "/auth/signup",
    highlighted: false,
    features: [
      "Up to 5 members",
      "3 active projects",
      "1 GB file storage",
      "Basic chat",
      "Email notifications",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "per member / month",
    description: "For growing teams that need more power.",
    cta: "Start free trial",
    href: "/auth/signup?plan=pro",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Unlimited members",
      "Unlimited projects",
      "50 GB file storage",
      "Real-time collaboration",
      "Advanced permissions",
      "Priority email support",
      "Analytics dashboard",
      "Custom notifications",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "talk to us",
    description: "For large organisations with specific needs.",
    cta: "Contact sales",
    href: "/contact",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "SSO / SAML",
      "Audit logs",
      "SLA guarantee",
      "Dedicated support",
      "Custom integrations",
      "On-premise option",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-muted/20 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Simple, honest pricing.
          </h2>
          <p className="mt-4 text-muted-foreground">
            No hidden fees. Cancel any time. Free forever for small teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-xl border bg-card p-7 flex flex-col gap-6 transition-shadow hover:shadow-md",
                plan.highlighted
                  ? "border-foreground shadow-lg"
                  : "border-border"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-foreground text-background text-[11px] font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{plan.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* CTA */}
              <Link href={plan.href}>
                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full justify-center"
                >
                  {plan.cta}
                </Button>
              </Link>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All plans include a 14-day free trial. No credit card required for Free plan.
        </p>
      </div>
    </section>
  );
}
