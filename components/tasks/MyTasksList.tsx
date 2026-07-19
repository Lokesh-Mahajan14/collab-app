"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import TaskCard from "@/components/tasks/TaskCard";
import TaskEditDialog from "@/components/tasks/TaskEditDialog";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | Date | null;
  createdAt: string | Date;
  workspaceId: string;
  workspace: { id: string; name: string } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
};

export default function MyTasksList({ tasks }: { tasks: Task[] }) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, workspaceId, status }: { taskId: string; workspaceId: string; status: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      return data;
    },
    onSuccess: () => window.location.reload(),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ taskId, workspaceId }: { taskId: string; workspaceId: string }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      return data;
    },
    onSuccess: () => window.location.reload(),
  });

  return (
    <div className="space-y-6">
      <TaskEditDialog
        key={`${editingTask?.id ?? "empty"}-${editingTask ? "open" : "closed"}`}
        workspaceId={editingTask?.workspaceId ?? ""}
        task={editingTask}
        members={[]}
        open={Boolean(editingTask)}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
        onSaved={() => window.location.reload()}
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={{
                id: task.id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                createdAt: task.createdAt,
                dueDate: task.dueDate,
                assignedTo: task.assignedTo,
                assignee: task.assignedTo,
              }}
              isUpdating={updateStatusMutation.isPending}
              onStatusChange={(status) => updateStatusMutation.mutate({ taskId: task.id, workspaceId: task.workspaceId, status })}
              onEdit={() => setEditingTask(task)}
              onDelete={() => {
                const confirmed = window.confirm(`Delete task "${task.title}"? This cannot be undone.`);
                if (confirmed) deleteMutation.mutate({ taskId: task.id, workspaceId: task.workspaceId });
              }}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            You have no tasks assigned.
          </div>
        )}
      </div>
    </div>
  );
}
