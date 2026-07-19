"use client";

import { useState } from "react";

import EmojiPicker from "emoji-picker-react";

interface Props {
  onEdit?: () => void;
  onDelete?: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function MessageActions({
  onEdit,
  onDelete,
  onReply,
  onReact,
  canEdit = true,
  canDelete = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  function closeMenu() {
    setOpen(false);
    setShowReactionPicker(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded px-2 py-1 text-xs hover:bg-muted"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-md border bg-background shadow-md">
          {showReactionPicker ? (
            <div className="space-y-2 p-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Choose a reaction
                </p>

                <button
                  onClick={() => setShowReactionPicker(false)}
                  className="rounded px-2 py-1 text-xs hover:bg-muted"
                >
                  Back
                </button>
              </div>

              <div className="overflow-hidden rounded-md border">
                <EmojiPicker
                  lazyLoadEmojis
                  searchDisabled={false}
                  onEmojiClick={(emojiData) => {
                    onReact(emojiData.emoji);
                    closeMenu();
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {canEdit && onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    closeMenu();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-black hover:bg-muted"
                >
                  Edit
                </button>
              )}

              {canDelete && onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    closeMenu();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-muted"
                >
                  Delete
                </button>
              )}

              <button
                className="w-full px-3 py-2 text-left text-sm text-black hover:bg-muted"
                onClick={() => {
                  onReply();
                  closeMenu();
                }}
              >
                Reply
              </button>

              <button
                className="w-full px-3 py-2 text-left text-sm text-black hover:bg-muted"
                onClick={() => setShowReactionPicker(true)}
              >
                Reaction
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
