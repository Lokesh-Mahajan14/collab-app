"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  FileText,
  Bell,
  Settings,
  Users,
  Zap,
  ChevronDown,
  Plus,
  Search,
  BarChart3,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/axios";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  // Projects are workspace-scoped and live under /workspace/[workspaceId]/projects
  { icon: FolderKanban, label: "Projects", href: "/workspace/[workspaceId]/projects" },
  { icon: CheckSquare, label: "My Tasks", href: "/workspace/[workspaceId]/tasks?mine=true" },
  { icon: MessageSquare, label: "Messages", href: "/workspace/[workspaceId]/chat" },
  { icon: FileText, label: "Files", href: "/dashboard/files" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
];

const BOTTOM_NAV = [
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: Users, label: "Members", href: "/dashboard/members" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

type WorkspaceOption = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  memberCount: number;
};

type SidebarProps = {
  workspaces: WorkspaceOption[];
  currentWorkspaceId?: string;
  userName: string;
  userEmail: string;
  openCreateByDefault?: boolean;
};

function workspacePath(pathname: string, workspaceId?: string) {
  if (!workspaceId) {
    return pathname;
  }

  return `${pathname}?workspace=${workspaceId}`;
}

export function Sidebar({
  workspaces,
  currentWorkspaceId,
  userName,
  userEmail,
  openCreateByDefault = false,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | undefined>(currentWorkspaceId);

  const currentWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId) ?? workspaces[0];

  useEffect(() => {
    if (openCreateByDefault) {
      setCreateOpen(true);
    }
  }, [openCreateByDefault]);

  const handleSwitchWorkspace = (workspaceId: string) => {
    setWorkspaceOpen(false);
    router.push(`/dashboard?workspace=${workspaceId}`);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.post("/workspaces", { name: workspaceName });
      const createdId = (response.data as { workspace: { id: string } }).workspace.id;

      setWorkspaceName("");
      setCreateOpen(false);
      setActiveWorkspaceId(createdId);
      toast.success("Workspace created");

      router.push(`/dashboard?workspace=${createdId}`);
      router.refresh();
      setInviteOpen(true);
    } catch (error) {
      toast.error("Unable to create workspace. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async () => {
    const workspaceId = activeWorkspaceId ?? currentWorkspaceId;

    if (!workspaceId) {
      toast.error("Create or select a workspace first");
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsInviting(true);

    try {
      const response = await api.post(`/workspaces/${workspaceId}/invites`, {
        email: inviteEmail,
      });
      const inviteData = response.data as {
        inviteLink?: string;
        emailDelivered?: boolean;
        emailWarning?: string;
      };
      const inviteLink = inviteData.inviteLink;

      let copied = false;
      if (inviteLink && typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(inviteLink);
          copied = true;
        } catch {
          copied = false;
        }
      }

      const successMessage = copied
        ? "Invitation sent. Invite link copied to clipboard."
        : "Invitation sent.";

      toast.success(inviteData.emailDelivered === false ? inviteData.emailWarning ?? successMessage : successMessage);
      setInviteEmail("");
      setInviteOpen(false);
    } catch (error) {
      toast.error("Unable to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full border-r border-border bg-muted/10">
      {/* Workspace switcher */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => setWorkspaceOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted transition-colors group"
        >
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 text-background fill-background" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">
              {currentWorkspace?.name ?? "No workspace"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {currentWorkspace ? `${currentWorkspace.memberCount} members` : "Create your first workspace"}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
              workspaceOpen && "rotate-180"
            )}
          />
        </button>

        {workspaceOpen && (
          <div className="mt-1 rounded-lg border border-border bg-card shadow-md p-1 z-50">
            <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
              Workspaces
            </div>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSwitchWorkspace(workspace.id)}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2",
                  workspace.id === currentWorkspaceId && "bg-muted"
                )}
              >
                <div className="w-4 h-4 rounded bg-foreground/10" />
                <span className="truncate">{workspace.name}</span>
              </button>
            ))}

            <button
              onClick={() => {
                setWorkspaceOpen(false);
                setCreateOpen(true);
              }}
              className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              New workspace
            </button>

            <button
              onClick={() => {
                setWorkspaceOpen(false);
                setActiveWorkspaceId(currentWorkspaceId);
                setInviteOpen(true);
              }}
              className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              Invite member
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left text-xs">Quick search…</span>
          <kbd className="text-[10px] border border-border rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </button>
      </div>

      <div className="h-px bg-border mx-3 mb-2" />

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          // If the item is workspace-scoped (contains [workspaceId]) replace it
          const rawHref = item.href.includes("[workspaceId]")
            ? item.href.replace("[workspaceId]", currentWorkspaceId ?? "")
            : workspacePath(item.href, currentWorkspaceId);

          const active = pathname === rawHref || pathname === item.href;

          return (
            <Link
              key={item.href}
              href={rawHref}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-border px-3 py-3 flex flex-col gap-0.5">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={workspacePath(item.href, currentWorkspaceId)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* User */}
        <div className="mt-2 pt-2 border-t border-border">
          <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted transition-colors group">
            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
            <DialogDescription>
              Set up a workspace for your team and invite members next.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace name
            </label>
            <Input
              id="workspace-name"
              placeholder="Product Team"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an email invite to join {currentWorkspace?.name ?? "your workspace"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              disabled={isInviting}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting}>
              {isInviting ? "Sending..." : "Send invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
