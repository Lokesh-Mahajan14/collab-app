import CreateConversationForm
from "../../../../../components/chat/CreateConversationForm";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export default async function Page({
  params,
}: {
  params: Promise<{
    workspaceId: string;
  }>;
}) {
  const { workspaceId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return (
    <CreateConversationForm
      workspaceId={workspaceId}
      currentUserId={session.user.id}
    />
  );
}