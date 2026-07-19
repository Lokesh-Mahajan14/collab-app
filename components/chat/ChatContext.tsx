"use client";

import { ChatMessage } from "@/types/message";
import { createContext, useContext, useState } from "react";

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;

  replyingTo: ChatMessage | null;

  setReplyingTo: React.Dispatch<React.SetStateAction<ChatMessage | null>>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
  initialMessages,
  children,
}: {
  initialMessages: any[];
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState(initialMessages);

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,

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
