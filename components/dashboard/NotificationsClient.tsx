"use client";

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  CheckSquare,
  Mail,
  Sparkles,
  Info,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type NotificationsClientProps = {
  initialNotifications: NotificationItem[];
  workspaceId?: string;
};

export default function NotificationsClient({
  initialNotifications,
  workspaceId,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "tasks" | "messages">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Notifications cleared");
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "tasks") return n.type.includes("TASK");
    if (filter === "messages") return n.type.includes("MESSAGE") || n.type.includes("MENTION");
    return true;
  });

  const getNotificationIcon = (type: string) => {
    if (type.includes("TASK")) {
      return <CheckSquare className="w-4 h-4 text-emerald-500" />;
    }
    if (type.includes("MESSAGE") || type.includes("MENTION")) {
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
    if (type.includes("INVITE")) {
      return <Mail className="w-4 h-4 text-amber-500" />;
    }
    return <Info className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Activity Center
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Notifications
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay updated with workspace task assignments, team chats, and mentions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="gap-1.5 text-xs h-8"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAll}
              className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
            filter === "all"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
            filter === "unread"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter("tasks")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
            filter === "tasks"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Tasks
        </button>

        <button
          type="button"
          onClick={() => setFilter("messages")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
            filter === "messages"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Messages
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No notifications found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {filter === "unread"
              ? "You're all caught up! No unread notifications right now."
              : "Activity will show up here when teammates assign tasks or message you."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notification) => {
            const dateStr = new Date(notification.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4",
                  notification.isRead
                    ? "border-border/60 bg-card/50 hover:bg-card text-muted-foreground"
                    : "border-primary/30 bg-primary/5 hover:bg-primary/10 shadow-xs"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          notification.isRead ? "font-medium text-foreground" : "font-semibold text-foreground"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {notification.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {notification.body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground/80">
                      <Clock className="w-3 h-3" />
                      <span>{dateStr}</span>
                      {notification.sender?.name && (
                        <span>• From {notification.sender.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="text-[11px] font-medium text-primary hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
