export function SocialProofSection() {
  const companies = [
    "Vercel", "Linear", "Prisma", "Liveblocks", "Resend", "Upstash",
  ];

  const testimonials = [
    {
      quote:
        "CollabFlow replaced four tools we were using. Our team ships twice as fast and communication has never been cleaner.",
      name: "Anika Reddy",
      role: "CTO, BuildStack",
      initials: "AR",
      color: "bg-violet-100 text-violet-700",
    },
    {
      quote:
        "The real-time editing is so smooth it feels like magic. We killed our Slack for project channels and haven't looked back.",
      name: "James Lee",
      role: "Lead Engineer, Orbit",
      initials: "JL",
      color: "bg-blue-100 text-blue-700",
    },
    {
      quote:
        "Best onboarding of any tool we've tried. Up and running in 10 minutes. The role permissions alone saved us weeks of setup.",
      name: "Priya Nair",
      role: "Product Manager, Launchpad",
      initials: "PN",
      color: "bg-teal-100 text-teal-700",
    },
  ];

  return (
    <section className="py-16 border-y border-border bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Trusted by */}
        <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-8">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 mb-16">
          {companies.map((company) => (
            <span
              key={company}
              className="text-muted-foreground/50 font-semibold text-sm tracking-wide hover:text-muted-foreground transition-colors"
            >
              {company}
            </span>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-xs font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
