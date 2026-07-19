"use client";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import type { TaskCardTask } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

const STATUS_OPTIONS = [
  { value: "todo", label: "TODO" },
  { value: "in_progress", label: "IN_PROGRESS" },
  { value: "in_review", label: "IN_REVIEW" },
  { value: "done", label: "DONE" },
] as const;

type MemberOption = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type TaskEditDialogProps = {
  workspaceId: string;
  task: TaskCardTask | null;
  members: MemberOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (task: TaskCardTask) => void;
};

type FormState = {
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedToId: string;
  dueDate: string;
};

function formatDateValue(value: string | Date | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function createInitialFormState(task: TaskCardTask | null): FormState {
  if (!task) {
    return {
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      assignedToId: "",
      dueDate: "",
    };
  }

  return {
    title: task.title,
    description: task.description ?? "",
    priority: (task.priority ?? "medium").toLowerCase(),
    status: (task.status ?? "todo").toLowerCase(),
    assignedToId: task.assignedTo?.id ?? "",
    dueDate: formatDateValue(task.dueDate),
  };
}

export default function TaskEditDialog({
  workspaceId,
  task,
  members,
  open,
  onOpenChange,
  onSaved,
}: TaskEditDialogProps) {
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState(task));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id) {
        throw new Error("Missing task");
      }

      const response = await fetch(
        `/api/workspaces/${workspaceId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: formState.title,
            description: formState.description,
            priority: formState.priority,
            status: formState.status,
            assignedToId: formState.assignedToId || null,
            dueDate: formState.dueDate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update task");
      }

      return data;
    },
    onSuccess: (data) => {
      onOpenChange(false);
      onSaved?.(data as TaskCardTask);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task title, assignee, status, and deadlines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task title</label>
            <Input
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={formState.priority}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    priority: value,
                  }))
                }
              >
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    status: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Due date</label>
              <Input
                type="date"
                value={formState.dueDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assign member</label>
              <Select
                value={formState.assignedToId}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    assignedToId: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a teammate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {members.map((member) => {
                    const displayName =
                      member.user.name ?? member.user.email;

                    return (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formState.title.trim()}>
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
