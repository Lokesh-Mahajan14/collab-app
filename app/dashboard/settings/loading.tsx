import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto animate-in fade-in-50 duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-xs">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>

      {/* Settings Forms */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-border/70 bg-card/60 space-y-5 shadow-2xs"
          >
            <div className="space-y-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-64" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
