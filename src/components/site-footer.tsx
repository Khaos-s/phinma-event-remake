import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { university } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-main">
        <div className="footer-brand"><span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" /><div><strong>PHINMA UI Event</strong><p>A shared calendar. A connected campus.</p></div></div>
        <nav className="footer-links" aria-label="Footer navigation"><h2>Campus events</h2><Link href="/events">Explore events</Link><Link href="/showcase">Platform showcase</Link><Link href="/login">Organizer sign in</Link></nav>
        <div className="footer-contact"><h2>University of Iloilo</h2><Link href="/contact">Campus contact hub<ArrowUpRight size={14} aria-hidden="true" /></Link><a href={university.phoneLink}>{university.phone}</a><a href={`mailto:${university.email}`}>{university.email}</a></div>
      </div>
      <div className="page-container footer-bottom"><span>{university.address}</span><a href="https://ui.phinma.edu.ph/" target="_blank" rel="noreferrer">Campus photos &amp; university mark: PHINMA UI</a></div>
    </footer>
  );
}
