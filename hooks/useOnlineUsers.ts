"use client";

import {
  useEffect,
  useState,
} from "react";

import { useSocket }
from "@/components/chat/ChatSocketProvider";

export function useOnlineUsers() {

  const socket =
    useSocket();

  const [onlineUsers,
  setOnlineUsers] =
    useState<string[]>([]);

  useEffect(() => {

    socket.on(
      "user_online",
      (userId) => {

        setOnlineUsers(prev => 

          prev.includes(userId)
    ? prev
    : [...prev, userId]

        );

      }
    );

    socket.on(
      "online_users",
      (users: string[]) => {

        setOnlineUsers(users);

      }
    );

    socket.on(
      "user_offline",
      (userId) => {

        setOnlineUsers(prev =>
          prev.filter(
            id =>
              id !== userId
          )
        );

      }
    );

    return () => {

      socket.off(
        "user_online"
      );

      socket.off(
        "user_offline"
      );

    };

  }, [socket]);

  return onlineUsers;

}