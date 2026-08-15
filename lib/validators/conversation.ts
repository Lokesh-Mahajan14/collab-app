import { z } from "zod";

export const createConversationSchema = z.object({

    workspaceId:z.string().min(1),

    memberIds:z.array(z.string()),

    name:z.string().optional(),

    description:z.string().optional(),

    type:z.enum([
        "DIRECT",
        "GROUP",
        "CHANNEL",
        "PRIVATE_CHANNEL"
    ])

}).superRefine((value, ctx) => {
    if (value.type === "DIRECT" && value.memberIds.length !== 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["memberIds"],
            message: "Direct conversations require exactly one selected user.",
        });
    }

    if (value.type !== "DIRECT" && value.memberIds.length < 1) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["memberIds"],
            message: "Select at least one member.",
        });
    }
});

export const renameConversationSchema = z.object({
    workspaceId: z.string().min(1),
    conversationId: z.string().min(1),
    name: z.string().trim().max(120),
});

export const deleteConversationSchema = z.object({
    workspaceId: z.string().min(1),
    conversationId: z.string().min(1),
});