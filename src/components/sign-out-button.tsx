"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signOut({ scope: "local" });
    setBusy(false);
    if (error) { setError("Sign-out failed. Please try again."); return; }
    router.replace("/login");
    router.refresh();
  }

  return <div className="sign-out"><button type="button" className={compact ? "icon-button" : "sign-out-action"} aria-label="Sign out" disabled={busy} onClick={() => void signOut()}><LogOut size={17} aria-hidden="true" />{!compact && (busy ? "Signing out…" : "Sign out")}</button>{error && <p role="alert" className="field-error">{error}</p>}</div>;
}
