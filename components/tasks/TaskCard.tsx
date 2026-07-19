import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { CalendarDays, CircleAlert, Clock3, ListTodo } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TaskCardTask = {
  id: string;
  title: string;
  description: string | null;
  priority?: string | null;
  status?: string | null;
  createdAt?: string | Date;
  dueDate?: string | Date | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  todo: "TODO",
  in_progress: "IN PROGRESS",
  in_review: "IN REVIEW",
  done: "DONE",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
};

const STATUS_OPTIONS = [
  { value: "todo", label: "TODO" },
  { value: "in_progress", label: "IN PROGRESS" },
  { value: "in_review", label: "IN REVIEW" },
  { value: "done", label: "DONE" },
];

export default function TaskCard({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isUpdating = false,
}: {
  task?: TaskCardTask | null;
  onStatusChange?: (status: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isUpdating?: boolean;
}) {
  if (!task) return null;

  const assignee = task.assignee ?? task.assignedTo ?? null;
  const assigneeName = assignee?.name ?? assignee?.email ?? "Unknown";
  const avatarLetter = assigneeName.charAt(0).toUpperCase();
  const assignedDate = task.createdAt ? new Date(task.createdAt) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    dueDate instanceof Date &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getTime() < Date.now() &&
    task.status !== "DONE";

  const formatDate = (value: Date | null) => {
    if (!value || Number.isNaN(value.getTime())) return "Not set";
    try {
      // Use a fixed locale/format to avoid server/client hydration mismatches
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(value);
    } catch {
      return value.toDateString();
    }
  };

  const priorityLabel = task.priority ?? "MEDIUM";
  const statusValue = (task.status ?? "todo").toLowerCase();
  const statusLabel = STATUS_LABELS[statusValue] ?? statusValue.toUpperCase();

  return (
    <Card className="group overflow-hidden border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold leading-tight">
                {task.title}
              </h3>
              {isOverdue ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                  <CircleAlert className="h-3 w-3" />
                  Overdue
                </span>
              ) : null}
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {task.description ?? "No description added yet."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="rounded-full capitalize">
              {priorityLabel.toLowerCase()}
            </Badge>

            <Select
              value={statusValue}
              onValueChange={(value) => onStatusChange?.(value)}
              disabled={!onStatusChange || isUpdating}
            >
              <SelectTrigger className="h-8 w-37.5 rounded-full border-border/70 bg-background px-3 text-xs font-medium">
                <SelectValue placeholder="Status">
                  <span className="flex items-center gap-2">
                    <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{statusLabel}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-muted/40 p-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 rounded-lg bg-background p-2 shadow-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Assigned on
              </p>
              <p className="text-sm font-medium">{formatDate(assignedDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 rounded-lg bg-background p-2 shadow-sm">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Due by
              </p>
              <p className="text-sm font-medium">{formatDate(dueDate)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-1">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-background">
              <AvatarFallback>{avatarLetter}</AvatarFallback>
            </Avatar>

            <div>
              <p className="text-sm font-medium">{assigneeName}</p>
              <p className="text-xs text-muted-foreground">Assignee</p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_BADGE_CLASSES[statusValue] ?? "bg-muted text-muted-foreground"}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onEdit}
            disabled={!onEdit}
          >
            Edit
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={onDelete}
            disabled={!onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}