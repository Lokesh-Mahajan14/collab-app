import crypto from "crypto";
import { cache } from "react";

import { db } from "@/lib/db";
import { getCached, setCached } from "@/lib/redis";

export type WorkspaceSidebarItem = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  memberCount: number;
  unreadMessageCount: number;
};

export const getWorkspaceSidebarItems = cache(
  async (userId: string): Promise<WorkspaceSidebarItem[]> => {
    const cacheKey = `user:${userId}:sidebar_items`;
    const cached = await getCached<WorkspaceSidebarItem[]>(cacheKey);
    if (cached) return cached;

    const memberships = await db.workspaceMember.findMany({
    where: { userId },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          _count: {
            select: { members: true },
          },
          conversations: {
            where: {
              members: {
                some: { userId },
              },
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const allConversationIds: string[] = [];
  const workspaceConversationMap = new Map<string, string[]>();

  for (const membership of memberships) {
    const convIds = membership.workspace.conversations.map((c) => c.id);
    workspaceConversationMap.set(membership.workspace.id, convIds);
    allConversationIds.push(...convIds);
  }

  const unreadCountByConv = new Map<string, number>();

  if (allConversationIds.length > 0) {
    const unreadGroups = await db.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: allConversationIds },
        senderId: { not: userId },
        deleted: false,
        reads: {
          none: {
            userId,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    for (const group of unreadGroups) {
      unreadCountByConv.set(group.conversationId, group._count.id);
    }
  }

    const items = memberships.map((membership) => {
      const convIds = workspaceConversationMap.get(membership.workspace.id) ?? [];
      let unreadMessageCount = 0;
      for (const id of convIds) {
        unreadMessageCount += unreadCountByConv.get(id) ?? 0;
      }

      return {
        id: membership.workspace.id,
        name: membership.workspace.name,
        role: membership.role,
        memberCount: membership.workspace._count.members,
        unreadMessageCount,
      };
    });

    await setCached(cacheKey, items, 30);
    return items;
  }
);

export function createWorkspaceSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "workspace"}-${suffix}`;
}

export function createInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}
