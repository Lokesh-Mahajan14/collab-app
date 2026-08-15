import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  deleteMessageAction,
  editMessageAction,
  toggleReactionAction,
} from "@/features/message/action";
import { socket } from "@/lib/socket-client";
import { ChatMessage } from "@/types/message";
import { useState } from "react";
import MessageActions from "./MessageActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import { useChat } from "./ChatContext";
import ReactionBar from "./ReactionBar";

interface Props {
  message: ChatMessage;

  currentUserId: string;
}

export default function MessageBubble({ message, currentUserId }: Props) {
  const own = message.senderId === currentUserId;
  const readCount = message.reads?.length ?? 0;

  const [editing, setEditing] = useState(false);

  const [value, setValue] = useState(message.content ?? "");

  const { setReplyingTo, setMessages } = useChat();

  async function handleEdit() {
    const result = await editMessageAction(message.id, value);

    if (!result.success || !result.data) {
      return;
    }

    socket.emit("edit_message", message.conversationId, result.data);

    setEditing(false);
  }

  async function handleDelete() {
    const result = await deleteMessageAction(message.id);

    if (!result.success || !result.data) {
      return;
    }

    socket.emit("delete_message", message.conversationId, result.data);
  }

  async function handleReaction(emoji: string) {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== message.id) return msg;

        const currentReactions = msg.reactions ?? [];
        const alreadyReacted = currentReactions.some(
          (reaction: { userId: string; emoji: string }) =>
            reaction.userId === currentUserId && reaction.emoji === emoji,
        );

        return {
          ...msg,
          reactions: alreadyReacted
            ? currentReactions.filter(
                (reaction: { userId: string; emoji: string }) =>
                  !(reaction.userId === currentUserId && reaction.emoji === emoji),
              )
            : [
                ...currentReactions,
                {
                  id: crypto.randomUUID(),
                  userId: currentUserId,
                  emoji,
                  user: {
                    id: currentUserId,
                    name: null,
                    image: null,
                  },
                },
              ],
        };
      }),
    );

    socket.emit("reaction", {
      conversationId: message.conversationId,
      messageId: message.id,
      userId: currentUserId,
      emoji,
    });

    await toggleReactionAction({
      messageId: message.id,
      emoji,
    });
  }

  const [open, setOpen] = useState(false);

  function renderReplyPreview() {

  if (!message.replyTo) return null;

  const attachment =
    message.replyTo.attachments?.[0];

  return (

    <div
      className="
        mb-2
        rounded-lg
        border-l-4
        border-primary
        bg-muted/50
        p-2
      "
    >

      <p className="font-semibold text-xs">
        {message.replyTo.sender.name}
      </p>

      {attachment ? (

        attachment.mimeType.startsWith("image/") ? (

          <div className="flex items-center gap-2">

            <img
              src={attachment.url}
              className="
                h-12
                w-12
                rounded
                object-cover
              "
              alt=""
            />

            <span className="text-xs">
              Photo
            </span>

          </div>

        ) : (

          <div className="flex items-center gap-2">

            📄

            <span className="text-xs">
              {attachment.fileName}
            </span>

          </div>

        )

      ) : (

        <p className="text-xs">
          {message.replyTo.content}
        </p>

      )}

    </div>

  );

}

  function renderMessageContent() {

  if (message.type === "TEXT") {
    return message.content;
  }

  const attachment =
    message.attachments?.[0];

  if (!attachment) {
    return null;
  }

  const isImage =
    attachment.mimeType.startsWith(
      "image/"
    );

  if (isImage) {

    return (
      <>
        <img
          src={attachment.url}
          alt={attachment.fileName}
          onClick={() =>
            setOpen(true)
          }
          className="
            max-w-100
            rounded-xl
            cursor-pointer
            object-cover
            transition
            hover:opacity-90
          "
        />

        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogContent
            className="
              max-w-5xl
              border-none
              bg-transparent
              shadow-none
            "
          >
            <DialogTitle className="sr-only">
              Image preview
            </DialogTitle>

            <DialogDescription className="sr-only">
              Full-size preview of {attachment.fileName}
            </DialogDescription>

            <img
              src={attachment.url}
              alt={attachment.fileName}
              className="
                max-h-[90vh]
                w-auto
                rounded-lg
                mx-auto
              "
            />

            <a
              href={`/api/upload/${attachment.id}/download`}
              className="
                mx-auto
                block
                w-fit
                rounded-md
                border
                bg-background/90
                px-3
                py-1.5
                text-sm
                font-medium
                hover:bg-background
              "
            >
              Download image
            </a>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <a
      href={`/api/upload/${attachment.id}/download`}
      className="
        flex
        items-center
        gap-3
        rounded-lg
        border
        p-3
        hover:bg-muted
      "
    >
      <div className="text-3xl">
        📄
      </div>

      <div>
        <p className="font-medium">
          {attachment.fileName}
        </p>

        <p
          className="
            text-xs
            text-muted-foreground
          "
        >
          Download file
        </p>
      </div>
    </a>
  );
}
  return (
    <div className={`flex mb-3 ${own ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[80%] items-end gap-2 ${
          own ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <Avatar size="sm" className="mb-0.5">
          <AvatarFallback>
            {(message.sender.name ?? "U").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <p
            className={`text-xs text-muted-foreground ${own ? "text-right" : "text-left"}`}
          >
            {message.sender.name ?? "Unknown"}
          </p>

          <div
            className={`relative rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm ${
              own
                ? "bg-primary text-primary-foreground"
                : "border border-border/70 bg-card text-foreground"
            }`}
          >
            {!editing && !message.deleted && (
              <div className="absolute right-2 top-2">
                <MessageActions
                  canEdit={own}
                  canDelete={own}
                  onEdit={own ? () => setEditing(true) : undefined}
                  onDelete={own ? handleDelete : undefined}
                  onReply={() => setReplyingTo(message)}
                  onReact={handleReaction}
                />
              </div>
            )}

            {editing ? (
              <div className="space-y-2 pr-8">
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="
          w-full
          rounded
          border
          p-2
          text-white
        "
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="
            rounded
            bg-blue-500
            px-2
            py-1
            text-white
          "
                  >
                    Save
                  </button>

                  <button
                    onClick={() => setEditing(false)}
                    className="
            rounded
            border
            px-2
            py-1
          "
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : message.deleted ? (
              <p className="italic text-muted-foreground pr-6">
                This message was deleted.
              </p>
            ) : (
              <>
                {renderReplyPreview()}

                <div className="pr-6">{renderMessageContent()}</div>
              </>
            )}
          </div>

          {(message.reactions?.length ?? 0) > 0 && !message.deleted && (
            <div className={`mt-2 flex ${own ? "justify-end" : "justify-start"}`}>
              <ReactionBar
                currentUserId={currentUserId}
                reactions={message.reactions ?? []}
                onReact={handleReaction}
              />
            </div>
          )}

          {message.pending && (
            <p className="text-xs text-yellow-500">Sending...</p>
          )}

          <div className="flex flex-row justify-between">
            <p
              suppressHydrationWarning
              className="text-[11px] text-muted-foreground"
            >
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
              
              {message.edited && <span className="ml-1">(edited)</span>}
            </p>
            
            {own && (
              <p className="text-[11px] text-muted-foreground">
                {readCount > 0 ? "✓✓ " : "✓ "}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
