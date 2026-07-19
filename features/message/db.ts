import {db} from "@/lib/db";
import { Prisma , MessageType} from "@prisma/client";
import { connect } from "http2";


export async function createMessage(
    data:Prisma.MessageCreateInput

){
    return db.message.create({
        data,
        include:{
            sender:{
                select:{
                    id:true,
                    name:true,
                    image:true,
                },
                
            },
            replyTo:{
              include:{
                sender:{
                  select:{
                    id:true,
                    name:true,
                  },
                },
                attachments:true,
              },
            },
            reactions:{
              include:{
                  user:{
                      select:{
                          id:true,
                          name:true,
                          image:true,
                      }
                  }
              }
          }
        },
        
    });

}

export async function findMessageById(
    id:string,
){
    return db.message.findUnique({
    where: {
      id,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
      },
      reactions:{
          include:{
              user:{
                  select:{
                      id:true,
                      name:true,
                      image:true,
                  }
              }
          }
      },
      reads: true,
    },
  });
}

interface GetMessagesOptions {
  conversationId: string;
  cursor?: string;
  limit?: number;
}

export async function findConversationMessages({
  conversationId,
  cursor,
  limit = 30,
}: GetMessagesOptions) {
  const messages=db.message.findMany({
    where: {
      conversationId,
    },

    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      reads: {
        select:{
          userId:true,
          seenAt:true,
        }
      },
      attachments: true,
      
      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          attachments: true,
        },
      },
      reactions:{
          include:{
              user:{
                  select:{
                      id:true,
                      name:true,
                      image:true,
                  }
              }
          }
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: limit,

    ...(cursor && {
      skip: 1,
      cursor: {
        id: cursor,
      },
    }),
  });
  return (await messages).reverse()
}

export async function updateMessage(
  id: string,
  data: Prisma.MessageUpdateInput
) {
  return db.message.update({
    where: {
      id,
    },

    data: {
      ...data,
      edited: true,
      editedAt: new Date(),
    },

    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },

      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
      },

      attachments: true,

      reactions:{
    include:{
        user:{
            select:{
                id:true,
                name:true,
                image:true,
            }
        }
    }
},

      reads: {
        select: {
          userId: true,
          seenAt: true,
        },
      },
    },
  });
}

export async function deleteMessage(
  messageId: string
) {
  return db.message.update({
    where: {
      id: messageId,
    },

    data: {
      deleted: true,
      deletedAt: new Date(),
      content: null,
    },

    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },

      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
        },
      },

      attachments: true,

      reactions:{
          include:{
              user:{
                  select:{
                      id:true,
                      name:true,
                      image:true,
                  }
              }
          }
      },

      reads: true,
    },
  });
}

export async function markMessageAsRead(
  messageId: string,
  userId: string
) {
  return db.messageRead.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },

    create: {
      messageId,
      userId,
    },

    update: {
      seenAt: new Date(),
    },
  });
}



export async function updateConversationLastMessage(
  conversationId: string,
  messageId: string
) {
  return db.conversation.update({
    where: {
      id: conversationId,
    },

    data: {
      lastMessageId: messageId,
      lastMessageAt: new Date(),
    },
  });
}



export async function createAttachmentMessage(
  dto: {
    conversationId: string;
    senderId: string;
    replyToId?: string;
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
    publicId: string;
  }
) {

  const messageType: MessageType =
    dto.mimeType.startsWith("image/")
      ? MessageType.IMAGE
      : dto.mimeType.startsWith("video/")
      ? MessageType.VIDEO
      : dto.mimeType.startsWith("audio/")
      ? MessageType.AUDIO
      : MessageType.FILE;

  

  const data: Prisma.MessageCreateInput = {
  sender: {
    connect: {
      id: dto.senderId,
    },
  },

  conversation: {
    connect: {
      id: dto.conversationId,
    },
  },

  type: messageType,

  attachments: {
    create: {
      url: dto.url,
      publicId: dto.publicId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
    },
  },
};

if (dto.replyToId) {
  data.replyTo = {
    connect: {
      id: dto.replyToId,
    },
  };
}

return db.message.create({
  data,
  include: {
    sender: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },

    replyTo: {
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        attachments: true,
      },
    },

    attachments: true,

    reads: {
      select: {
        userId: true,
        seenAt: true,
      },
    },

    reactions:{
        include:{
            user:{
                select:{
                    id:true,
                    name:true,
                    image:true,
                }
            }
        }
    }
  },
});
}

export async function createReaction(
  messageId:string,
  userId:string,
  emoji:string
){
  return db.messageReaction.create({
   data:{
    message:{
      connect:{
        id:messageId,
      }

    },
    user:{
      connect:{
        id:userId,
      }
    },
    emoji,

   },

  })
}

export  async function deleteReaction(
  id:string
){
  return db.messageReaction.delete(
    {
      where:{
        id,
      }
    }
  )
}

export async function findReaction(

  messageId: string,

  userId: string,

  emoji: string,

) {

  return db.messageReaction.findUnique({

    where: {

      messageId_userId_emoji: {

        messageId,

        userId,

        emoji,

      },

    },

  });

}

export async function getMessageWithRelations(

  messageId: string,

) {

  return db.message.findUnique({

    where: {

      id: messageId,

    },

    include: {

      sender: {

        select: {

          id: true,

          name: true,

          image: true,

        },

      },

      replyTo: {

        include: {

          sender: {

            select: {

              id: true,

              name: true,

              image: true,

            },

          },

          attachments: true,

        },

      },

      attachments: true,

      reads: {

        select: {

          userId: true,

          seenAt: true,

        },

      },

      reactions:{
          include:{
              user:{
                  select:{
                      id:true,
                      name:true,
                      image:true,
                  }
              }
          }
      }

    },

  });

}