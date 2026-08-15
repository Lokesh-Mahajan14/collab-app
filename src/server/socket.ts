import { Server } from "socket.io";
import { db } from "@/lib/db";
import { redis, getCached, setCached } from "@/lib/redis";

const PORT = Number(process.env.PORT || 3001);
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:3000", process.env.NEXTAUTH_URL].filter(Boolean) as string[];

const io = new Server(PORT, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    credentials: true,
  },
});

const onlineUsers = new Map<string, string>();

async function getConversationWorkspaceId(conversationId: string): Promise<string | null> {
  const cacheKey = `conv:${conversationId}:workspaceId`;
  const cached = await getCached<string>(cacheKey);
  if (cached) return cached;

  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { workspaceId: true },
  });

  if (conv?.workspaceId) {
    await setCached(cacheKey, conv.workspaceId, 3600); // 1 hour TTL
    return conv.workspaceId;
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join_workspace", (workspaceId) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on("join_conversation", (conversationId) => {
    console.log(`${socket.id} joined ${conversationId}`);
    socket.join(conversationId);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on("send_message", async (conversationId, message) => {
    console.log("SERVER RECEIVED", Date.now());
    const workspaceId = await getConversationWorkspaceId(conversationId);

    if (workspaceId) {
      io.to(`workspace:${workspaceId}`)
        .to(conversationId)
        .emit("receive_message", message);
    } else {
      io.to(conversationId).emit("receive_message", message);
    }
  });

  socket.on("typing", (conversationId: string, user: { id: string; name: string }) => {
    socket.to(conversationId).emit("user_typing", user);
  });

  socket.on("stop_typing", (conversationId: string, userName: string) => {
    socket.to(conversationId).emit("user_stop_typing", userName);
  });

  socket.on("user_connected", async (userId: string) => {
    onlineUsers.set(socket.id, userId);

    if (redis) {
      try {
        await redis.sadd("online_users", userId);
      } catch (err) {
        console.error("Redis sadd error:", err);
      }
    }

    io.emit("user_online", userId);
    io.emit("online_users", Array.from(new Set(onlineUsers.values())));
  });

  socket.on("message_read", async ({ messageId, conversationId, userId }) => {
    const workspaceId = await getConversationWorkspaceId(conversationId);

    socket.to(conversationId).emit("message_read_update", {
      messageId,
      userId,
    });

    if (workspaceId) {
      io.to(`workspace:${workspaceId}`).emit("conversation_unread_updated", {
        conversationId,
        userId,
      });
    }
  });

  socket.on("edit_message", (conversationId, message) => {
    io.to(conversationId).emit("message_edited", message);
  });

  socket.on("delete_message", (conversationId, message) => {
    io.to(conversationId).emit("message_deleted", message);
  });

  socket.on("message_reaction", (conversationId, message) => {
    io.to(conversationId).emit("message_reaction_update", message);
  });

  socket.on("disconnect", async () => {
    const userId = onlineUsers.get(socket.id);

    if (userId) {
      onlineUsers.delete(socket.id);

      if (redis) {
        try {
          await redis.srem("online_users", userId);
        } catch (err) {
          console.error("Redis srem error:", err);
        }
      }

      io.emit("user_offline", userId);
      io.emit("online_users", Array.from(new Set(onlineUsers.values())));
    }

    console.log("Disconnected:", socket.id);
  });
});

console.log("Socket server running on 3001");