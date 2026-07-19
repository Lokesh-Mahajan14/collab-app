"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
//import { useRouter } from "next/navigation";
import { SendHorizontal } from "lucide-react";

import {
  createAttachmentMessageAction,
  createMessageAction,
} from "../../features/message/action";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { socket } from "@/lib/socket-client";
import { useRef } from "react";
import { useChat } from "./ChatContext";
import FileUploadButton from "./FileUploadButton";
import { CreateAttachmentDTO } from "@/types/message";
import AttachmentPreview from "./AttachmentPreview";

interface Props {
  conversationId: string;
  currentUser: {
    id: string;
    name: string | null;
  };
}

export default function ChatInput({ conversationId, currentUser }: Props) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const [attachment, setAttachment] = useState<CreateAttachmentDTO | null>(
    null,
  );

  const { replyingTo, setReplyingTo } = useChat();

  //const router = useRouter();
  const { setMessages } = useChat();

  async function handleSend() {
    if (!content.trim() && !attachment) {
      return;
    }

    const tempId = crypto.randomUUID();
    const replyToId = replyingTo?.id;

    const replyPreview = replyingTo
      ? {
          id: replyingTo.id,
          content: replyingTo.content,
          sender: {
            id: replyingTo.sender.id,
            name: replyingTo.sender.name,
          },
          attachments: replyingTo.attachments,
        }
      : null;

    // IMAGE / FILE MESSAGE
    if (attachment) {
      const optimisticMessage = {
        id: tempId,

        conversationId,

        senderId: currentUser.id,

        sender: {
          id: currentUser.id,
          name: currentUser.name,
          image: null,
        },

        content: content || null,

        replyTo: replyPreview,

        type: attachment.mimeType.startsWith("image/") ? "IMAGE" : "FILE",

        attachments: [attachment],

        createdAt: new Date(),

        pending: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      setContent("");
      setAttachment(null);
      setReplyingTo(null);

      console.log("replyToId =", replyToId);

      startTransition(async () => {
        const result = await createAttachmentMessageAction({
          conversationId,

          url: attachment.url,

          publicId: attachment.publicId,

          fileName: attachment.fileName,

          mimeType: attachment.mimeType,

          size: attachment.size,

          ...(replyToId && { replyToId }),
        });

        if (!result.success || !result.data) {
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

          return;
        }

        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? result.data : msg)),
        );

        socket.emit(
          "send_message",

          conversationId,

          result.data,
        );
      });

      return;
    }

    // NORMAL TEXT MESSAGE
    const messageContent = content;

    const optimisticMessage = {
      id: tempId,

      conversationId,

      senderId: currentUser.id,

      sender: {
        id: currentUser.id,
        name: currentUser.name,
        image: null,
      },

      content: messageContent,

      replyTo: replyPreview,

      type: "TEXT",

      createdAt: new Date(),

      attachments: [],

      reads: [],

      reactions: [],

      edited: false,

      deleted: false,

      deletedAt: null,

      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    setContent("");
    setReplyingTo(null);

    console.log("replyToId =", replyToId);

    startTransition(async () => {
      const payload = {
    conversationId,
    content: messageContent,
    type: "TEXT",
    ...(replyToId && { replyToId }),
};

console.log(payload);

const result = await createMessageAction(payload);

      if (!result.success || !result.data) {
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

        return;
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? result.data : msg)),
      );

      socket.emit(
        "send_message",

        conversationId,

        result.data,
      );
    });
  }
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="border-t border-border/70 bg-background/95 px-4 py-3">
      {attachment && (
    <AttachmentPreview
      attachment={attachment}
      onRemove={() => setAttachment(null)}
    />
  )}
  {replyingTo && (

  <div
    className="
      mb-2
      rounded-lg
      border
      bg-muted
      p-2
    "
  >

    <div
      className="
        flex
        items-center
        justify-between
      "
    >

      <div>

        <p
          className="
            text-xs
            font-semibold
          "
        >
          Replying to 
          {
             replyingTo.sender.name
          }
        </p>

        <div>
  

  {replyingTo.content ? (
    <p className="text-sm truncate">
      {replyingTo.content}
    </p>
  ) : replyingTo.attachments?.length ? (
    replyingTo.attachments[0].mimeType.startsWith("image/") ? (
      <div className="flex items-center gap-2">
        <img
          src={replyingTo.attachments[0].url}
          className="h-10 w-10 rounded object-cover"
          alt=""
        />
        <span>Photo</span>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        📄
        <span>{replyingTo.attachments[0].fileName}</span>
      </div>
    )
  ) : null}
</div>

      </div>

      <button
        onClick={() =>
          setReplyingTo(null)
        }
      >
        ✕
      </button>

    </div>

  </div>

)}

      <div className="mx-auto flex w-full max-w-4xl items-end gap-2">
        <FileUploadButton
          onUploaded={(file) => {
            setAttachment(file);
          }}
        />

        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);

            socket.emit("typing", conversationId, {
              id: currentUser.id,
              name: currentUser.name,
            });

            if (typingTimeout.current) {
              clearTimeout(typingTimeout.current);
            }

            typingTimeout.current = setTimeout(() => {
              socket.emit("stop_typing", conversationId, currentUser.name);
            }, 1000);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className="max-h-32 min-h-10 resize-none"
        />

        <Button
          onClick={handleSend}
          disabled={isPending || (
    !content.trim() &&
    !attachment
  ) }
          className="gap-1.5"
        >
          <SendHorizontal className="h-4 w-4" />
          {isPending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
