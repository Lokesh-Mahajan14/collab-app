"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/auth/SignOutButton";

type TopbarProps = {
  workspaceName?: string;
  workspaceId?: string;
  currentPageTitle?: string;
};

export function Topbar({ workspaceName, workspaceId, currentPageTitle }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleNewClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("new", "workspace");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getPageTitle = () => {
    if (currentPageTitle) return currentPageTitle;
    if (pathname.includes("/projects")) return "Projects";
    if (pathname.includes("/tasks")) return "Tasks";
    if (pathname.includes("/chat")) return "Messages";
    if (pathname.includes("/files")) return "Files";
    if (pathname.includes("/analytics")) return "Analytics";
    if (pathname.includes("/notifications")) return "Notifications";
    if (pathname.includes("/members")) return "Members";
    if (pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  };

  const notificationsUrl = workspaceId
    ? `/dashboard/notifications?workspace=${workspaceId}`
    : "/dashboard/notifications";

  return (
    <header className="h-14 shrink-0 border-b border-border/80 flex items-center justify-between px-6 bg-card/40 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={workspaceId ? `/dashboard?workspace=${workspaceId}` : "/dashboard"}
          className="text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          {workspaceName ?? "Dashboard"}
        </Link>
        <span className="text-muted-foreground/40 font-light">/</span>
        <span className="font-semibold text-foreground">{getPageTitle()}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2.5">
        {/* Search shortcut */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors shadow-2xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline text-[10px] border border-border bg-background rounded px-1.5 py-0.5 font-mono ml-1">
            ⌘K
          </kbd>
        </button>

        {/* Create new workspace action */}
        <Button size="sm" className="gap-1.5 hidden sm:flex text-xs h-8" onClick={handleNewClick}>
          <Plus className="w-3.5 h-3.5" />
          New Workspace
        </Button>

        {/* Notifications */}
        <Link
          href={notificationsUrl}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground border border-border/40 bg-background/50"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
        </Link>

        <SignOutButton />
      </div>
    </header>
  );
}
