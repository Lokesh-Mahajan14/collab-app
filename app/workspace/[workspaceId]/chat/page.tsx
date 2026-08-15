import Link from "next/link";
import { MessageCircleMore, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function ChatPage({
  params,
}: {
  params: Promise<{
    workspaceId: string;
  }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <MessageCircleMore className="h-6 w-6 text-muted-foreground" />
        </div>

        <h2 className="mt-4 text-lg font-semibold">Select a conversation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a channel from the sidebar or create a new one.
        </p>

        <Button asChild className="mt-5 gap-1.5">
          <Link href={`/workspace/${workspaceId}/chat/new`}>
            <Plus className="h-4 w-4" />
            New conversation
          </Link>
        </Button>
      </div>
    </div>
  );
}