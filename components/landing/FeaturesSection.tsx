import {
  Zap,
  Users,
  MessageSquare,
  FileText,
  Bell,
  Shield,
  BarChart3,
  Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Real-time everything",
    description:
      "See changes as they happen. Cursors, edits, and task updates sync instantly across every connected teammate — no refresh needed.",
    accent: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    size: "large",
  },
  {
    icon: Layers,
    title: "Projects & tasks",
    description:
      "Kanban boards, list views, and filters. Organize work the way your team actually thinks.",
    accent: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    size: "small",
  },
  {
    icon: MessageSquare,
    title: "Built-in chat",
    description:
      "Every project gets its own channel. No Slack tab-switching, just context-aware conversation.",
    accent: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    size: "small",
  },
  {
    icon: FileText,
    title: "File attachments",
    description:
      "Attach docs, images, and PDFs directly to tasks. Stored securely, accessible anywhere.",
    accent: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    size: "small",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    description:
      "Email alerts and in-app pings that know when to be quiet. Never miss what matters.",
    accent: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    size: "small",
  },
  {
    icon: Shield,
    title: "Roles & permissions",
    description:
      "Admins, managers, and members. Fine-grained control over who can see and do what.",
    accent: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    size: "small",
  },
  {
    icon: Users,
    title: "Workspace management",
    description:
      "Invite teammates, manage billing, and control workspace settings from one place.",
    accent: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    size: "small",
  },
  {
    icon: BarChart3,
    title: "Analytics & insights",
    description:
      "Track velocity, burndown, and workload distribution to keep projects on track.",
    accent: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/40",
    size: "small",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-balance">
            Everything your team needs, nothing it doesn&rsquo;t.
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            const isLarge = feature.size === "large";

            return (
              <div
                key={feature.title}
                className={`group relative rounded-xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-sm transition-all duration-200 ${
                  isLarge ? "sm:col-span-2 lg:col-span-1 lg:row-span-2" : ""
                }`}
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "both",
                }}
              >
                {/* Icon */}
                <div
                  className={`inline-flex w-10 h-10 rounded-lg items-center justify-center mb-4 ${feature.bg}`}
                >
                  <Icon className={`w-5 h-5 ${feature.accent}`} />
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Large card gets an extra visual element */}
                {isLarge && (
                  <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-2">
                    {["Cursor: Sarah is editing…", "Cursor: Raj joined", "Doc synced · 2ms latency"].map(
                      (line) => (
                        <div
                          key={line}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          {line}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
