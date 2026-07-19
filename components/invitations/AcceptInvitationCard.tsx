"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";

type AcceptInvitationCardProps = {
  token: string;
  workspaceName: string;
  invitedEmail: string;
};

export function AcceptInvitationCard({
  token,
  workspaceName,
  invitedEmail,
}: AcceptInvitationCardProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const response = await api.post(`/invitations/${token}/accept`);
      const workspaceId = (response.data as { workspaceId?: string }).workspaceId;

      toast.success(`You have joined ${workspaceName}.`);
      router.push(workspaceId ? `/dashboard?workspace=${workspaceId}` : "/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Unable to accept this invitation. Check your account email and try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Workspace Invitation
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Join {workspaceName}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This invitation is for {invitedEmail}. Accept to be added as a member.
      </p>

      <div className="mt-6 flex gap-2">
        <Button onClick={handleAccept} disabled={isAccepting}>
          {isAccepting ? "Accepting..." : "Accept invitation"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
      </div>
    </section>
  );
}
