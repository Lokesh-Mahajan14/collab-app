import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import CreateConversationForm from "@/components/chat/CreateConversationForm";

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
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <CreateConversationForm
        workspaceId={workspaceId}
        currentUserId={session.user.id}
      />
    </div>
  );
}