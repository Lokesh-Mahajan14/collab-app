"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Filter, RefreshCcw } from "lucide-react";

import TaskCard, { type TaskCardTask } from "@/components/tasks/TaskCard";
import TaskEditDialog from "@/components/tasks/TaskEditDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/Button";

type TaskBoardTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | Date | null;
  createdAt: string | Date;
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type WorkspaceMember = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type TaskBoardProps = {
  workspaceId: string;
  tasks: TaskBoardTask[];
  members: WorkspaceMember[];
};

const STATUS_OPTIONS = [
  { value: "todo", label: "TODO" },
  { value: "in_progress", label: "IN_PROGRESS" },
  { value: "in_review", label: "IN_REVIEW" },
  { value: "done", label: "DONE" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

const ASSIGNEE_OPTIONS = (members: WorkspaceMember[]) => [
  { value: "all", label: "All assignees" },
  { value: "unassigned", label: "Unassigned" },
  ...members.map((member) => ({
    value: member.user.id,
    label: member.user.name ?? member.user.email,
  })),
];

const DATE_FILTER_OPTIONS = [
  { value: "all", label: "Any date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Due this week" },
] as const;

function normalize(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

function isWithinNextSevenDays(value: Date) {
  const now = new Date();
  const upperBound = new Date(now);
  upperBound.setDate(now.getDate() + 7);

  return value >= new Date(now.setHours(0, 0, 0, 0)) && value <= upperBound;
}

export default function TaskBoard({
  workspaceId,
  tasks,
  members,
}: TaskBoardProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [editingTask, setEditingTask] = useState<TaskCardTask | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update task status");
      }

      return data;
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete task");
      }

      return data;
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  const summary = useMemo(() => {
    const now = new Date();
    const completed = tasks.filter((task) => normalize(task.status) === "done").length;
    const overdue = tasks.filter((task) => {
      const due = task.dueDate ? new Date(task.dueDate) : null;
      return Boolean(
        due && !Number.isNaN(due.getTime()) && due < now && normalize(task.status) !== "done"
      );
    }).length;
    const inProgress = tasks.filter((task) => normalize(task.status) === "in_progress").length;

    return {
      total: tasks.length,
      completed,
      overdue,
      inProgress,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskPriority = normalize(task.priority);
      const taskStatus = normalize(task.status);
      const assigneeId = task.assignedTo?.id ?? "unassigned";
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;

      const priorityMatch = priorityFilter === "all" || taskPriority === priorityFilter;
      const assigneeMatch = assigneeFilter === "all" || assigneeId === assigneeFilter;

      const dateMatch = (() => {
        if (dateFilter === "all") return true;
        if (!dueDate || Number.isNaN(dueDate.getTime())) return false;

        const today = new Date();

        if (dateFilter === "overdue") {
          return dueDate < today && taskStatus !== "done";
        }

        if (dateFilter === "today") {
          return isSameDay(dueDate, today);
        }

        if (dateFilter === "week") {
          return isWithinNextSevenDays(dueDate);
        }

        return true;
      })();

      return priorityMatch && assigneeMatch && dateMatch;
    });
  }, [tasks, priorityFilter, assigneeFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <TaskEditDialog
        key={`${editingTask?.id ?? "empty"}-${editingTask ? "open" : "closed"}`}
        workspaceId={workspaceId}
        task={editingTask}
        members={members}
        open={Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTask(null);
          }
        }}
        onSaved={() => window.location.reload()}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total tasks
          </p>
          <p className="mt-2 text-2xl font-semibold">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In progress
          </p>
          <p className="mt-2 text-2xl font-semibold">{summary.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Completed
          </p>
          <p className="mt-2 text-2xl font-semibold">{summary.completed}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overdue
          </p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{summary.overdue}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-muted/70 p-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Filters</h2>
              <p className="text-xs text-muted-foreground">
                Narrow the board by priority, assignee, and due date.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setPriorityFilter("all");
              setAssigneeFilter("all");
              setDateFilter("all");
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNEE_OPTIONS(members).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Due date" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isUpdating={updateStatusMutation.isPending}
              onStatusChange={(status) =>
                updateStatusMutation.mutate({ taskId: task.id, status })
              }
              onEdit={() => setEditingTask(task)}
              onDelete={() => {
                const confirmed = window.confirm(
                  `Delete task \"${task.title}\"? This cannot be undone.`
                );

                if (confirmed) {
                  deleteTaskMutation.mutate(task.id);
                }
              }}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            No tasks match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}