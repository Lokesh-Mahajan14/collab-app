"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
    >
      Sign out
    </Button>
  );
}
