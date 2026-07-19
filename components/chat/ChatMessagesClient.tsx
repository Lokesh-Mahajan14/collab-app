"use client";

import { useEffect, useRef, useState } from "react";

import MessageBubble from "./ChatMessageBubble";

import { useSocket } from "./ChatSocketProvider";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "./ChatContext";
import {
  getOlderMessagesAction,
  markMessageAsReadAction,
} from "../../features/message/action";

interface Props {
  initialMessages: any[];
  currentUserId: string;
  conversationId: string;
}

export default function ChatMessagesClient({
  initialMessages,

  currentUserId,

  conversationId,
}: Props) {
  const socket = useSocket();

  //const [messages, setMessages] = useState(initialMessages);
  const { messages, setMessages } = useChat();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  const readMessagesRef = useRef(new Set<string>());

  const oldestMessageId = messages[0]?.id;

  const containerRef = useRef<HTMLDivElement>(null);

  async function loadMore() {
    if (!oldestMessageId) return;

    const older = await getOlderMessagesAction(conversationId, oldestMessageId);
    setMessages((prev) => [...older, ...prev]);
  }
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 50) {
        void loadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    messages.forEach(async (message) => {
      if (message.senderId === currentUserId) {
        return;
      }

      if (readMessagesRef.current.has(message.id)) {
        return;
      }

      readMessagesRef.current.add(message.id);

      await markMessageAsReadAction(message.id);

      socket.emit("message_read", {
        messageId: message.id,
        conversationId,
        userId: currentUserId,
      });
    });
  }, [messages, currentUserId, conversationId, socket]);

  useEffect(() => {
    console.log("JOINING ROOM:", conversationId);
    socket.emit("join_conversation", conversationId);

    socket.on("receive_message", (message) => {
      console.log("SOCKET MESSAGE:", message);

      console.log("CLIENT RECEIVE", Date.now());

      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === message.id);

          if (exists) {
            return prev;
          }

          return [...prev, message];
        });
      }
    });

    socket.on("user_typing", (user) => {
      console.log("CLIENT USER_TYPING:", user);
      setTypingUsers((prev) => {
        if (prev.includes(user.name)) {
          return prev;
        }
        return [...prev, user.name];
      });
    });

    socket.on("user_stop_typing", (userName) => {
      console.log("CLIENT USER_STOP_TYPING:", userName);
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    });

    socket.on("message_read_update", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) {
            return msg;
          }
          const alreadyRead = msg.reads?.some(
            (read: any) => read.userId === userId,
          );

          if (alreadyRead) {
            return msg;
          }

          return {
            ...msg,

            reads: [
              ...(msg.reads ?? []),
              {
                userId,
                seenAt: new Date(),
              },
            ],
          };
        }),
      );
    });

    socket.on("message_edited", (updatedMeaage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMeaage.id ? updatedMeaage : msg)),
      );
    });

    socket.on("message_deleted", (deletedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === deletedMessage.id ? deletedMessage : msg,
        ),
      );
    });

    socket.on("message_reaction_update",(updatedMessage)=>{
      setMessages(prev=>
        prev.map(msg=>
          msg.id===updatedMessage.id ? updatedMessage : msg
        )
      )
    })

    return () => {
      socket.off("receive_message");

      socket.off("user_typing");

      socket.off("user_stop_typing");

      socket.off("message_read_update");

      socket.off("message_edited");

      socket.off("message_deleted");

      socket.off("message_reaction_updated")
    };
  }, [socket, conversationId]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUserId={currentUserId}
        />
      ))}
      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
}
