import { z } from "zod";
import { MessageType } from "@prisma/client";

export const createMessageSchema = z.object({
  conversationId: z.string().min(1),

  content: z.string().optional(),

  type: z.nativeEnum(MessageType),

  replyToId: z.string().optional(),
});

// features/attachment/schema.ts



export const
createAttachmentSchema =
z.object({

  conversationId:
    z.string().min(1),

  url:
    z.string().url(),

  fileName:
    z.string(),

  mimeType:
    z.string(),

  size:
    z.number(),

  publicId:
    z.string(),

  replyToId:
    z.string().optional(),

});

export const toggleReactionSchema = z.object({

  messageId: z.string().cuid(),

  emoji: z
    .string()
    .min(1)
    .max(10),

});