"use client";

import { useMemo } from "react";

import { MessageReactionDTO } from "@/types/message";

interface Props {
  currentUserId: string;

  reactions: MessageReactionDTO[];

  onReact: (emoji: string) => void;
}

export default function ReactionBar({
  currentUserId,
  reactions,
  onReact,
}: Props) {
  const grouped = useMemo(() => {
    return reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }

        acc[reaction.emoji].push(reaction);

        return acc;
      },
      {} as Record<string, MessageReactionDTO[]>,
    );
  }, [reactions]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.entries(grouped).map(([emoji, list]) => {
        const reacted = list.some(
          (reaction) => reaction.userId === currentUserId,
        );

        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition ${
              reacted ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <span>{emoji}</span>

            <span>{list.length}</span>
          </button>
        );
      })}
    </div>
  );
}