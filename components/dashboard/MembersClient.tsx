"use client";

import { useState } from "react";
import { Users, Mail, UserPlus, Shield, ShieldCheck, UserCheck, Clock, Search, MoreVertical, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    status: string;
  };
};

type Invite = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

type MembersClientProps = {
  workspaceId: string;
  workspaceName: string;
  members: Member[];
  invites: Invite[];
  isOwnerOrAdmin: boolean;
  currentUserId: string;
};

export default function MembersClient({
  workspaceId,
  workspaceName,
  members: initialMembers,
  invites: initialInvites,
  isOwnerOrAdmin,
  currentUserId,
}: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email address is required");
      return;
    }

    setIsInviting(true);

    try {
      const response = await api.post(`/workspaces/${workspaceId}/invites`, {
        email: inviteEmail,
      });

      const inviteData = response.data as {
        inviteLink?: string;
        emailDelivered?: boolean;
        emailWarning?: string;
      };

      if (inviteData.inviteLink && typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(inviteData.inviteLink);
        } catch {
          // ignore
        }
      }

      toast.success(
        inviteData.emailDelivered === false
          ? inviteData.emailWarning ?? "Invitation created and link copied!"
          : "Invitation sent successfully!"
      );

      // Add to local invites list
      setInvites((prev) => [
        {
          id: `temp-${Date.now()}`,
          email: inviteEmail,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        ...prev,
      ]);

      setInviteEmail("");
      setInviteModalOpen(false);
    } catch {
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Team Directory
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {workspaceName} Members
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace roles, permissions, and team collaborators.
          </p>
        </div>

        <Button
          onClick={() => setInviteModalOpen(true)}
          className="gap-2 self-start sm:self-auto text-xs h-9"
        >
          <UserPlus className="w-4 h-4" />
          Invite Teammate
        </Button>
      </section>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{members.length}</span> Total Member(s)
          <span>•</span>
          <span className="font-semibold text-foreground">{invites.length}</span> Pending Invite(s)
        </div>
      </div>

      {/* Members List */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground">Active Members</h2>
          <span className="text-xs text-muted-foreground">
            {filteredMembers.length} shown
          </span>
        </div>

        <div className="divide-y divide-border/60">
          {filteredMembers.map((member) => {
            const isSelf = member.user.id === currentUserId;
            const joinDate = new Date(member.joinedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={member.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                    {member.user.name ? member.user.name.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.user.name ?? "Unnamed Member"}
                      </p>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-xs font-medium text-foreground">{joinDate}</p>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border/60 text-xs font-semibold">
                    {member.role === "OWNER" ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    ) : member.role === "ADMIN" ? (
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="uppercase tracking-wider text-[10px]">{member.role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invites.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Pending Invitations</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {invites.length} pending
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {invites.map((invite) => {
              const expiresDate = new Date(invite.expiresAt).toLocaleDateString();
              return (
                <div
                  key={invite.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{invite.email}</p>
                      <p className="text-[11px] text-muted-foreground">Expires on {expiresDate}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px] uppercase">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Teammate</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you would like to invite to{" "}
              <span className="font-semibold text-foreground">{workspaceName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label htmlFor="member-invite-email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="member-invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isInviting}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteModalOpen(false)} disabled={isInviting}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
