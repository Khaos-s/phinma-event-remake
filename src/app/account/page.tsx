"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { WorkspaceShell } from "@/components/workspace-shell";
import { roleHome, roleLabels } from "@/lib/roles";

export default function AccountPage() {
  const account = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!account.loading && !account.user) router.replace("/login");
  }, [account.loading, account.user, router]);

  return (
    <WorkspaceShell title="My account">
        <div className="page-heading"><div><h1>My account</h1><p>Your university identity and event access, in one place.</p></div><span className="role-badge"><ShieldCheck size={14} aria-hidden="true" />Account access</span></div>
        {account.loading ? <p role="status">Loading your account…</p> : account.error ? <p role="alert">{account.error}</p> : account.user && account.role ? (
          <div className="account-grid">
            <div className="account-details"><div className="account-card-heading"><div className="member-avatar" aria-hidden="true">{account.user.email?.[0]?.toUpperCase()}</div><div><h2>University profile</h2><p>PHINMA University of Iloilo</p></div></div><dl><div><dt>Email address</dt><dd>{account.user.email}</dd></div><div><dt>Account access</dt><dd>{roleLabels[account.role]}</dd></div></dl><p className="account-verified"><Check size={16} aria-hidden="true" />Signed in to PHINMA UI Event</p></div>
            <div className="account-next"><h2>Your next campus moment</h2><p>Browse approved events, check who they’re for, and find a place in your university calendar.</p><Link href="/events" className="primary-link">Browse events<ArrowUpRight size={18} aria-hidden="true" /></Link>{account.role !== "member" && <Link href={roleHome(account.role)} className="text-link">Open your event workspace<ArrowUpRight size={16} aria-hidden="true" /></Link>}<div className="access-note"><ShieldCheck size={17} aria-hidden="true" /><p>{account.role === "event_admin" ? "You can review submissions and approve events for publication." : account.role === "cite_organizer" ? "You can submit CITE Council events. An administrator reviews each submission." : "Your account can browse published events. Event creation and review require an assigned council or administrator role."}</p></div></div>
          </div>
        ) : null}
    </WorkspaceShell>
  );
}
