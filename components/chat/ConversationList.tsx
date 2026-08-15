"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageAttachmentDTO, MessageDTO } from "@/types/message";
import { socket } from "@/lib/socket-client";
import { useConversation } from "./ConversationContext";
import ConversationListItem from "./ConversationListItem";

interface ConversationListProps {
  workspaceId: string;
  currentUserId: string;
}

export default function ConversationList({
  workspaceId,
  currentUserId,
}: ConversationListProps) {
  const pathname = usePathname();
  const { conversations, setConversations } = useConversation();

  const sortConversations = useCallback((items: typeof conversations) => {
    return [...items].sort((a, b) => {
      const aTime = a.lastMessageAt ?? a.createdAt;
      const bTime = b.lastMessageAt ?? b.createdAt;

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, []);

  // When active conversation changes or is opened, immediately clear its unread badge
  useEffect(() => {
    const activeConversationId = pathname.split("/chat/")[1]?.split("/")[0];
    if (activeConversationId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId && c.unreadCount > 0
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    }
  }, [pathname, setConversations]);

  useEffect(() => {
    function handleReceiveMessage(message: MessageDTO) {
      const activeConversationId = pathname.split("/chat/")[1]?.split("/")[0];
      const isViewingThisConversation = activeConversationId === message.conversationId;

      setConversations((prev) => {
        const normalizedMessage: MessageDTO & {
          attachments: MessageAttachmentDTO[];
        } = {
          ...message,
          attachments: message.attachments ?? [],
        };

        const updated = prev.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: normalizedMessage,
                lastMessageAt: normalizedMessage.createdAt,
                unreadCount:
                  normalizedMessage.senderId === currentUserId || isViewingThisConversation
                    ? conversation.unreadCount
                    : (conversation.unreadCount || 0) + 1,
              }
            : conversation,
        );

        return sortConversations(updated);
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
        sortConversations(
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  unreadCount: 0,
                }
              : conversation,
          ),
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
  }, [currentUserId, pathname, setConversations, sortConversations]);

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
        return (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            workspaceId={workspaceId}
            currentUserId={currentUserId}
          />
        );
      })}
    </>
  );
}
