"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, Home, LayoutGrid, Mail, Menu, X } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHome } from "@/lib/roles";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, role, loading } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const home = roleHome(role);
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/events", label: "All events", icon: CalendarDays },
    { href: "/contact", label: "Contact", icon: Mail },
    { href: "/showcase", label: "Showcase", icon: LayoutGrid },
  ];
  const accountLabel = user ? (role === "member" ? "My account" : "My workspace") : "Sign in";

  return (
    <header className="site-header" onKeyDown={event => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); event.currentTarget.querySelector<HTMLButtonElement>(".mobile-menu-toggle")?.focus(); } }}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="page-container header-main">
        <Link href="/" className="site-brand" aria-label="PHINMA UI Event home" onClick={() => setMenuOpen(false)}>
          <span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" />
        </Link>
        <div className="header-actions"><ThemeToggle /><div className="desktop-account">{loading ? <span className="nav-account-loading" aria-label="Checking account" /> : <Link href={user ? home : "/login"} className="primary-link">{accountLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>}{user && <SignOutButton compact />}</div></div>
        <button type="button" className="mobile-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      <div className="header-navigation"><div className="page-container header-navigation-inner"><nav aria-label="Main navigation" className="desktop-nav">{links.map(({ href, label, icon: Icon }) => { const active = href === "/events" ? pathname.startsWith(href) : pathname === href; return <Link key={href} href={href} className="nav-link" aria-current={active ? "page" : undefined}><Icon size={16} aria-hidden="true" />{label}</Link>; })}</nav><a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer" className="nav-link university-link">Our university<ArrowUpRight size={14} aria-hidden="true" /></a></div></div>
      {menuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav page-container"><span className="navigation-group-label">Explore campus</span>{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={(href === "/events" ? pathname.startsWith(href) : pathname === href) ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon size={18} aria-hidden="true" />{label}</Link>)}<a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer">Our university<ArrowUpRight size={16} aria-hidden="true" /></a><span className="navigation-group-label">Your account</span>{!loading && <Link href={user ? home : "/login"} onClick={() => setMenuOpen(false)}>{accountLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>}{user && <SignOutButton />}</nav>}
    </header>
  );
}
