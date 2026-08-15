import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="space-y-8 p-6 animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <section className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-xs space-y-1.5"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Kanban Board Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["Todo", "In Progress", "Done"].map((column) => (
          <div
            key={column}
            className="rounded-2xl border border-border/70 bg-card/40 p-4 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>

            <div className="space-y-3 pt-1">
              {[1, 2].map((card) => (
                <div
                  key={card}
                  className="p-4 rounded-xl border border-border/60 bg-card space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="pt-2 flex items-center justify-between border-t border-border/40">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
