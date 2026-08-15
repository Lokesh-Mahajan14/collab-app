"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";

import { api } from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateWorkspaceDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: (createdWorkspaceId: string) => void;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  trigger,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSaving) {
      if (!nextOpen) {
        setWorkspaceName("");
      }
      if (isControlled) {
        onOpenChange?.(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }
    }
  };

  const handleCreateWorkspace = async () => {
    const trimmedName = workspaceName.trim();
    if (!trimmedName) {
      toast.error("Workspace name is required");
      return;
    }

    if (trimmedName.length < 2) {
      toast.error("Workspace name must be at least 2 characters");
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.post("/workspaces", { name: trimmedName });
      const createdId = (response.data as { workspace: { id: string } }).workspace.id;

      setWorkspaceName("");
      handleOpenChange(false);
      toast.success("Workspace created successfully");

      if (onSuccess) {
        onSuccess(createdId);
      } else {
        router.push(`/dashboard?workspace=${createdId}`);
        router.refresh();
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Unable to create workspace. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" />
            </span>
            <DialogTitle>Create Workspace</DialogTitle>
          </div>
          <DialogDescription>
            Set up a dedicated workspace for your team, manage projects, and invite teammates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label htmlFor="create-workspace-name-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace Name
          </label>
          <Input
            id="create-workspace-name-input"
            placeholder="e.g. Engineering Team or Marketing Launch"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            disabled={isSaving}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateWorkspace();
              }
            }}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateWorkspace}
            disabled={isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              "Creating..."
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Create Workspace
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
