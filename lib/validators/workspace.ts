import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(80, "Workspace name is too long"),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
