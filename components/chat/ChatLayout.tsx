import { getServerSession } from "next-auth";
import ChatSidebar from "./ChatSidebar";
import { ChatSocketProvider } from "./ChatSocketProvider";
import { authOptions } from "@/lib/auth";
import { ConversationProvider } from "./ConversationContext";
import { getUserConversationsAction } from "@/features/conversation/action";

interface Props {
  workspaceId: string;
  children: React.ReactNode;
}

export  default async function ChatLayout({
  workspaceId,
  children,
}: Props) {

  const session =
   await getServerSession(
    authOptions
  );

  const conversations = await getUserConversationsAction(workspaceId);
  return (
    <ChatSocketProvider userId={
    session?.user?.id ?? ""
  }>
      <ConversationProvider
    initialConversations={conversations}
  >
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-muted/20 lg:flex-row">

      <ChatSidebar workspaceId={workspaceId} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>

    </div>
  </ConversationProvider>

    </ChatSocketProvider>
    
  );
}