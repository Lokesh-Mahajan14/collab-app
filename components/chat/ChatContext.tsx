"use client";

import { ChatMessage } from "@/types/message";
import { createContext, useContext, useState } from "react";

interface ChatContextType {
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  hasMore: boolean;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  replyingTo: any | null;
  setReplyingTo: React.Dispatch<React.SetStateAction<any | null>>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
  initialMessages = [],
  initialHasMore = false,
  children,
}: {
  initialMessages: any[];
  initialHasMore?: boolean;
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [hasMore, setHasMore] = useState<boolean>(initialHasMore);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        hasMore,
        setHasMore,
        replyingTo,
        setReplyingTo,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);

  if (!ctx) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return ctx;
}
