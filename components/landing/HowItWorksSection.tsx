const STEPS = [
  {
    number: "01",
    title: "Sign in with Google",
    description:
      "One click — no passwords. Your Google account is all you need to get in. We handle the rest securely.",
    visual: "auth",
  },
  {
    number: "02",
    title: "Create your workspace",
    description:
      "Give your team a home. Invite members, set roles, and you're ready to start building in under a minute.",
    visual: "workspace",
  },
  {
    number: "03",
    title: "Build projects & tasks",
    description:
      "Create projects with tasks, set priorities, assign owners, and attach deadlines. Keep it simple or go deep.",
    visual: "tasks",
  },
  {
    number: "04",
    title: "Collaborate in real time",
    description:
      "Edit documents together, chat in project channels, and see your teammates' cursors live. No lag, no conflicts.",
    visual: "realtime",
  },
];

function StepVisual({ type }: { type: string }) {
  if (type === "auth") {
    return (
      <div className="w-full rounded-lg border border-border bg-muted/20 p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
          <svg className="w-6 h-6 text-background fill-background" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="w-full max-w-xs rounded-lg border border-border bg-card p-4 flex flex-col gap-3 shadow-sm">
          <p className="text-xs text-center text-muted-foreground">Sign in to CollabFlow</p>
          <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-border bg-background text-xs font-medium hover:bg-muted transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  if (type === "workspace") {
    return (
      <div className="w-full rounded-lg border border-border bg-muted/20 p-6 flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">AC</div>
          <div>
            <p className="text-sm font-semibold">Acme Corp</p>
            <p className="text-xs text-muted-foreground">3 members · 2 projects</p>
          </div>
          <div className="ml-auto flex -space-x-2">
            {["AR", "JL", "SM"].map((a, i) => (
              <div key={a} className={`w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center ring-2 ring-background ${["bg-violet-100 text-violet-700","bg-blue-100 text-blue-700","bg-teal-100 text-teal-700"][i]}`}>{a}</div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          <span>+</span> Invite teammates by email…
        </div>
      </div>
    );
  }

  if (type === "tasks") {
    return (
      <div className="w-full rounded-lg border border-border bg-muted/20 p-4 flex flex-col gap-2">
        {[
          { title: "Design token system", status: "DONE", priority: "HIGH" },
          { title: "Build auth flow", status: "IN_PROGRESS", priority: "URGENT" },
          { title: "File upload API", status: "TODO", priority: "MEDIUM" },
        ].map((t) => (
          <div key={t.title} className="flex items-center gap-3 p-3 rounded-md bg-card border border-border">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "DONE" ? "bg-green-500" : t.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-muted-foreground/40"}`} />
            <span className={`text-xs flex-1 ${t.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.priority === "URGENT" ? "bg-red-50 text-red-600" : t.priority === "HIGH" ? "bg-orange-50 text-orange-600" : "bg-muted text-muted-foreground"}`}>{t.priority}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-border bg-muted/20 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span>3 people editing this document</span>
      </div>
      {["Sarah: updated section 2", "Raj: added comment", "You: merged changes"].map((line) => (
        <div key={line} className="flex items-center gap-2 px-3 py-2 rounded bg-card border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-xs text-muted-foreground">{line}</span>
        </div>
      ))}
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-balance">
            Up and running in four steps.
          </h2>
        </div>

        <div className="flex flex-col gap-20">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col md:flex-row items-center gap-10 md:gap-16 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
            >
              {/* Text */}
              <div className="flex-1">
                <span className="text-5xl font-semibold text-border tabular-nums">
                  {step.number}
                </span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Visual */}
              <div className="flex-1 w-full">
                <StepVisual type={step.visual} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
