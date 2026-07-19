"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, MessageCircle, MessageSquarePlus, Users } from "lucide-react";

import { createConversationaction }
from "../../features/conversation/action";

import { getWorkspaceMembersAction }
from "../../features/workspace/action";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string;
  currentUserId: string;
}

type WorkspaceMember = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function CreateConversationForm({
  workspaceId,
  currentUserId,
}: Props) {

  const router = useRouter();

  const [name, setName] = useState("");

  const [type, setType] = useState<
    "DIRECT" | "GROUP" | "CHANNEL"
  >("DIRECT");

  const [members, setMembers] =
    useState<WorkspaceMember[]>([]);

  const [memberIds, setMemberIds] =
    useState<string[]>([]);

  useEffect(() => {
    async function loadMembers() {
      const data =
        await getWorkspaceMembersAction(
          workspaceId
        );

      setMembers(data);
    }

    loadMembers();
  }, [workspaceId]);

  function toggleMember(
    userId: string
  ) {
    if (type === "DIRECT") {
      setMemberIds((prev) =>
        prev.includes(userId) ? [] : [userId]
      );
      return;
    }

    setMemberIds((prev) => {

      if (prev.includes(userId)) {
        return prev.filter(
          (id) => id !== userId
        );
      }

      return [...prev, userId];
    });
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (type === "DIRECT" && memberIds.length !== 1) {
      alert("Select exactly one user for a direct message.");
      return;
    }

    if (type !== "DIRECT" && !name.trim()) {
      alert("Conversation name is required.");
      return;
    }

    const result =
      await createConversationaction({
        workspaceId,
        name: type === "DIRECT" ? undefined : name,
        memberIds,
        type,
      });

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.push(
      `/workspace/${workspaceId}/chat/${result.data.id}`
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
            Create conversation
          </CardTitle>
          <CardDescription>
            Start a direct message or create a group/channel discussion.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {type !== "DIRECT" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Conversation name
                </label>
                <Input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Design sprint sync"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Type
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("DIRECT");
                    setName("");
                    if (memberIds.length > 1) {
                      setMemberIds([]);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    type === "DIRECT"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                  Direct
                </button>

                <button
                  type="button"
                  onClick={() => setType("GROUP")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    type === "GROUP"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Group
                </button>

                <button
                  type="button"
                  onClick={() => setType("CHANNEL")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                    type === "CHANNEL"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Hash className="h-4 w-4" />
                  Channel
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {type === "DIRECT" ? "Choose one teammate" : "Members"}
              </p>

              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-2">
                {members
                  .filter((member) => member.user.id !== currentUserId)
                  .map((member) => (
                  <label
                    key={member.user.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={memberIds.includes(
                        member.user.id
                      )}
                      onChange={() =>
                        toggleMember(
                          member.user.id
                        )
                      }
                      className="h-4 w-4 rounded border-border"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {member.user.name ?? "Unnamed member"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                type === "DIRECT"
                  ? memberIds.length !== 1
                  : !name.trim() || memberIds.length < 1
              }
            >
              {type === "DIRECT" ? "Start direct message" : "Create conversation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}