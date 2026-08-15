import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatMessagesClient from "./ChatMessagesClient";

interface Props {
  conversationId: string;
}

export default async function ChatMessages({ conversationId }: Props) {
  const session = await getServerSession(authOptions);

  return (
    <ChatMessagesClient
      currentUserId={session?.user?.id ?? ""}
      conversationId={conversationId}
    />
  );
}
