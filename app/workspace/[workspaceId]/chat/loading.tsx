import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-muted/20 lg:flex-row animate-in fade-in-50 duration-300">
      {/* Chat Sidebar Skeleton */}
      <div className="w-full lg:w-72 border-r border-border/80 bg-card/60 p-3 space-y-4 shrink-0 flex flex-col">
        <div className="flex items-center justify-between px-2 pt-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>

        <Skeleton className="h-8 w-full rounded-lg" />

        <div className="space-y-2 flex-1 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl border border-transparent bg-background/40 flex items-center gap-3"
            >
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Messages Area Skeleton */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background/50">
        {/* Chat header */}
        <div className="h-14 border-b border-border/70 px-4 flex items-center justify-between bg-card/40">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="w-7 h-7 rounded-lg" />
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 space-y-4 overflow-hidden flex flex-col justify-end">
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1.5 max-w-sm">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-64 rounded-2xl rounded-tl-sm" />
            </div>
          </div>

          <div className="flex items-start gap-3 justify-end">
            <div className="space-y-1.5 max-w-sm flex flex-col items-end">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-16 w-72 rounded-2xl rounded-tr-sm" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          </div>

          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <div className="space-y-1.5 max-w-sm">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-sm" />
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-border/70 bg-card/30">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
