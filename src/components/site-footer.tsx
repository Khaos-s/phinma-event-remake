import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { university } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div><strong>PHINMA UI Event</strong><p>A shared calendar. A connected campus.</p></div>
        <div className="footer-links"><Link href="/events">Explore events</Link><Link href="/contact">Contact</Link><Link href="/login">Sign in</Link><a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer">University website<ArrowUpRight size={14} aria-hidden="true" /></a></div>
      </div>
      <div className="page-container footer-bottom"><span>{university.address}</span><a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer">Campus photos &amp; university mark: PHINMA UI</a></div>
    </footer>
  );
}
