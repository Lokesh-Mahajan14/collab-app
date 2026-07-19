
import { getUserConversationsAction } from "@/features/conversation/action";
import Link from "next/link";
import { MessageSquareText, Plus } from "lucide-react";
import { getServerSession } from "next-auth";

import { Button } from "@/components/ui/Button";
import { authOptions } from "@/lib/auth";
import ConversationList from "./ConversationList";


interface Props {
  workspaceId: string;
}
export default async function ChatSidebar({
  workspaceId,
}: Props) {

  const session = await getServerSession(authOptions);

  const conversations =
    await getUserConversationsAction(
      workspaceId
    );

  return (
    <aside className="flex h-64 w-full shrink-0 flex-col border-b border-border/70 bg-card/80 lg:h-full lg:w-80 lg:border-b-0 lg:border-r">
      <div className="border-b border-border/70 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Workspace Chat
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-sm font-semibold">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              Conversations
            </h2>
          </div>

          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/workspace/${workspaceId}/chat/new`}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Link>
          </Button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {conversations.length} joined conversation{conversations.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <ConversationList
          
          workspaceId={workspaceId}
          currentUserId={session?.user?.id ?? ""}
        />
      </div>
    </aside>
  );
}