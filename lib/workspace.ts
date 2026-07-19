import crypto from "crypto";

export function createWorkspaceSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "workspace"}-${suffix}`;
}

export function createInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}
