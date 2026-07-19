import ChatLayout from "@/components/chat/ChatLayout";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import ConversationRoom from "@/components/chat/ConversationRoom";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChatProvider } from "@/components/chat/ChatContext";
import { getMessagesAction } from "@/features/message/action";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{
    workspaceId: string;
    conversationId: string;
  }>;
}) {
  const {
    workspaceId,
    conversationId,
  } = await params;

  const session =
  await getServerSession(authOptions);

  const messages =
  await getMessagesAction(
    conversationId
  );

  return (
    <ChatLayout workspaceId={workspaceId}>

      <ConversationRoom
        conversationId={conversationId}
      />

      <ChatHeader
        conversationId={conversationId}
      />

      <ChatProvider initialMessages={messages}>
        <ChatMessages
        conversationId={conversationId}
      />

      <ChatInput
        conversationId={conversationId}
        currentUser={{
          id:session?.user?.id ?? "",
          name:session?.user?.name ??"",
        }}
      />

      </ChatProvider>

    </ChatLayout>
  );
}