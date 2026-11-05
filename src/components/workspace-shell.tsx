"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  FileText,
  Home,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHome, roleLabels } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

function SidebarAccount({
  user,
  role,
}: {
  user: ReturnType<typeof useAccount>["user"];
  role: ReturnType<typeof useAccount>["role"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setBusy(true);
    const { error } = await createClient().auth.signOut({ scope: "local" });
    setBusy(false);
    if (error) return;
    router.replace("/login");
    router.refresh();
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? "P";
  const roleName = role ? roleLabels[role] : "Your account";

  return (
    <div className="sidebar-account-container" ref={containerRef}>
      {open && (
        <div className="sidebar-account-popover" role="menu" aria-label="Account options">
          <button
            type="button"
            className="sidebar-account-popover-item"
            role="menuitem"
            disabled={busy}
            onClick={() => void handleSignOut()}
          >
            {busy ? (
              <LoaderCircle className="loading-spinner" size={16} aria-hidden="true" />
            ) : (
              <LogOut size={16} aria-hidden="true" />
            )}
            <span>{busy ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      )}
      <button
        type="button"
        className={`sidebar-account-card ${open ? "is-active" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="account-avatar" aria-hidden="true">{initial}</span>
        <div className="sidebar-account-meta">
          <strong>PHINMA Event</strong>
          <span>{roleName}</span>
        </div>
        <ChevronUp className={`sidebar-account-chevron ${open ? "is-open" : ""}`} size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function WorkspaceShell({
  title,
  wide = false,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
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
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
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
    ...(role === "event_admin"
      ? [
          { href: "/admin", label: "Manage events", icon: ClipboardCheck },
          { href: "/admin/users", label: "Manage organizers", icon: UsersRound },
        ]
      : []),
    { href: "/account", label: "My account", icon: UserRound },
  ];

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        className={`workspace-sidebar ${open ? "is-open" : ""}`}
        id="workspace-navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label="Workspace navigation"
      >
        <div className="sidebar-brand-row">
          <Link href="/" className="brand-lockup">
            <span role="img" aria-label="University sun mark" className="sidebar-crest" />
            <span>
              PHINMA UI Event<small>University of Iloilo</small>
            </span>
          </Link>
          <button
            type="button"
            className="sidebar-close icon-button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Workspace navigation" className="workspace-navigation">
          <span className="sidebar-section-label">Your workspace</span>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={href === pathname ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
          <span className="sidebar-section-label campus-navigation-label">Explore campus</span>
          <Link href="/events" onClick={() => setOpen(false)}>
            <CalendarDays size={18} aria-hidden="true" />
            <span>Browse events</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <Link href="/" onClick={() => setOpen(false)}>
            <Home size={18} aria-hidden="true" />
            <span>Campus home</span>
          </Link>
          <Link href="/contact" onClick={() => setOpen(false)}>
            <Mail size={18} aria-hidden="true" />
            <span>Contact university</span>
          </Link>
        </nav>
        {user && <SidebarAccount user={user} role={role} />}
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <button
            type="button"
            className="workspace-menu icon-button"
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="workspace-navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} />
          </button>
          <div className="workspace-breadcrumb">
            <Link href="/">Campus home</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{title}</strong>
          </div>
          <div className="workspace-top-actions">
            <ThemeToggle />
            {role && (
              <span className="role-badge">
                <ShieldCheck size={13} aria-hidden="true" />
                {role === "event_admin"
                  ? "Administrator"
                  : role === "organizer"
                  ? "Organizer"
                  : "Member"}
              </span>
            )}
            <Link href="/events" className="public-site-link">
              View event board
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </header>
        <main id="main-content" className={`workspace-main ${wide ? "is-wide" : ""}`}>
          {children}
        </main>
        <footer className="workspace-footer">
          <span>PHINMA University of Iloilo</span>
          <span>Campus events · Philippine time</span>
        </footer>
      </div>
      <nav className="workspace-bottom-nav" aria-label="Quick navigation">
        <Link href="/events" aria-current={pathname.startsWith("/events") ? "page" : undefined}>
          <CalendarDays size={19} aria-hidden="true" />
          Events
        </Link>
        <Link
          href={roleHome(role)}
          aria-current={pathname === roleHome(role) ? "page" : undefined}
        >
          <LayoutDashboard size={19} aria-hidden="true" />
          {role === "member" ? "My account" : "Workspace"}
        </Link>
        {role !== "member" && (
          <Link href="/account" aria-current={pathname === "/account" ? "page" : undefined}>
            <UserRound size={19} aria-hidden="true" />
            Account
          </Link>
        )}
      </nav>
    </div>
  );
}
