"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CalendarDays, ChevronRight, ClipboardCheck, FileText, LayoutDashboard, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHome, roleLabels } from "@/lib/roles";

export function WorkspaceShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, role } = useAccount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
    const first = controls?.[0];
    const last = controls?.[controls.length - 1];
    first?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      document.querySelector<HTMLElement>('[aria-controls="workspace-navigation"]')?.focus();
    };
  }, [open]);
  const links = [
    ...(role === "organizer" ? [{ href: "/organizer", label: "My events", icon: FileText }] : []),
    ...(role === "event_admin" ? [{ href: "/admin", label: "Manage events", icon: ClipboardCheck }] : []),
    { href: "/events", label: "Browse events", icon: CalendarDays },
    { href: "/account", label: "My account", icon: UserRound },
  ];

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {open && <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside ref={sidebar} className={`workspace-sidebar ${open ? "is-open" : ""}`} id="workspace-navigation" role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label="Workspace navigation">
        <div className="sidebar-brand-row"><Link href="/" className="brand-lockup"><span className="brand-symbol"><CalendarDays size={23} aria-hidden="true" /></span><span>PHINMA UI Event<small>Campus life, connected</small></span></Link><button type="button" className="sidebar-close icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <div className="sidebar-section-label">Your workspace</div>
        <nav aria-label="Workspace navigation" className="workspace-navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={href === pathname ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={18} aria-hidden="true" /><span>{label}</span></Link>)}</nav>
        <div className="sidebar-university"><span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" /><p>A shared space for our<br />university community.</p></div>
        <div className="sidebar-account"><span className="account-avatar" aria-hidden="true">{user?.email?.[0]?.toUpperCase() ?? "P"}</span><div><strong>{role ? roleLabels[role] : "Your account"}</strong><span>{user?.email ?? "Checking access…"}</span></div></div>
        {user && <SignOutButton />}
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar"><button type="button" className="workspace-menu icon-button" aria-label="Open navigation" aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)}><Menu size={20} /></button><div className="workspace-breadcrumb"><span>PHINMA UI Event</span><ChevronRight size={14} aria-hidden="true" /><strong>{title}</strong></div><div className="workspace-top-actions"><ThemeToggle />{role && <span className="role-badge"><ShieldCheck size={13} aria-hidden="true" />{role === "event_admin" ? "Administrator" : role === "organizer" ? "Organizer" : "Member"}</span>}<Link href="/events" className="public-site-link">View event board<ArrowUpRight size={15} aria-hidden="true" /></Link></div></header>
        <main id="main-content" className="workspace-main">{children}</main>
        <footer className="workspace-footer"><span>PHINMA University of Iloilo</span><span>Campus events · Philippine time</span></footer>
      </div>
      <nav className="workspace-bottom-nav" aria-label="Quick navigation"><Link href="/events" aria-current={pathname.startsWith("/events") ? "page" : undefined}><CalendarDays size={19} aria-hidden="true" />Events</Link><Link href={roleHome(role)} aria-current={pathname === roleHome(role) ? "page" : undefined}><LayoutDashboard size={19} aria-hidden="true" />{role === "member" ? "My account" : "Workspace"}</Link>{role !== "member" && <Link href="/account" aria-current={pathname === "/account" ? "page" : undefined}><UserRound size={19} aria-hidden="true" />Account</Link>}</nav>
    </div>
  );
}
