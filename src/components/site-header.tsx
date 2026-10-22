"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Role = "cite_organizer" | "event_admin";

export function SiteHeader({ role }: { role?: Role }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-card/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground" aria-hidden="true">P</span>
          <span><span className="block text-sm leading-tight">PHINMA Event</span><span className="block text-xs font-normal text-muted-foreground">University of Iloilo</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>Events</Link>
          {role && <Link href={role === "event_admin" ? "/admin" : "/organizer"} className={buttonVariants({ variant: "ghost", size: "sm" })}>{role === "event_admin" ? "Review" : "My events"}</Link>}
          {role ? <Button size="sm" variant="outline" onClick={signOut}>Sign out</Button> : <Link href="/login" className={buttonVariants({ size: "sm" })}>Sign in</Link>}
        </nav>
      </div>
    </header>
  );
}
