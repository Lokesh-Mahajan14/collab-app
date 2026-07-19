"use client";

import { useEffect } from "react";

import { useSocket }
from "./ChatSocketProvider";

interface Props {
  conversationId: string;
}

export default function ConversationRoom({
  conversationId,
}: Props) {

  const socket = useSocket();

  useEffect(() => {

    socket.emit(
      "join_conversation",
      conversationId
    );

    return () => {

      socket.emit(
        "leave_conversation",
        conversationId
      );

    };

  }, [
    socket,
    conversationId,
  ]);

  return null;
}