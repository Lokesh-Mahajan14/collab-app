import { getMessagesAction } from "../../features/message/action";

import MessageBubble from "./ChatMessageBubble";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import ChatMessagesClient from "./ChatMessagesClient";

interface Props {
  conversationId: string;
}

export default async function ChatMessages({ conversationId }: Props) {
  const messages = await getMessagesAction(conversationId);

  const session = await getServerSession(authOptions);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-muted/20 px-4 py-4">
      <div className="mx-auto w-full max-w-4xl">
        {!messages.length ? (
          <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-dashed border-border bg-card/70 p-6 text-center">
            <p className="text-sm font-medium text-foreground">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start the conversation with a quick hello.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          <ChatMessagesClient
            initialMessages={messages}
            currentUserId={session?.user?.id ?? ""}
            conversationId={conversationId}
          />
        </div>
      </div>
    </div>
  );
}

