import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocket = (server: any) => {
  if (!server.io) {
    const io = new SocketIOServer(server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("User Connected");

      socket.on("join-chat", (conversationId) => {
        socket.join(conversationId);
      });

      socket.on("send-message", (message) => {
        io.to(message.conversationId).emit(
          "receive-message",
          message
        );
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });

    server.io = io;
  }

  return server.io;
};