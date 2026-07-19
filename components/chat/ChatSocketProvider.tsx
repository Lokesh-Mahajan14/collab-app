"use client";

import {
  useEffect,
  createContext,
  useContext,
} from "react";

import { socket } from "../../lib/socket-client";

interface Props {
  userId: string;
  children: React.ReactNode;
}

const SocketContext =
  createContext(socket);

export function ChatSocketProvider({
  userId,
  children,
}: Props) {

  useEffect(() => {

    socket.connect();

    socket.on("connect", () => {
      socket.emit(
        "user_connected",
        userId
      );
    });

    return () => {
      socket.disconnect();
    };

  }, [userId]);

  return (
    <SocketContext.Provider
      value={socket}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(
    SocketContext
  );
}