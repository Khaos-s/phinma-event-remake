"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setError("Sign-in failed. Check your email and password.");
      setBusy(false);
      return;
    }

    const { data: assignment, error: roleError } = await client
      .from("role_assignments")
      .select("role")
      .eq("user_id", data.user.id)
      .single();
    if (roleError || !assignment) {
      await client.auth.signOut();
      setError("This account has no event role yet. Ask the project administrator for access.");
      setBusy(false);
      return;
    }

    router.replace(assignment.role === "event_admin" ? "/admin" : "/organizer");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole className="size-6" aria-hidden="true" /></div>
            <CardTitle className="text-2xl">Organizer and administrator sign in</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">Use the Supabase account assigned to your CITE Council or PHINMA Event role.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={signIn} className="space-y-5">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
