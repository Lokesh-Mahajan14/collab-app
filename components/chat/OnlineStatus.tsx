"use client";

import { Badge } from "@/components/ui/badge";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";

interface Props {
  members: {
    id: string;
    name: string | null;
  }[];
  currentUserId: string;
}

export default function OnlineStatus({
  members,currentUserId
}: Props) {

  const onlineUsers =
    useOnlineUsers();

    console.log("ONLINE USERS:", onlineUsers);

  const onlineMembers =
  members.filter(
    member =>
      member.id !== currentUserId &&
      onlineUsers.includes(member.id)
  );

  return (

    <Badge
      variant="outline"
      className="rounded-full"
    >

      <div
        className={
          onlineMembers.length > 0
            ? "h-2 w-2 rounded-full bg-green-500"
            : "h-2 w-2 rounded-full bg-gray-400"
        }
      />

      <span>

        {onlineMembers.length > 0
          ? onlineMembers
              .map(m => m.name)
              .join(", ")
          : "Offline"}

      </span>

    </Badge>

  );

}