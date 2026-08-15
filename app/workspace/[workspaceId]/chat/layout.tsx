import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserConversationsAction } from "@/features/conversation/action";
import { ChatSocketProvider } from "@/components/chat/ChatSocketProvider";
import { ConversationProvider } from "@/components/chat/ConversationContext";
import ChatSidebar from "@/components/chat/ChatSidebar";

export default async function ChatRouteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const { workspaceId } = await params;

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const conversations = await getUserConversationsAction(workspaceId);

  return (
    <ChatSocketProvider
      userId={session.user.id}
      workspaceId={workspaceId}
    >
      <ConversationProvider initialConversations={conversations}>
        <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-muted/20 lg:flex-row">
          <ChatSidebar
            workspaceId={workspaceId}
            currentUserId={session.user.id}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {children}
          </div>
        </div>
      </ConversationProvider>
    </ChatSocketProvider>
  );
}
