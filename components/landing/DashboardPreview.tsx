"use client";

import { CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TASKS = [
  { title: "Design system tokens", status: "DONE", priority: "HIGH", assignee: "AR" },
  { title: "Auth flow with Google OAuth", status: "IN_PROGRESS", priority: "URGENT", assignee: "JL" },
  { title: "WebSocket room architecture", status: "IN_PROGRESS", priority: "HIGH", assignee: "SM" },
  { title: "File upload to Cloudflare R2", status: "TODO", priority: "MEDIUM", assignee: "AR" },
  { title: "Email notification templates", status: "IN_REVIEW", priority: "MEDIUM", assignee: "JL" },
  { title: "Dashboard analytics charts", status: "TODO", priority: "LOW", assignee: "SM" },
];

const STATUS_ICON = {
  DONE: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5 text-blue-500" />,
  IN_REVIEW: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
  TODO: <Circle className="w-3.5 h-3.5 text-muted-foreground/60" />,
};

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-400",
  LOW: "bg-muted-foreground/40",
};

const AVATAR_COLORS: Record<string, string> = {
  AR: "bg-violet-100 text-violet-700",
  JL: "bg-blue-100 text-blue-700",
  SM: "bg-teal-100 text-teal-700",
};

export function DashboardPreview() {
  return (
    <div className="flex h-[420px] overflow-hidden select-none">
      {/* Sidebar */}
      <div className="w-48 border-r border-border bg-muted/20 flex-shrink-0 p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
          <div className="w-5 h-5 rounded bg-foreground flex-shrink-0" />
          <span className="text-xs font-semibold">Acme Corp</span>
        </div>
        {["Dashboard", "Projects", "My Tasks", "Messages", "Files"].map(
          (item, i) => (
            <div
              key={item}
              className={cn(
                "px-2 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors",
                i === 1
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i === 1 ? "bg-foreground" : "bg-muted-foreground/30"
                )}
              />
              {item}
            </div>
          )
        )}

        <div className="mt-4 px-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Projects
          </div>
          {["CollabFlow v2", "Marketing Site", "Mobile App"].map((p) => (
            <div
              key={p}
              className="px-1 py-1 text-xs text-muted-foreground flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-sm bg-muted-foreground/30" />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="border-b border-border px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold">CollabFlow v2</h2>
            <p className="text-[11px] text-muted-foreground">6 tasks · 3 members</p>
          </div>
          <div className="flex items-center gap-1.5">
            {["AR", "JL", "SM"].map((a) => (
              <div
                key={a}
                className={cn(
                  "w-6 h-6 rounded-full text-[9px] font-semibold flex items-center justify-center ring-2 ring-background -ml-1",
                  AVATAR_COLORS[a]
                )}
              >
                {a}
              </div>
            ))}
            <div className="ml-2 h-5 w-px bg-border" />
            <div className="px-2 py-0.5 rounded bg-foreground text-background text-[10px] font-medium ml-1">
              + Add task
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-0.5">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_56px_32px] gap-2 px-3 pb-1">
            {["Task", "Status", "Priority", ""].map((h) => (
              <span key={h} className="text-[10px] font-medium text-muted-foreground">
                {h}
              </span>
            ))}
          </div>

          {TASKS.map((task) => (
            <div
              key={task.title}
              className="grid grid-cols-[1fr_80px_56px_32px] gap-2 items-center px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              {/* Title */}
              <div className="flex items-center gap-2 min-w-0">
                {STATUS_ICON[task.status as keyof typeof STATUS_ICON]}
                <span
                  className={cn(
                    "text-xs truncate",
                    task.status === "DONE"
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  {task.title}
                </span>
              </div>

              {/* Status */}
              <div>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    task.status === "DONE" && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
                    task.status === "IN_PROGRESS" && "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
                    task.status === "IN_REVIEW" && "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
                    task.status === "TODO" && "bg-muted text-muted-foreground"
                  )}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    PRIORITY_DOT[task.priority]
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {task.priority}
                </span>
              </div>

              {/* Avatar */}
              <div
                className={cn(
                  "w-5 h-5 rounded-full text-[8px] font-semibold flex items-center justify-center",
                  AVATAR_COLORS[task.assignee]
                )}
              >
                {task.assignee}
              </div>
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div className="border-t border-border px-5 py-2 flex items-center gap-4 flex-shrink-0">
          {[
            { label: "Done", count: 1, color: "bg-green-500" },
            { label: "In progress", count: 2, color: "bg-blue-500" },
            { label: "In review", count: 1, color: "bg-amber-500" },
            { label: "Todo", count: 2, color: "bg-muted-foreground/40" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full", s.color)} />
              <span className="text-[10px] text-muted-foreground">
                {s.label} · {s.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
