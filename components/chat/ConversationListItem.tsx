"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Hash,
  Lock,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ConversationDTO } from "@/types/conversation";
import {
  deleteConversationAction,
  renameConversationAction,
} from "@/features/conversation/action";
import { useConversation } from "./ConversationContext";

interface Props {
  conversation: ConversationDTO;
  workspaceId: string;
  currentUserId: string;
}

function renderLastMessage(message: ConversationDTO["lastMessage"]) {
  if (!message) return "No messages yet";

  switch (message.type) {
    case "TEXT":
      return `${message.sender.name ?? "Unknown"}: ${message.content}`;

    case "IMAGE":
      return `${message.sender.name ?? "Unknown"}: 📷 Photo`;

    case "FILE":
      return `${message.sender.name ?? "Unknown"}: 📄 ${
        message.attachments[0]?.fileName ?? "File"
      }`;

    default:
      return `${message.sender.name ?? "Unknown"}: Message`;
  }
}

export default function ConversationListItem({
  conversation,
  workspaceId,
  currentUserId,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { setConversations } = useConversation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState(conversation.name ?? "");
  const [pendingAction, setPendingAction] = useState<
    "rename" | "delete" | null
  >(null);

  const isActive = pathname.includes(conversation.id);
  const memberCount = conversation.members?.length ?? 0;
  const isChannel = conversation.type === "CHANNEL";
  const isPrivateChannel = conversation.type === "PRIVATE_CHANNEL";

  const ConversationIcon = isChannel
    ? Hash
    : isPrivateChannel
      ? Lock
      : Users;

  const directPeer =
    conversation.type === "DIRECT"
      ? conversation.members?.find(
          (member) => member.userId !== currentUserId,
        )
      : null;

  const displayName =
    conversation.name ??
    (conversation.type === "DIRECT"
      ? directPeer?.user?.name ?? "Direct message"
      : "Untitled conversation");

  async function handleRename() {
    const nextName = draftName.trim();

    if (!nextName && conversation.type !== "DIRECT") {
      toast.error("Conversation name is required.");
      return;
    }

    setPendingAction("rename");

    try {
      const result = await renameConversationAction({
        conversationId: conversation.id,
        workspaceId,
        name: nextName,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setConversations((prev) =>
        prev.map((item) =>
          item.id === result.data.id ? result.data : item,
        ),
      );

      setRenameOpen(false);
      toast.success("Conversation renamed.");
      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    setPendingAction("delete");

    try {
      const result = await deleteConversationAction({
        conversationId: conversation.id,
        workspaceId,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setConversations((prev) =>
        prev.filter((item) => item.id !== conversation.id),
      );

      setDeleteOpen(false);
      toast.success("Conversation deleted.");

      if (isActive) {
        router.push(`/workspace/${workspaceId}/chat`);
      }

      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div
      className={cn(
        "group rounded-xl border border-transparent px-3 py-2.5 transition-all",
        "hover:border-border/70 hover:bg-muted/60",
        isActive && "border-border bg-muted",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Link
          href={`/workspace/${workspaceId}/chat/${conversation.id}`}
          prefetch={true}
          className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg outline-none"
        >
          <div
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground",
              isActive && "bg-primary text-primary-foreground",
            )}
          >
            <ConversationIcon className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{memberCount} members</span>

                  <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/60" />

                  <Badge
                    variant="outline"
                    className="h-4 rounded-full px-1.5 text-[10px]"
                  >
                    {conversation.type.replace("_", " ")}
                  </Badge>
                </div>

                <p className="truncate text-xs text-muted-foreground">
                  {renderLastMessage(conversation.lastMessage)}
                </p>
              </div>

              {conversation.unreadCount > 0 && (
                <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-2xs">
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                menuOpen && "opacity-100",
              )}
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-48 p-1.5">
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start gap-2 px-2.5"
              onClick={() => {
                setMenuOpen(false);
                setDraftName(conversation.name ?? "");
                setRenameOpen(true);
              }}
            >
              <PencilLine className="h-4 w-4" />
              Rename conversation
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start gap-2 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete conversation
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Update the label shown in the sidebar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">Conversation name</label>
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={
                conversation.type === "DIRECT"
                  ? "Optional display name"
                  : "Conversation name"
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={pendingAction !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={pendingAction !== null}
              className="gap-2"
            >
              {pendingAction === "rename" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              This permanently removes the conversation and its messages.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={pendingAction !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={pendingAction !== null}
              className="gap-2"
            >
              {pendingAction === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Delete conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}