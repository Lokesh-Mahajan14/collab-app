"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { Plus } from "lucide-react";

import type {
  WorkspaceMember,
  TaskPriority,
} from "@/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormData = {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedToId: string;
  dueDate: string;
};

type MemberOption = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
};

type CreateTaskDialogProps = {
  workspaceId: string;
  canCreateTasks: boolean;
  members?: MemberOption[];
};

export default function CreateTaskDialog({
  workspaceId,
  canCreateTasks,
  members: initialMembers = [],
}: CreateTaskDialogProps) {
  const router = useRouter();

  if (!canCreateTasks) {
    return null;
  }

  const [formData, setFormData] =
    useState<FormData>({
      title: "",
      description: "",
      priority: "MEDIUM",
      assignedToId: "",
      dueDate: "",
    });

  const {
    data: members = initialMembers ?? [],
    isLoading: membersLoading,
  } = useQuery<MemberOption[]>({
    queryKey: ["workspace-members", workspaceId],
    enabled: !initialMembers.length && canCreateTasks && !!workspaceId,

    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);

      if (!response.ok) {
        throw new Error("Failed to fetch workspace members");
      }

      return response.json();
    },
  });

  // ─── Create Task Mutation ───────────────────────
  const {
    mutate: createTask,
    isPending,
  } = useMutation({
    mutationFn: async () => {
      if (!workspaceId) {
        throw new Error("Missing workspaceId");
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/tasks`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create task"
        );
      }

      return data;
    },

    onSuccess: () => {
      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        assignedToId: "",
        dueDate: "",
      });

      // Refresh server components
      router.refresh();
    },

    onError: (error) => {
      console.error(error);
    },
  });

  return (
    <Dialog>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </DialogTrigger>

      {/* Modal */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Assign a teammate, set a due date, and keep delivery clear.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task title</label>
            <Input
              placeholder="Launch checklist"
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add a concise definition of done and any context the assignee needs."
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    priority: value as TaskPriority,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dueDate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assign member</label>
            <Select
              value={formData.assignedToId}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  assignedToId: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={membersLoading ? "Loading members..." : "Choose a teammate"} />
              </SelectTrigger>

              <SelectContent>
                {members.map((member) => {
                  const displayName =
                    member.user.name ?? member.user.email;
                  const avatarLetter = displayName.charAt(0).toUpperCase();

                  return (
                    <SelectItem
                      key={member.user.id}
                      value={member.user.id}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                          {avatarLetter}
                        </div>
                        <div className="flex flex-col items-start">
                          <span>{displayName}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {member.user.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            disabled={
                  isPending || membersLoading || !formData.assignedToId
            }
            onClick={() => createTask()}
          >
            {isPending
              ? "Creating Task..."
              : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}