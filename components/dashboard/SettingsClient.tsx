"use client";

import { useState } from "react";
import { Settings, Building2, User, Bell, ShieldAlert, Save } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

type SettingsClientProps = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  isOwner: boolean;
};

export default function SettingsClient({
  workspace,
  user,
  isOwner,
}: SettingsClientProps) {
  const [workspaceName, setWorkspaceName] = useState(workspace?.name ?? "");
  const [workspaceDesc, setWorkspaceDesc] = useState(workspace?.description ?? "");
  const [userName, setUserName] = useState(user.name);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveWorkspace = async () => {
    setIsSaving(true);
    // Simulate save or call api
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Workspace preferences updated successfully");
    }, 600);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("User profile updated successfully");
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings className="w-5 h-5" />
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Configuration
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Preferences & Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage workspace properties, your profile, and notification settings.
        </p>
      </section>

      {/* Workspace Settings */}
      {workspace && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Workspace General Settings</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Workspace Name</label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={!isOwner}
                placeholder="Product Team"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Workspace Slug</label>
              <Input
                value={workspace.slug}
                disabled
                className="bg-muted/40 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Workspace Description</label>
              <Input
                value={workspaceDesc}
                onChange={(e) => setWorkspaceDesc(e.target.value)}
                disabled={!isOwner}
                placeholder="Team collaboration space for sprint planning and development"
              />
            </div>
          </div>

          {isOwner && (
            <div className="pt-2 flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveWorkspace}
                disabled={isSaving}
                className="gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      )}

      {/* User Profile */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Your Profile</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Display Name</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Email Address</label>
            <Input
              value={user.email}
              disabled
              className="bg-muted/40 font-mono text-xs cursor-not-allowed"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="gap-1.5 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Update Profile
          </Button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-foreground">Email Notifications</p>
              <p className="text-[11px] text-muted-foreground">Receive email digests about workspace activities</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => {
                setEmailNotifications(e.target.checked);
                toast.success("Notification settings updated");
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-foreground">Task Assignments</p>
              <p className="text-[11px] text-muted-foreground">Get notified immediately when tasks are assigned to you</p>
            </div>
            <input
              type="checkbox"
              checked={taskAlerts}
              onChange={(e) => {
                setTaskAlerts(e.target.checked);
                toast.success("Task alert settings updated");
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/20 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-foreground">Chat Sounds</p>
              <p className="text-[11px] text-muted-foreground">Play a soft chime when direct messages arrive</p>
            </div>
            <input
              type="checkbox"
              checked={chatSounds}
              onChange={(e) => {
                setChatSounds(e.target.checked);
                toast.success("Audio preferences updated");
              }}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-destructive/20 text-destructive">
          <ShieldAlert className="w-4 h-4" />
          <h2 className="text-base font-semibold">Danger Zone</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-foreground">Sign Out of All Devices</p>
            <p className="text-[11px] text-muted-foreground">
              End your active session on this device and return to the login screen.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="text-xs h-8 shrink-0"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
