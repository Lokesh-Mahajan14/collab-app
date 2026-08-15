"use client";

import { useEffect, createContext, useContext } from "react";
import { socket } from "../../lib/socket-client";

interface Props {
  userId: string;
  workspaceId: string;
  children: React.ReactNode;
}

const SocketContext = createContext(socket);

export function ChatSocketProvider({
  userId,
  workspaceId,
  children,
}: Props) {
  useEffect(() => {
    function emitJoin() {
      if (userId) {
        socket.emit("user_connected", userId);
      }
      if (workspaceId) {
        socket.emit("join_workspace", workspaceId);
      }
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      emitJoin();
    }

    socket.on("connect", emitJoin);

    return () => {
      socket.off("connect", emitJoin);
    };
  }, [userId, workspaceId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
