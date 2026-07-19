"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ComponentType } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  Filter,
  FolderKanban,
  LayoutGrid,
  Search,
  Send,
  Sparkles,
  StickyNote,
  Table2,
  Target,
  TimerReset,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MyTask, MyTaskNote } from "@/lib/my-tasks";
import { getMyTaskAnalytics, getProductivityStreak, getTaskCompletionRatio } from "@/lib/my-tasks";
import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import TaskEditDialog from "@/components/tasks/TaskEditDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const VIEW_MODES = [
  { value: "table", label: "Table View", icon: Table2 },
  { value: "kanban", label: "Kanban View", icon: LayoutGrid },
] as const;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Completed" },
  { value: "overdue", label: "Overdue" },
] as const;

const STATUS_META: Record<string, { label: string; className: string }> = {
  todo: { label: "TODO", className: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300" },
  in_progress: { label: "IN_PROGRESS", className: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300" },
  in_review: { label: "IN_REVIEW", className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300" },
  done: { label: "COMPLETED", className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" },
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  low: { label: "LOW", className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" },
  medium: { label: "MEDIUM", className: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300" },
  high: { label: "HIGH", className: "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300" },
  urgent: { label: "URGENT", className: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300" },
};

const CANBAN_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;

type ViewMode = (typeof VIEW_MODES)[number]["value"];

type SortMode = "dueDate" | "updatedAt";

type Props = {
  workspaceId: string;
  workspaceName: string;
  canCreateTasks: boolean;
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      image?: string | null;
    };
  }>;
  tasks: MyTask[];
};

function normalizeStatus(status: string) {
  const lower = status.toLowerCase();
  return lower === "completed" ? "done" : lower;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return format(date, "MMM d, yyyy");
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, h:mm a");
}

function toIsoString(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getProgress(status: string) {
  switch (normalizeStatus(status)) {
    case "todo":
      return 0;
    case "in_progress":
      return 40;
    case "in_review":
      return 75;
    case "done":
      return 100;
    default:
      return 0;
  }
}

function getDeadlineLabel(dueDate: string | null) {
  if (!dueDate) return "No due date";
  const diff = differenceInDays(new Date(dueDate), new Date());
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

function isTaskOverdue(task: MyTask) {
  if (!task.dueDate) return false;
  const dueDate = new Date(task.dueDate);
  return isBefore(dueDate, new Date()) && normalizeStatus(task.status) !== "done";
}

function getTaskText(task: MyTask) {
  return [task.title, task.description ?? "", task.workspaceName, task.latestNote?.content ?? ""]
    .join(" ")
    .toLowerCase();
}

function normalizeTaskCollection(tasks: MyTask[]) {
  return tasks.map((task) => ({
    ...task,
    status: normalizeStatus(task.status),
    priority: task.priority.toLowerCase(),
  }));
}

function TaskMetricCard({
  title,
  count,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  count: number;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
              <p className="text-3xl font-semibold tracking-tight">{count}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className={cn("rounded-2xl p-3 ring-1", tone)}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function useTaskDraggable(task: MyTask) {
  return useDraggable({ id: task.id, data: { taskId: task.id, status: task.status } });
}

function KanbanCard({
  task,
  onOpen,
  onMarkComplete,
  onEdit,
  onNotes,
}: {
  task: MyTask;
  onOpen: () => void;
  onMarkComplete: () => void;
  onEdit: () => void;
  onNotes: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useTaskDraggable(task);
  const overdue = isTaskOverdue(task);
  const latestNote = task.latestNote?.content?.trim();

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("touch-none", isDragging && "opacity-60")}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <Card className={cn("border-border/60 bg-card/90 shadow-sm", overdue && "border-rose-500/40 bg-rose-500/5") }>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="line-clamp-2 text-sm font-semibold">{task.title}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{task.description ?? "No description"}</p>
            </div>
            <Badge className={cn("shrink-0 rounded-full ring-1", STATUS_META[task.status]?.className ?? STATUS_META.todo.className)}>
              {STATUS_META[task.status]?.label ?? task.status.toUpperCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("rounded-full ring-1", PRIORITY_META[task.priority]?.className ?? PRIORITY_META.medium.className)}>
              {PRIORITY_META[task.priority]?.label ?? task.priority.toUpperCase()}
            </Badge>
            {overdue ? (
              <Badge variant="destructive" className="rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300">
                Overdue
              </Badge>
            ) : null}
          </div>

          <div className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{getDeadlineLabel(task.dueDate)}</p>
            <p className="mt-1">{task.workspaceName}</p>
          </div>

          {latestNote ? (
            <div className="rounded-2xl border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium uppercase tracking-wide text-[11px] text-foreground">Latest note</p>
              <p className="line-clamp-2">{latestNote}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={onOpen}>
              <Eye className="h-3.5 w-3.5" />
              Open
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={onNotes}>
              <StickyNote className="h-3.5 w-3.5" />
              Notes
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={onEdit}>
              <Sparkles className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="default" size="sm" className="justify-start gap-2" onClick={onMarkComplete}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KanbanColumn({
  title,
  status,
  tasks,
  onTaskOpen,
  onTaskComplete,
  onTaskEdit,
  onTaskNotes,
}: {
  title: string;
  status: string;
  tasks: MyTask[];
  onTaskOpen: (task: MyTask) => void;
  onTaskComplete: (task: MyTask) => void;
  onTaskEdit: (task: MyTask) => void;
  onTaskNotes: (task: MyTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={cn("flex min-h-88 w-[18rem] shrink-0 flex-col rounded-3xl border border-border/60 bg-muted/20 p-3", isOver && "border-primary/40 bg-primary/5")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{tasks.length} task{tasks.length === 1 ? "" : "s"}</p>
        </div>
        <Badge variant="outline" className="rounded-full">{tasks.length}</Badge>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onOpen={() => onTaskOpen(task)}
            onMarkComplete={() => onTaskComplete(task)}
            onEdit={() => onTaskEdit(task)}
            onNotes={() => onTaskNotes(task)}
          />
        ))}
      </div>
    </div>
  );
}

function CalendarPanel({
  month,
  tasks,
  selectedDate,
  onDateSelect,
}: {
  month: Date;
  tasks: MyTask[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const countsByDate = useMemo(() => {
    const map = new Map<string, { total: number; overdue: number; completed: number }>();

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const date = format(new Date(task.dueDate), "yyyy-MM-dd");
      const current = map.get(date) ?? { total: 0, overdue: 0, completed: 0 };
      current.total += 1;
      if (normalizeStatus(task.status) === "done") current.completed += 1;
      if (isTaskOverdue(task)) current.overdue += 1;
      map.set(date, current);
    });

    return map;
  }, [tasks]);

  const monthTasks = tasks.filter((task) => task.dueDate && isSameMonth(new Date(task.dueDate), month));
  const overdueDates = monthTasks.filter(isTaskOverdue).length;
  const completionPercent = getTaskCompletionRatio(tasks);
  const streak = getProductivityStreak(tasks);

  const today = new Date();

  return (
    <Card className="border-border/60 bg-card/85 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
      <CardHeader className="space-y-2 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Calendar</CardTitle>
            <CardDescription>Monthly view with task density and deadlines.</CardDescription>
          </div>
          <div className="rounded-2xl bg-muted/60 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Streak</p>
            <p className="text-lg font-semibold">{streak} days</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300">
            <p className="uppercase tracking-wide text-[10px]">Completion</p>
            <p className="mt-1 text-base font-semibold">{completionPercent}%</p>
          </div>
          <div className="rounded-2xl bg-rose-500/10 p-2 text-rose-700 dark:text-rose-300">
            <p className="uppercase tracking-wide text-[10px]">Overdue days</p>
            <p className="mt-1 text-base font-semibold">{overdueDates}</p>
          </div>
          <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-700 dark:text-sky-300">
            <p className="uppercase tracking-wide text-[10px]">This month</p>
            <p className="mt-1 text-base font-semibold">{monthTasks.length}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{format(month, "MMMM yyyy")}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onDateSelect(today)} title="Jump to today">
              <TimerReset className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayData = countsByDate.get(key);
            const hasTasks = Boolean(dayData?.total);
            const selected = selectedDate ? isSameDay(day, selectedDate) : false;
            const overdue = Boolean(dayData?.overdue);
            const completed = Boolean(dayData?.completed && !dayData?.overdue);

            return (
              <button
                key={key}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "relative min-h-16 rounded-2xl border border-border/50 p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                  !isSameMonth(day, month) && "opacity-30",
                  selected && "border-primary bg-primary/5 shadow-sm",
                  overdue && "border-rose-500/40 bg-rose-500/10",
                  completed && !overdue && "border-emerald-500/30 bg-emerald-500/10",
                  hasTasks && !selected && !overdue && !completed && "bg-muted/40"
                )}
              >
                <span className="text-xs font-medium">{format(day, "d")}</span>
                {hasTasks ? (
                  <span className="absolute bottom-2 right-2 inline-flex min-w-5 items-center justify-center rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-border">
                    {dayData?.total}
                  </span>
                ) : null}
                {overdue ? <span className="absolute left-2 bottom-2 h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
                {completed && !overdue ? <span className="absolute left-2 bottom-2 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyTasksDashboard({ workspaceId, workspaceName, canCreateTasks, members, tasks }: Props) {
  const [localTasks, setLocalTasks] = useState<MyTask[]>(() => normalizeTaskCollection(tasks));
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("dueDate");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(localTasks[0]?.id ?? null);
  const [editingTask, setEditingTask] = useState<MyTask | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedTask = useMemo(
    () => localTasks.find((task) => task.id === selectedTaskId) ?? null,
    [localTasks, selectedTaskId]
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update task status");
      return data as { id: string; status: string; updatedAt: string };
    },
    onSuccess: (data, variables) => {
      setLocalTasks((current) =>
        current.map((task) =>
          task.id === variables.taskId
            ? { ...task, status: normalizeStatus(data.status), updatedAt: data.updatedAt }
            : task
        )
      );
    },
  });

  const noteMutation = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save note");
      return data as MyTaskNote;
    },
    onSuccess: (data, variables) => {
      setLocalTasks((current) =>
        current.map((task) =>
          task.id === variables.taskId
            ? { ...task, latestNote: data }
            : task
        )
      );
      setNoteDraft("");
    },
  });

  const analytics = useMemo(() => getMyTaskAnalytics(localTasks), [localTasks]);
  const streak = useMemo(() => getProductivityStreak(localTasks), [localTasks]);
  const completionPercent = useMemo(() => getTaskCompletionRatio(localTasks), [localTasks]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();

    return localTasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        const diff = differenceInDays(dueDate, now);
        return diff <= 5 && diff >= -5;
      })
      .sort((left, right) => {
        const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
        return leftDue - rightDue;
      });
  }, [localTasks]);

  const projectOptions = useMemo(() => {
    const values = new Set(localTasks.map((task) => task.workspaceName));
    return ["all", ...values];
  }, [localTasks]);

  const filteredTasks = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    let result = localTasks.filter((task) => {
      const taskStatus = normalizeStatus(task.status);
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isOverdue = Boolean(dueDate && isBefore(dueDate, new Date()) && taskStatus !== "done");
      const projectMatch = projectFilter === "all" || task.workspaceName === projectFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "overdue" ? isOverdue : taskStatus === statusFilter);
      const searchMatch =
        !search ||
        getTaskText(task).includes(search);
      const dateMatch =
        !selectedDate ||
        (task.dueDate ? isSameDay(new Date(task.dueDate), selectedDate) : false);

      return projectMatch && priorityMatch && statusMatch && searchMatch && dateMatch;
    });

    result = result.sort((left, right) => {
      if (sortMode === "updatedAt") {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      }

      const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return leftDue - rightDue;
    });

    return result;
  }, [localTasks, priorityFilter, projectFilter, searchTerm, selectedDate, sortMode, statusFilter]);

  const groupedTasks = useMemo(
    () =>
      CANBAN_STATUSES.reduce<Record<string, MyTask[]>>((accumulator, status) => {
        accumulator[status] = filteredTasks.filter((task) => normalizeStatus(task.status) === status);
        return accumulator;
      }, { todo: [], in_progress: [], in_review: [], done: [] }),
    [filteredTasks]
  );

  const visibleTaskCount = filteredTasks.length;
  const selectedTaskNote = selectedTask?.latestNote?.content ?? "No personal note yet.";
  const currentDateLabel = format(new Date(), "EEEE, MMMM d");

  const taskMembers = members;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleStatusChange = (taskId: string, status: string) => {
    updateStatusMutation.mutate({ taskId, status });
  };

  const handleNoteSave = () => {
    if (!selectedTask || !noteDraft.trim()) return;
    noteMutation.mutate({ taskId: selectedTask.id, content: noteDraft });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    if (!overId || activeId === overId) return;

    const sourceTask = localTasks.find((task) => task.id === activeId);
    if (!sourceTask) return;

    const nextStatus = CANBAN_STATUSES.includes(overId as (typeof CANBAN_STATUSES)[number]) ? overId : sourceTask.status;

    if (nextStatus !== sourceTask.status) {
      handleStatusChange(sourceTask.id, nextStatus);
    }
  };

  if (localTasks.length === 0) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">My tasks</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My Tasks</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">Track your assigned work and deadlines efficiently.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Current date</p>
              <p className="text-sm font-semibold">{currentDateLabel}</p>
            </div>
          </div>
        </motion.section>

        <Card className="border-dashed border-border/60 bg-card/70 p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold">No tasks assigned yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Once tasks are assigned to you, they will appear here with deadlines, progress, notes, and calendar markers.
          </p>
          {canCreateTasks ? (
            <div className="mt-6 flex justify-center">
              <CreateTaskDialog workspaceId={workspaceId} canCreateTasks={canCreateTasks} members={taskMembers} />
            </div>
          ) : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <TaskEditDialog
        key={`${editingTask?.id ?? "empty"}-${editingTask ? "open" : "closed"}`}
        workspaceId={workspaceId}
        task={editingTask}
        members={taskMembers}
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null);
        }}
        onSaved={(updatedTask) => {
          setLocalTasks((current) =>
            current.map((task) =>
              task.id === updatedTask.id
                ? {
                    ...task,
                    title: updatedTask.title,
                    description: updatedTask.description,
                    status: normalizeStatus(updatedTask.status ?? task.status),
                    priority: updatedTask.priority ?? task.priority,
                    dueDate: toIsoString(updatedTask.dueDate) ?? task.dueDate,
                    assignedTo: updatedTask.assignedTo
                      ? {
                          id: task.assignedTo?.id ?? "",
                          name: updatedTask.assignedTo.name ?? null,
                          email: updatedTask.assignedTo.email,
                        }
                      : task.assignedTo,
                    updatedAt: new Date().toISOString(),
                  }
                : task
            )
          );
        }}
      />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-3xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-5 shadow-sm"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">My tasks</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My Tasks</h1>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">Assigned only</Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Track your assigned work and deadlines efficiently.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">{currentDateLabel}</span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">{analytics.total} tasks</span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">{completionPercent}% complete</span>
              <span className="rounded-full border border-border/60 bg-background/70 px-3 py-1">{streak}-day streak</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Workspace</p>
              <p className="text-sm font-semibold">{workspaceName}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Visible tasks</p>
              <p className="text-sm font-semibold">{visibleTaskCount}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">Due this week</p>
              <p className="text-sm font-semibold">{analytics.dueThisWeek}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canCreateTasks ? <CreateTaskDialog workspaceId={workspaceId} canCreateTasks={canCreateTasks} members={taskMembers} /> : null}
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/workspace/${workspaceId}/projects`}>
              <FolderKanban className="h-4 w-4" />
              View project board
            </Link>
          </Button>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TaskMetricCard title="Total tasks" count={analytics.total} description="Assigned in this workspace" icon={Target} tone="bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300" />
        <TaskMetricCard title="In progress" count={analytics.inProgress} description="Currently moving" icon={Activity} tone="bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300" />
        <TaskMetricCard title="Completed" count={analytics.completed} description="Done and closed" icon={CheckCircle2} tone="bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" />
        <TaskMetricCard title="Overdue" count={analytics.overdue} description="Needs attention" icon={CircleAlert} tone="bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300" />
        <TaskMetricCard title="Due this week" count={analytics.dueThisWeek} description="Next five to seven days" icon={TrendingUp} tone="bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300" />
      </section>

      <section className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Upcoming deadlines</p>
            <p className="text-sm text-muted-foreground">Tasks due within the next five days, including urgent overdue items.</p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">{upcomingDeadlines.length} highlighted</Badge>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-1">
          {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((task) => {
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const diff = dueDate ? differenceInDays(dueDate, new Date()) : 0;
            const overdue = diff < 0;
            const urgent = diff >= 0 && diff <= 1;
            const safe = diff > 1;

            return (
              <motion.div key={task.id} whileHover={{ y: -3 }} className="min-w-[18rem] max-w-[18rem] shrink-0">
                <Card className={cn("h-full border-border/60 bg-background/80 shadow-sm", overdue && "border-rose-500/40 bg-rose-500/5", urgent && !overdue && "border-amber-500/40 bg-amber-500/5", safe && "border-emerald-500/30 bg-emerald-500/5")}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold line-clamp-2">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.workspaceName}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {PRIORITY_META[task.priority]?.label ?? task.priority.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatShortDate(task.dueDate)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={overdue ? "destructive" : urgent ? "outline" : "secondary"} className="rounded-full">
                        {getDeadlineLabel(task.dueDate)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{Math.abs(diff)} day{Math.abs(diff) === 1 ? "" : "s"} {overdue ? "late" : "left"}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8 text-sm text-muted-foreground">
              No upcoming deadlines in this workspace.
            </div>
          )}
        </div>
      </section>

      <section className="sticky top-3 z-10 space-y-4 rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/75">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-muted/70 p-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Filters</h2>
              <p className="text-xs text-muted-foreground">Search, sort, and narrow your assigned work.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 p-1">
            {VIEW_MODES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setViewMode(value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                  viewMode === value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks, notes, or projects"
                className="h-11 pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All projects" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {(["all", "low", "medium", "high", "urgent"] as const).map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All priorities" : option.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Sort by due date</SelectItem>
              <SelectItem value="updatedAt">Sort by recently updated</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-11 gap-2"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setProjectFilter("all");
              setPriorityFilter("all");
              setSortMode("dueDate");
              setSelectedDate(null);
            }}
          >
            <ArrowUpDown className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {selectedDate ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p>Filtering tasks for <span className="font-semibold">{format(selectedDate, "MMM d, yyyy")}</span></p>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>Clear day filter</Button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          {viewMode === "table" ? (
            <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Task table</CardTitle>
                    <CardDescription>Linear-style rows with status, priority, notes, and actions.</CardDescription>
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1">{filteredTasks.length} visible</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Task Title</th>
                        <th className="px-4 py-3 text-left font-medium">Project</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Priority</th>
                        <th className="px-4 py-3 text-left font-medium">Due Date</th>
                        <th className="px-4 py-3 text-left font-medium">Notes</th>
                        <th className="px-4 py-3 text-left font-medium">Progress</th>
                        <th className="px-4 py-3 text-left font-medium">Assigned By</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => {
                        const overdue = isTaskOverdue(task);
                        const progress = getProgress(task.status);
                        return (
                          <tr key={task.id} className={cn("border-b border-border/50 transition-colors hover:bg-muted/30", overdue && "bg-rose-500/5") }>
                            <td className="px-4 py-4 align-top">
                              <div className="space-y-1">
                                <p className="font-semibold">{task.title}</p>
                                <p className="line-clamp-2 text-xs text-muted-foreground">{task.description ?? "No description"}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-muted-foreground">{task.workspaceName}</td>
                            <td className="px-4 py-4 align-top">
                              <Badge className={cn("rounded-full ring-1", STATUS_META[task.status]?.className ?? STATUS_META.todo.className)}>
                                {STATUS_META[task.status]?.label ?? task.status.toUpperCase()}
                              </Badge>
                              {overdue ? (
                                <p className="mt-1 text-[11px] font-medium text-rose-600">Overdue</p>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <Badge variant="outline" className={cn("rounded-full ring-1", PRIORITY_META[task.priority]?.className ?? PRIORITY_META.medium.className)}>
                                {PRIORITY_META[task.priority]?.label ?? task.priority.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 align-top text-sm">{formatDate(task.dueDate)}</td>
                            <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                              <div className="max-w-[18rem] space-y-1">
                                <p className="line-clamp-2">{task.latestNote?.content ?? "No personal note yet."}</p>
                                <button className="text-left text-xs font-medium text-primary hover:underline" onClick={() => { setSelectedTaskId(task.id); setNoteDraft(task.latestNote?.content ?? ""); noteInputRef.current?.focus(); }}>
                                  Quick add note
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="w-32">
                                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{progress}%</span>
                                  <span>{progress >= 100 ? "Done" : progress >= 75 ? "Review" : progress >= 40 ? "Active" : "Todo"}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted">
                                  <div className="h-2 rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-emerald-500" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-sm text-muted-foreground">{task.createdBy.name ?? task.createdBy.email}</td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" className="h-8" onClick={() => setSelectedTaskId(task.id)}>
                                  Open Details
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => handleStatusChange(task.id, "done")} disabled={updateStatusMutation.isPending}>
                                  Mark Complete
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => { setSelectedTaskId(task.id); setNoteDraft(task.latestNote?.content ?? ""); noteInputRef.current?.focus(); }}>
                                  Add Notes
                                </Button>
                                <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingTask(task)}>
                                  Edit Task
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" asChild>
                                  <Link href={`/workspace/${workspaceId}/projects`}>
                                    View Project
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
              <div className="flex gap-4 overflow-x-auto pb-2">
                <KanbanColumn
                  title="Todo"
                  status="todo"
                  tasks={groupedTasks.todo}
                  onTaskOpen={(task) => setSelectedTaskId(task.id)}
                  onTaskComplete={(task) => handleStatusChange(task.id, "done")}
                  onTaskEdit={(task) => setEditingTask(task)}
                  onTaskNotes={(task) => {
                    setSelectedTaskId(task.id);
                    setNoteDraft(task.latestNote?.content ?? "");
                    noteInputRef.current?.focus();
                  }}
                />
                <KanbanColumn
                  title="In Progress"
                  status="in_progress"
                  tasks={groupedTasks.in_progress}
                  onTaskOpen={(task) => setSelectedTaskId(task.id)}
                  onTaskComplete={(task) => handleStatusChange(task.id, "done")}
                  onTaskEdit={(task) => setEditingTask(task)}
                  onTaskNotes={(task) => {
                    setSelectedTaskId(task.id);
                    setNoteDraft(task.latestNote?.content ?? "");
                    noteInputRef.current?.focus();
                  }}
                />
                <KanbanColumn
                  title="Review"
                  status="in_review"
                  tasks={groupedTasks.in_review}
                  onTaskOpen={(task) => setSelectedTaskId(task.id)}
                  onTaskComplete={(task) => handleStatusChange(task.id, "done")}
                  onTaskEdit={(task) => setEditingTask(task)}
                  onTaskNotes={(task) => {
                    setSelectedTaskId(task.id);
                    setNoteDraft(task.latestNote?.content ?? "");
                    noteInputRef.current?.focus();
                  }}
                />
                <KanbanColumn
                  title="Completed"
                  status="done"
                  tasks={groupedTasks.done}
                  onTaskOpen={(task) => setSelectedTaskId(task.id)}
                  onTaskComplete={(task) => handleStatusChange(task.id, "done")}
                  onTaskEdit={(task) => setEditingTask(task)}
                  onTaskNotes={(task) => {
                    setSelectedTaskId(task.id);
                    setNoteDraft(task.latestNote?.content ?? "");
                    noteInputRef.current?.focus();
                  }}
                />
              </div>
            </DndContext>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card className="border-border/60 bg-card/85 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Task details</CardTitle>
              <CardDescription>Selected task, personal notes, and quick actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {selectedTask ? (
                <>
                  <div className="space-y-3 rounded-3xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold leading-tight">{selectedTask.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedTask.description ?? "No description yet."}</p>
                      </div>
                      <Badge className={cn("rounded-full ring-1", STATUS_META[selectedTask.status]?.className ?? STATUS_META.todo.className)}>
                        {STATUS_META[selectedTask.status]?.label ?? selectedTask.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="rounded-2xl bg-background/80 p-3 ring-1 ring-border/60">
                        <p className="text-[11px] uppercase tracking-wide">Project</p>
                        <p className="mt-1 font-medium text-foreground">{selectedTask.workspaceName}</p>
                      </div>
                      <div className="rounded-2xl bg-background/80 p-3 ring-1 ring-border/60">
                        <p className="text-[11px] uppercase tracking-wide">Due</p>
                        <p className="mt-1 font-medium text-foreground">{formatDate(selectedTask.dueDate)}</p>
                      </div>
                      <div className="rounded-2xl bg-background/80 p-3 ring-1 ring-border/60">
                        <p className="text-[11px] uppercase tracking-wide">Assigned by</p>
                        <p className="mt-1 font-medium text-foreground">{selectedTask.createdBy.name ?? selectedTask.createdBy.email}</p>
                      </div>
                      <div className="rounded-2xl bg-background/80 p-3 ring-1 ring-border/60">
                        <p className="text-[11px] uppercase tracking-wide">Progress</p>
                        <p className="mt-1 font-medium text-foreground">{getProgress(selectedTask.status)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Personal note</p>
                      <button className="text-xs font-medium text-primary hover:underline" onClick={() => { setNoteDraft(selectedTask.latestNote?.content ?? ""); noteInputRef.current?.focus(); }}>
                        {selectedTask.latestNote ? "Update note" : "Add note"}
                      </button>
                    </div>
                    <Textarea
                      ref={noteInputRef}
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Add a quick private note about this task..."
                      className="min-h-28"
                    />
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{selectedTaskNote}</span>
                      <span>{formatDateTime(selectedTask.latestNote?.updatedAt ?? selectedTask.updatedAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button className="gap-2" onClick={handleNoteSave} disabled={noteMutation.isPending || !noteDraft.trim()}>
                        <Send className="h-4 w-4" />
                        {noteMutation.isPending ? "Saving..." : "Save note"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingTask(selectedTask)}>
                        Edit Task
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Button variant="outline" className="justify-start gap-2" onClick={() => handleStatusChange(selectedTask.id, "todo")}>Set Todo</Button>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => handleStatusChange(selectedTask.id, "in_progress")}>Set In Progress</Button>
                    <Button variant="outline" className="justify-start gap-2" onClick={() => handleStatusChange(selectedTask.id, "in_review")}>Set Review</Button>
                    <Button variant="default" className="justify-start gap-2" onClick={() => handleStatusChange(selectedTask.id, "done")}>Mark Complete</Button>
                  </div>
                </>
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                  Select a task to inspect its details, notes, and quick actions.
                </div>
              )}
            </CardContent>
          </Card>

          <CalendarPanel
            month={selectedTask?.dueDate ? new Date(selectedTask.dueDate) : new Date()}
            tasks={filteredTasks}
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />

          <Card className="border-border/60 bg-card/85 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/70">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-base">Weekly snapshot</CardTitle>
              <CardDescription>Small signals for momentum and focus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="rounded-2xl bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Completion</span>
                  <span className="font-semibold">{completionPercent}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-linear-to-r from-sky-500 via-cyan-500 to-emerald-500" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming focus</p>
                <p className="mt-1 font-medium">{upcomingDeadlines[0]?.title ?? "No near-term deadlines"}</p>
                <p className="text-xs text-muted-foreground">{upcomingDeadlines[0] ? getDeadlineLabel(upcomingDeadlines[0].dueDate) : "Your schedule is clear for now."}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
