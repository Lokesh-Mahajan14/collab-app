import { getConversationAction } from "../../features/conversation/action";
import { Hash, Lock, Users } from "lucide-react";
import { getServerSession } from "next-auth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authOptions } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import OnlineStatus from "./OnlineStatus";

interface Props {
  conversationId: string;
}

export default async function ChatHeader({ conversationId }: Props) {
  const session = await getServerSession(authOptions);

  const conversation = await getConversationAction(conversationId);

  if (!conversation) {
    return null;
  }

  const isChannel = conversation.type === "CHANNEL";
  const isPrivateChannel = conversation.type === "PRIVATE_CHANNEL";

  const Icon = isChannel ? Hash : isPrivateChannel ? Lock : Users;

  const memberNames = conversation.members
    .map((member) => member.user.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  const directPeer =
    conversation.type === "DIRECT"
      ? conversation.members.find(
          (member) => member.userId !== session?.user?.id,
        )
      : null;

  const conversationTitle =
    conversation.type === "DIRECT"
      ? (directPeer?.user?.name ?? "Direct message")
      : (conversation.name ?? "Conversation");

  return (
    <div className="border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar>
            <AvatarFallback>
              <Icon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">
              {conversationTitle}
            </h2>

            <p className="truncate text-xs text-muted-foreground">
              {conversation.members.length} members
              {memberNames ? ` • ${memberNames}` : ""}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="outline" className="rounded-full">
            {conversation.type.replace("_", " ")}
          </Badge>

          <OnlineStatus
            currentUserId={session?.user?.id ?? ""}
            members={conversation.members.map((member) => ({
              id: member.user.id,
              name: member.user.name,
            }))}
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 sm:hidden">
        <Badge variant="outline" className="rounded-full">
          {conversation.type.replace("_", " ")}
        </Badge>

        <Badge variant="outline" className="rounded-full">
          <OnlineStatus
            currentUserId={session?.user?.id ?? ""}
            members={conversation.members.map((member) => ({
              id: member.user.id,
              name: member.user.name,
            }))}
          />
        </Badge>
      </div>
    </div>
  );
}
