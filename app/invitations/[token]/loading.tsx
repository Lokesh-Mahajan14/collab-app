import { Skeleton } from "@/components/ui/skeleton";

export default function InvitationLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-20 flex items-center justify-center animate-in fade-in-50 duration-300">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-4 rounded-xl bg-muted/40 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </main>
  );
}
