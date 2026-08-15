import { Server } from "socket.io";
import { db } from "@/lib/db";

const io = new Server(3001, {
  cors: {
    origin: [
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

const onlineUsers =
  new Map<string, string>();

io.on("connection", (socket) => {

  console.log(
    "Connected:",
    socket.id
  );

  socket.on(
    "join_workspace",
    (workspaceId) => {

      socket.join(
        `workspace:${workspaceId}`
      );

    }
  );

  socket.on(
    "join_conversation",
    (conversationId) => {

      console.log(
      `${socket.id} joined ${conversationId}`
    );


      socket.join(
        conversationId
      );

    }
  );

  socket.on(
    "leave_conversation",
    (conversationId) => {

      socket.leave(
        conversationId
      );

    }
  );

  socket.on(
    "send_message",
    (
      conversationId,
      message
    ) => {

      console.log(
      "SERVER RECEIVED",
      Date.now()
    );

      db.conversation.findUnique({
        where: {
          id: conversationId,
        },
        select: {
          workspaceId: true,
        },
      }).then((conversation) => {
        if (!conversation) {
          return;
        }

        io.to(`workspace:${conversation.workspaceId}`)
          .to(conversationId)
          .emit("receive_message", message);
      });

    }
  );

  socket.on(
    "typing",
    (
      conversationId: string,
      user: {
        id: string;
        name: string;
      }
    ) => {

      console.log(
      "SERVER TYPING:",
      user.name
    );

      socket
        .to(conversationId)
        .emit(
          "user_typing",
          user
        );

    }
  );

  socket.on(
    "stop_typing",
  (
    conversationId:string,
    userName:string
  )=>{

    console.log(
      "SERVER STOP TYPING:",
      userName
    );

    socket
      .to(conversationId)
      .emit
      (
        "user_stop_typing",
        userName
      )
  }
    
  );

  socket.on(
    "user_connected",
    async (userId) => {

      onlineUsers.set(
        socket.id,
        userId
      );

      io.emit(
        "user_online",
        userId
      );

      io.emit(
      "online_users",
      Array.from(
        new Set(
          onlineUsers.values()
        )
      )
    );

    }
  );
    

  socket.on(
  "message_read",
  ({
    messageId,
    conversationId,
    userId,
  }) => {

    db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        workspaceId: true,
      },
    }).then((conversation) => {
      if (!conversation) {
        return;
      }

      socket.to(
        conversationId
      ).emit(
        "message_read_update",
        {
          messageId,
          userId,
        }
      );

      io.to(
        `workspace:${conversation.workspaceId}`
      ).emit(
        "conversation_unread_updated",
        {
          conversationId,
          userId,
        }
      )
    });

  }
);

socket.on(
  "edit_message",
  (
    conversationId,
    message
  ) => {

    io.to(
      conversationId
    ).emit(
      "message_edited",
      message
    );

  }
);

socket.on(
  "delete_message",
  (conversationId,
    message
  )=>{
    io.to(
      conversationId
    ).emit(
      "message_deleted",
      message
    )
  }
)

socket.on(
  "message_reaction",
  (conversationId,
    message,

  )=>{
    io.to(
      conversationId,
    ).emit(
      "message_reaction_update",
      message
    )
  }

)

  


  socket.on(
  "disconnect",
  async () => {

    const userId =
      onlineUsers.get(socket.id);

    if (userId) {

      onlineUsers.delete(
        socket.id
    );

      io.emit(
        "user_offline",
        userId
      );

      io.emit(
    "online_users",
    Array.from(
      new Set(
        onlineUsers.values()
      )
    )
  );

    }

    console.log(
      "Disconnected:",
      socket.id
    );

  }
);

});

console.log(
  "Socket server running on 3001"
);