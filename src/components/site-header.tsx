"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHome } from "@/lib/roles";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, role, loading } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const home = roleHome(role);

  return (
    <header className="site-header" onKeyDown={event => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); event.currentTarget.querySelector<HTMLButtonElement>(".mobile-menu-toggle")?.focus(); } }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="page-container header-main">
        <Link href="/" className="site-brand" aria-label="PHINMA UI Event home" onClick={() => setMenuOpen(false)}>
          <span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" />
          <span className="brand-divider" aria-hidden="true" />
          <span className="event-wordmark">PHINMA UI Event<span>University of Iloilo</span></span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          <Link href="/events" className={`nav-link ${pathname.startsWith("/events") ? "is-active" : ""}`}>All events</Link>
          <Link href="/contact" className={`nav-link ${pathname === "/contact" ? "is-active" : ""}`} aria-current={pathname === "/contact" ? "page" : undefined}>Contact</Link>
          <Link href="/showcase" className={`nav-link ${pathname === "/showcase" ? "is-active" : ""}`} aria-current={pathname === "/showcase" ? "page" : undefined}>Showcase</Link>
          <a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer" className="nav-link">Our university<ArrowUpRight size={13} aria-hidden="true" /></a>
          {loading ? <span className="nav-account-loading" aria-label="Checking account" /> : <Link href={user ? home : "/login"} className="primary-link">{user ? (role === "member" ? "My account" : "My workspace") : "Sign in"}<ArrowUpRight size={16} aria-hidden="true" /></Link>}
          {user && <SignOutButton compact />}
        </nav>
        <div className="header-theme"><ThemeToggle /></div>
        <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {menuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav page-container"><Link href="/events" onClick={() => setMenuOpen(false)}>All events</Link><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link><Link href="/showcase" onClick={() => setMenuOpen(false)}>Showcase</Link><a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer">Our university</a>{!loading && <Link href={user ? home : "/login"} onClick={() => setMenuOpen(false)}>{user ? (role === "member" ? "My account" : "My workspace") : "Sign in"}</Link>}{user && <SignOutButton />}</nav>}
    </header>
  );
}
