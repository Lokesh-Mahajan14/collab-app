"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
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
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
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
import { CreateWorkspaceDialog } from "@/components/workspace/CreateWorkspaceDialog";
import { api } from "@/lib/axios";
import { socket } from "@/lib/socket-client";
import type { WorkspaceSidebarItem } from "@/lib/workspace";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: FolderKanban, label: "Projects", href: "/workspace/[workspaceId]/projects" },
  { icon: CheckSquare, label: "My Tasks", href: "/workspace/[workspaceId]/tasks?mine=true" },
  { icon: MessageSquare, label: "Messages", href: "/workspace/[workspaceId]/chat" },
  { icon: FileText, label: "Files", href: "/workspace/[workspaceId]/files" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
];

const BOTTOM_NAV = [
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: Users, label: "Members", href: "/dashboard/members" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

type SidebarProps = {
  workspaces: WorkspaceSidebarItem[];
  currentWorkspaceId?: string;
  userName: string;
  userEmail: string;
  openCreateByDefault?: boolean;
};

export function Sidebar({
  workspaces,
  currentWorkspaceId,
  userName,
  userEmail,
  openCreateByDefault = false,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine effective active workspace ID
  const effectiveWorkspaceId = useMemo(() => {
    if (currentWorkspaceId && workspaces.some((w) => w.id === currentWorkspaceId)) {
      return currentWorkspaceId;
    }

    const queryWorkspace = searchParams.get("workspace");
    if (queryWorkspace && workspaces.some((w) => w.id === queryWorkspace)) {
      return queryWorkspace;
    }

    const pathParts = pathname.split("/");
    if (pathParts[1] === "workspace" && pathParts[2]) {
      const match = workspaces.find((w) => w.id === pathParts[2]);
      if (match) return match.id;
    }

    return workspaces[0]?.id;
  }, [currentWorkspaceId, workspaces, searchParams, pathname]);

  const currentWorkspace =
    workspaces.find((w) => w.id === effectiveWorkspaceId) ?? workspaces[0];

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(openCreateByDefault);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [sidebarClose, setSidebarClose] = useState(false);
  const [activeWorkspaceIdState, setActiveWorkspaceIdState] = useState<string | undefined>(effectiveWorkspaceId);
  const [unreadCount, setUnreadCount] = useState(currentWorkspace?.unreadMessageCount ?? 0);

  // Sync unread count whenever current workspace changes
  useEffect(() => {
    setUnreadCount(currentWorkspace?.unreadMessageCount ?? 0);
  }, [currentWorkspace?.unreadMessageCount, effectiveWorkspaceId]);

  // Real-time socket listener for incoming messages & read updates to update sidebar badge
  useEffect(() => {
    function joinRooms() {
      if (effectiveWorkspaceId) {
        socket.emit("join_workspace", effectiveWorkspaceId);
      }
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRooms();
    }

    socket.on("connect", joinRooms);

    function handleReceiveMessage(message: any) {
      const activeConversationId = pathname.split("/chat/")[1]?.split("/")[0];
      if (activeConversationId !== message.conversationId) {
        setUnreadCount((prev) => prev + 1);
      }
    }

    function handleConversationUnreadUpdated() {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    socket.on("receive_message", handleReceiveMessage);
    socket.on("conversation_unread_updated", handleConversationUnreadUpdated);

    return () => {
      socket.off("connect", joinRooms);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("conversation_unread_updated", handleConversationUnreadUpdated);
    };
  }, [effectiveWorkspaceId, pathname]);

  // Shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSwitchWorkspace = (targetWorkspaceId: string) => {
    setWorkspaceOpen(false);
    setActiveWorkspaceIdState(targetWorkspaceId);

    // If currently inside /workspace/[workspaceId]/..., keep the same subpage
    const pathParts = pathname.split("/");
    if (pathParts[1] === "workspace" && pathParts[3]) {
      const subpath = pathParts.slice(3).join("/");
      router.push(`/workspace/${targetWorkspaceId}/${subpath}`);
    } else {
      router.push(`/dashboard?workspace=${targetWorkspaceId}`);
    }
  };

  const handleSidebarClose = () => {
    setSidebarClose((prev) => !prev);
  };

  const handleInviteMember = async () => {
    const workspaceId = activeWorkspaceIdState ?? effectiveWorkspaceId;

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

      toast.success(
        inviteData.emailDelivered === false
          ? inviteData.emailWarning ?? successMessage
          : successMessage
      );
      setInviteEmail("");
      setInviteOpen(false);
    } catch {
      toast.error("Unable to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  // Build target link URL
  const getHref = (hrefTemplate: string) => {
    if (hrefTemplate.includes("[workspaceId]")) {
      return hrefTemplate.replace("[workspaceId]", effectiveWorkspaceId ?? "");
    }
    if (effectiveWorkspaceId && hrefTemplate.startsWith("/dashboard")) {
      return `${hrefTemplate}?workspace=${effectiveWorkspaceId}`;
    }
    return hrefTemplate;
  };

  // Check if link is active
  const isLinkActive = (hrefTemplate: string) => {
    const resolved = getHref(hrefTemplate);
    const cleanResolved = resolved.split("?")[0];
    const cleanPathname = pathname.split("?")[0];

    if (hrefTemplate === "/dashboard") {
      return cleanPathname === "/dashboard";
    }

    if (hrefTemplate.startsWith("/dashboard/")) {
      return cleanPathname === cleanResolved;
    }

    if (hrefTemplate.includes("[workspaceId]")) {
      return cleanPathname.startsWith(cleanResolved);
    }

    return cleanPathname === cleanResolved;
  };

  // Search items
  const quickNavActions = [
    {
      title: "Dashboard Overview",
      href: effectiveWorkspaceId ? `/dashboard?workspace=${effectiveWorkspaceId}` : "/dashboard",
      icon: LayoutDashboard,
      section: "Navigation",
    },
    {
      title: "Projects & Tasks Board",
      href: effectiveWorkspaceId ? `/workspace/${effectiveWorkspaceId}/projects` : "/dashboard",
      icon: FolderKanban,
      section: "Navigation",
    },
    {
      title: "My Assigned Tasks",
      href: effectiveWorkspaceId ? `/workspace/${effectiveWorkspaceId}/tasks?mine=true` : "/dashboard",
      icon: CheckSquare,
      section: "Navigation",
    },
    {
      title: "Team Messages & Channels",
      href: effectiveWorkspaceId ? `/workspace/${effectiveWorkspaceId}/chat` : "/dashboard",
      icon: MessageSquare,
      section: "Navigation",
    },
    {
      title: "Workspace Files & Docs",
      href: effectiveWorkspaceId ? `/workspace/${effectiveWorkspaceId}/files` : "/dashboard",
      icon: FileText,
      section: "Navigation",
    },
    {
      title: "Workspace Analytics",
      href: effectiveWorkspaceId ? `/dashboard/analytics?workspace=${effectiveWorkspaceId}` : "/dashboard/analytics",
      icon: BarChart3,
      section: "Workspace",
    },
    {
      title: "Notifications Hub",
      href: effectiveWorkspaceId ? `/dashboard/notifications?workspace=${effectiveWorkspaceId}` : "/dashboard/notifications",
      icon: Bell,
      section: "Workspace",
    },
    {
      title: "Workspace Members",
      href: effectiveWorkspaceId ? `/dashboard/members?workspace=${effectiveWorkspaceId}` : "/dashboard/members",
      icon: Users,
      section: "Workspace",
    },
    {
      title: "Settings & Preferences",
      href: effectiveWorkspaceId ? `/dashboard/settings?workspace=${effectiveWorkspaceId}` : "/dashboard/settings",
      icon: Settings,
      section: "Workspace",
    },
  ];

  const filteredQuickNav = quickNavActions.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        "relative shrink-0 sticky top-0 h-screen transition-all duration-300 z-40 select-none",
        sidebarClose ? "w-0" : "w-64"
      )}
    >
      <aside
        className={cn(
          "flex h-screen w-64 flex-col overflow-hidden border-r border-border/80 bg-card/60 backdrop-blur-xl transition-transform duration-300 shadow-sm",
          sidebarClose ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Workspace switcher header */}
        <div className="p-3 pb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                setWorkspaceOpen((v) => !v);
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/70 transition-all group border border-border/50 bg-background/50 text-left shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                {currentWorkspace?.name ? currentWorkspace.name.slice(0, 2).toUpperCase() : <Zap className="w-4 h-4 fill-current" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate tracking-tight">
                  {currentWorkspace?.name ?? "No workspace"}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>{currentWorkspace ? `${currentWorkspace.memberCount} member${currentWorkspace.memberCount === 1 ? "" : "s"}` : "Create workspace"}</span>
                  {currentWorkspace?.role && (
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-muted font-medium text-foreground/80">
                      {currentWorkspace.role}
                    </span>
                  )}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
                  workspaceOpen && "rotate-180 text-foreground"
                )}
              />
            </button>

            {/* Workspaces Dropdown */}
            {workspaceOpen && (
              <div className="absolute top-full left-0 mt-2 w-full rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-lg p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Workspaces
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                  {workspaces.map((workspace) => {
                    const isCurrent = workspace.id === effectiveWorkspaceId;
                    return (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => handleSwitchWorkspace(workspace.id)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors flex items-center justify-between group",
                          isCurrent && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                              isCurrent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                            )}
                          >
                            {workspace.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="truncate">{workspace.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {workspace.unreadMessageCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                              {workspace.unreadMessageCount}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{workspace.memberCount}m</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-border/60 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceOpen(false);
                    setCreateOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-foreground font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  New Workspace
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceOpen(false);
                    setActiveWorkspaceIdState(effectiveWorkspaceId);
                    setInviteOpen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Invite Member
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Search */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all text-xs border border-border/40 bg-muted/20 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="flex-1 text-left">Quick search...</span>
            <kbd className="text-[10px] border border-border/80 bg-background/80 rounded px-1.5 py-0.5 font-mono text-muted-foreground shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="h-px bg-border/60 mx-3 mb-2" />

        {/* Main nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-1">
          <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Workspace
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const targetHref = getHref(item.href);
            const active = isLinkActive(item.href);

            return (
              <Link
                key={item.href}
                href={targetHref}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-all group",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>

                {item.label === "Messages" && (
                  unreadCount > 0 ? (
                    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-2xs ring-2 ring-background">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500" />
                  )
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom nav items & Account Profile */}
        <div className="border-t border-border/70 p-3 flex flex-col gap-1 bg-card/40">
          <div className="px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            General
          </div>
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const targetHref = getHref(item.href);
            const active = isLinkActive(item.href);

            return (
              <Link
                key={item.href}
                href={targetHref}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm font-medium transition-all group",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* User Account Popover */}
          <div className="mt-2 pt-2 border-t border-border/60 relative">
            <button
              type="button"
              onClick={() => {
                setWorkspaceOpen(false);
                setUserMenuOpen((v) => !v);
              }}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-muted/70 transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-violet-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                {userName ? userName.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-tight">{userName || "User"}</p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight">{userEmail}</p>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0",
                  userMenuOpen && "rotate-180 text-foreground"
                )}
              />
            </button>

            {/* User Menu Modal */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-2 border-b border-border/60 mb-1">
                  <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                </div>

                <Link
                  href={getHref("/dashboard/settings")}
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Account Settings
                </Link>

                <Link
                  href={getHref("/dashboard/notifications")}
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Notifications
                </Link>

                <div className="h-px bg-border/60 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut({ callbackUrl: "/auth/login" });
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg hover:bg-destructive/10 text-destructive font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar Collapse Toggle Button */}
      <button
        type="button"
        onClick={handleSidebarClose}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-md transition-all hover:bg-muted hover:scale-105",
          sidebarClose ? "left-3" : "-right-3.5"
        )}
        aria-label={sidebarClose ? "Open sidebar" : "Close sidebar"}
        title={sidebarClose ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarClose ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-foreground" />
        )}
      </button>

      {/* Quick Search Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="p-0 max-w-lg overflow-hidden gap-0">
          <div className="flex items-center px-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search navigation, projects, files, actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3.5 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredQuickNav.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching pages or actions found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredQuickNav.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => {
                      setSearchModalOpen(false);
                      setSearchQuery("");
                      router.push(action.href);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{action.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                      {action.section}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Navigation Quick Switcher</span>
            <span>Press ESC to close</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(createdId) => {
          setActiveWorkspaceIdState(createdId);
          router.push(`/dashboard?workspace=${createdId}`);
          router.refresh();
          setInviteOpen(true);
        }}
      />

      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Teammate</DialogTitle>
            <DialogDescription>
              Send an email invite link to join <span className="font-semibold text-foreground">{currentWorkspace?.name ?? "your workspace"}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Teammate Email Address
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isInviting}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInviteMember();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isInviting}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
