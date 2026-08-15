"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Sparkles, MessageSquare, Loader2 } from "lucide-react";

import MessageBubble from "./ChatMessageBubble";
import { useSocket } from "./ChatSocketProvider";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "./ChatContext";
import {
  getOlderMessagesAction,
  markMessagesBatchAction,
} from "../../features/message/action";
import { MessageReadDTO } from "@/types/message";
import { cn } from "@/lib/utils";

interface Props {
  currentUserId: string;
  conversationId: string;
}

export default function ChatMessagesClient({
  currentUserId,
  conversationId,
}: Props) {
  const socket = useSocket();
  const { messages, setMessages, hasMore, setHasMore } = useChat();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readMessagesRef = useRef(new Set<string>());
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const hasInitialScrollRef = useRef(false);

  // Debounced batch read receipt refs
  const pendingReadBatchRef = useRef<string[]>([]);
  const readBatchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const oldestMessageId = messages[0]?.id;

  const messagesById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  const firstUnreadId = useMemo(() => {
    return messages.find(
      (message) =>
        message.senderId !== currentUserId &&
        !message.reads?.some(
          (read: MessageReadDTO) => read.userId === currentUserId,
        ),
    )?.id;
  }, [messages, currentUserId]);

  // Flush batched read receipts in one single server action & socket emission
  const flushPendingReads = useCallback(() => {
    if (!pendingReadBatchRef.current.length) return;

    const idsToMark = [...pendingReadBatchRef.current];
    pendingReadBatchRef.current = [];

    // Single batch server action (1 HTTP request instead of 30)
    void markMessagesBatchAction(idsToMark);

    // Socket emission for the batch
    for (const msgId of idsToMark) {
      socket.emit("message_read", {
        messageId: msgId,
        conversationId,
        userId: currentUserId,
      });
    }
  }, [conversationId, currentUserId, socket]);

  useEffect(() => {
    return () => {
      if (readBatchTimeoutRef.current) {
        clearTimeout(readBatchTimeoutRef.current);
      }
      flushPendingReads();
    };
  }, [flushPendingReads]);

  // WhatsApp-style scroll-up pagination with scroll height compensation
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !oldestMessageId) return;

    setIsLoadingMore(true);
    const container = containerRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;
    const previousScrollTop = container ? container.scrollTop : 0;

    try {
      const response = await getOlderMessagesAction(conversationId, oldestMessageId, 30);
      const olderMessages = response.messages;
      const moreAvailable = response.hasMore;

      if (olderMessages && olderMessages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = olderMessages.filter((m: any) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });
        setHasMore(moreAvailable);

        // Compensate scroll position: preserve user's view on the same message
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
          }
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, oldestMessageId, conversationId, setMessages, setHasMore]);

  // Scroll listener for top-threshold pagination
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 80 && hasMore && !isLoadingMore) {
        void loadMore();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [loadMore, hasMore, isLoadingMore]);

  // Initial scroll to bottom or first unread
  useEffect(() => {
    if (hasInitialScrollRef.current || !messages.length) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    hasInitialScrollRef.current = true;

    if (firstUnreadId) {
      const targetNode = messageRefs.current.get(firstUnreadId);
      if (targetNode) {
        targetNode.scrollIntoView({ behavior: "auto", block: "center" });
        return;
      }
    }

    // Scroll to bottom on first load
    container.scrollTop = container.scrollHeight;
  }, [firstUnreadId, messages]);

  // IntersectionObserver for marking visible messages as read with batch debouncing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let hasNewReads = false;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const messageId = entry.target.getAttribute("data-message-id");
          if (!messageId || readMessagesRef.current.has(messageId)) return;

          const message = messagesById.get(messageId);
          if (!message || message.senderId === currentUserId) return;

          readMessagesRef.current.add(messageId);
          pendingReadBatchRef.current.push(messageId);
          hasNewReads = true;

          setMessages((prev) =>
            prev.map((item) =>
              item.id === messageId
                ? {
                    ...item,
                    reads: [
                      ...(item.reads ?? []),
                      {
                        userId: currentUserId,
                        seenAt: new Date(),
                      },
                    ],
                  }
                : item,
            ),
          );
        });

        if (hasNewReads) {
          if (readBatchTimeoutRef.current) {
            clearTimeout(readBatchTimeoutRef.current);
          }
          readBatchTimeoutRef.current = setTimeout(flushPendingReads, 300);
        }
      },
      {
        root: container,
        threshold: 0.6,
      },
    );

    messageRefs.current.forEach((node) => {
      observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [messagesById, currentUserId, flushPendingReads, setMessages]);

  // Socket event listeners
  useEffect(() => {
    socket.emit("join_conversation", conversationId);

    socket.on("receive_message", (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });

        // Auto-scroll down if close to bottom
        const container = containerRef.current;
        if (container) {
          const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 200;
          if (isNearBottom || message.senderId === currentUserId) {
            requestAnimationFrame(() => {
              container.scrollTop = container.scrollHeight;
            });
          }
        }
      }
    });

    socket.on("message_edited", (updatedMessage) => {
      if (updatedMessage.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === updatedMessage.id ? { ...item, ...updatedMessage } : item,
          ),
        );
      }
    });

    socket.on("message_deleted", (deletedMessage) => {
      if (deletedMessage.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === deletedMessage.id ? { ...item, deleted: true, content: null } : item,
          ),
        );
      }
    });

    socket.on("message_read_update", ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== messageId) return item;
          const currentReads = item.reads ?? [];
          const alreadyMarked = currentReads.some(
            (read: MessageReadDTO) => read.userId === userId,
          );
          if (alreadyMarked) return item;

          return {
            ...item,
            reads: [
              ...currentReads,
              {
                userId,
                seenAt: new Date(),
              },
            ],
          };
        }),
      );
    });

    socket.on("user_typing", (user) => {
      if (!user?.name) return;
      setTypingUsers((prev) => (prev.includes(user.name) ? prev : [...prev, user.name]));
    });

    socket.on("user_stop_typing", (userName) => {
      if (!userName) return;
      setTypingUsers((prev) => prev.filter((name) => name !== userName));
    });

    return () => {
      socket.emit("leave_conversation", conversationId);
      socket.off("receive_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("message_read_update");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [conversationId, currentUserId, socket, setMessages]);

  const registerMessageRef = useCallback(
    (messageId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        messageRefs.current.set(messageId, node);
      } else {
        messageRefs.current.delete(messageId);
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 flex flex-col bg-background/50"
    >
      <div className="flex-1 flex flex-col justify-end space-y-4">
        {/* Loading Spinner for Older Messages */}
        {isLoadingMore && (
          <div className="py-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Loading older messages...</span>
          </div>
        )}

        {/* History Boundary Divider */}
        {!hasMore && messages.length > 0 && (
          <div className="py-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-muted-foreground text-[11px] font-medium border border-border/40">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>This is the beginning of the conversation history.</span>
            </div>
          </div>
        )}

        {/* Start of Conversation Empty State */}
        {messages.length === 0 && !isLoadingMore && (
          <div className="my-auto py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Start the conversation</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Send a message, share files, or assign tasks to collaborate in real time with your team.
            </p>
          </div>
        )}

        {/* Messages List */}
        <div className="space-y-3 mt-auto">
          {messages.map((message) => (
            <Fragment key={message.id}>
              {message.id === firstUnreadId && (
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Unread Messages
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              <div ref={registerMessageRef(message.id)} data-message-id={message.id}>
                <MessageBubble message={message} currentUserId={currentUserId} />
              </div>
            </Fragment>
          ))}
        </div>

        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
