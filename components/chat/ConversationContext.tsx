"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import { ConversationDTO } from "@/types/conversation";

interface ConversationContextType {
  conversations: ConversationDTO[];
  setConversations: React.Dispatch<
    React.SetStateAction<ConversationDTO[]>
  >;
}

const ConversationContext =
  createContext<ConversationContextType | null>(null);

interface Props {
  initialConversations: ConversationDTO[];
  children: React.ReactNode;
}

export function ConversationProvider({
  initialConversations,
  children,
}: Props) {
  const [conversations, setConversations] =
    useState(initialConversations);

  const value = useMemo(
    () => ({
      conversations,
      setConversations,
    }),
    [conversations]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error(
      "useConversation must be used inside ConversationProvider"
    );
  }

  return context;
}