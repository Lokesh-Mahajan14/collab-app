import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-9 w-64 md:w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border/70 bg-card/60 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="w-8 h-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-border/70 bg-card/60 space-y-4"
          >
            <Skeleton className="h-5 w-36" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
