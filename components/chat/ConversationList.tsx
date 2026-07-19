"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, Lock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useContext, useEffect, useState } from "react";
import { ConversationDTO } from "@/types/conversation";
import { socket } from "@/lib/socket-client";
import { useConversation } from "./ConversationContext";

interface ConversationListProps {
  workspaceId: string;
  currentUserId: string;
}

export default function ConversationList({
  workspaceId,
  currentUserId,
}: ConversationListProps) {
  function renderLastMessage(message: ConversationDTO["lastMessage"]) {
    if (!message) return "No messages yet";

    switch (message.type) {
      case "TEXT":
        return `${message.sender.name ?? "Unknown"}: ${message.content}`;

      case "IMAGE":
        return `${message.sender.name ?? "Unknown"}: 📷 Photo`;

      case "FILE":
        return `${message.sender.name ?? "Unknown"}: 📄 ${
          message.attachments[0]?.fileName ?? "File"
        }`;

      default:
        return `${message.sender.name ?? "Unknown"}: Message`;
    }
  }

  const { conversations, setConversations } = useConversation();
  useEffect(() => {
    function handleReceiveMessage(message: any) {
      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: message,
                lastMessageAt: message.createdAt,

                unreadCount:
                  message.senderId === currentUserId
                    ? conversation.unreadCount
                    : conversation.unreadCount + 1,
              }
            : conversation,
        );

        updated.sort((a, b) => {
          const aTime = a.lastMessageAt ?? a.createdAt;
          const bTime = b.lastMessageAt ?? b.createdAt;

          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        return [...updated];
      });
    }

    socket.on("receive_message", handleReceiveMessage);

    function handleConversationUnreadUpdated({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) {
      if (userId !== currentUserId) return;

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                unreadCount: 0,
              }
            : conversation,
        ),
      );
    }

    socket.on("conversation_unread_updated", handleConversationUnreadUpdated);

    return () => {
      socket.off(
        "conversation_unread_updated",
        handleConversationUnreadUpdated,
      );
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [currentUserId]);

  const pathname = usePathname();

  if (!conversations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center">
        <p className="text-sm font-medium text-foreground">
          No conversations yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create your first channel or group to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      {conversations.map((conversation) => {
        const isActive = pathname.includes(conversation.id);
        const memberCount = conversation.members?.length ?? 0;

        const isChannel = conversation.type === "CHANNEL";
        const isPrivateChannel = conversation.type === "PRIVATE_CHANNEL";

        const ConversationIcon = isChannel
          ? Hash
          : isPrivateChannel
            ? Lock
            : Users;

        const directPeer =
          conversation.type === "DIRECT"
            ? conversation.members?.find(
                (member) => member.userId !== currentUserId,
              )
            : null;

        const displayName =
          conversation.type === "DIRECT"
            ? (directPeer?.user?.name ?? "Direct message")
            : (conversation.name ?? "Untitled conversation");

        return (
          <Link
            key={conversation.id}
            href={`/workspace/${workspaceId}/chat/${conversation.id}`}
            className={cn(
              "group block rounded-xl border border-transparent px-3 py-2.5 transition-all",
              "hover:border-border/70 hover:bg-muted/60",
              isActive && "border-border bg-muted",
            )}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground",
                  isActive && "bg-primary text-primary-foreground",
                )}
              >
                <ConversationIcon className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </p>

                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{memberCount} members</span>

                      <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/60" />

                      <Badge
                        variant="outline"
                        className="h-4 rounded-full px-1.5 text-[10px]"
                      >
                        {conversation.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="truncate text-xs text-muted-foreground">
                      {renderLastMessage(conversation.lastMessage)}
                    </p>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <Badge className="ml-2 min-w-5 rounded-full px-1.5">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}
