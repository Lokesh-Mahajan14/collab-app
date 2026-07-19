"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/auth/SignOutButton";

type TopbarProps = {
  workspaceName?: string;
};

export function Topbar({ workspaceName }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleNewClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("new", "workspace");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-14 shrink-0 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          {workspaceName ?? "No workspace"}
        </span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">Dashboard</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Search…</span>
          <kbd className="hidden sm:inline text-[10px] border border-border rounded px-1 font-mono ml-1">
            ⌘K
          </kbd>
        </button>

        {/* Create new */}
        <Button size="sm" className="gap-1.5 hidden sm:flex" onClick={handleNewClick}>
          <Plus className="w-3.5 h-3.5" />
          New
        </Button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        <SignOutButton />
      </div>
    </header>
  );
}
