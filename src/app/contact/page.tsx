import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone, CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { university } from "@/lib/site";

export const metadata = {
  title: "Contact | PHINMA UI Event",
  description: "Contact PHINMA University of Iloilo and find help with campus event publication.",
};

export default function ContactPage() {
  return <><SiteHeader /><main id="main-content" className="page-container public-main contact-page">
    <div className="contact-intro"><p className="contact-eyebrow">PHINMA University of Iloilo</p><h1>Let’s stay connected.</h1><p>Find your way to campus, get in touch with the university, or take the next step with your event.</p></div>
    <div className="contact-layout">
      <section className="contact-campus" aria-labelledby="find-us-title"><MapPin size={28} aria-hidden="true" /><h2 id="find-us-title">Find us</h2><address><strong>{university.name}</strong><span>{university.address}</span></address><a className="contact-map-link" href={university.maps} target="_blank" rel="noreferrer">Open in Google Maps<ArrowUpRight size={17} aria-hidden="true" /></a><a href={university.website} target="_blank" rel="noreferrer">Visit the university website<ArrowUpRight size={16} aria-hidden="true" /></a></section>
      <div className="contact-cards"><section aria-labelledby="university-contact-title"><h2 id="university-contact-title">University inquiries</h2><p>Reach the university through its published contact channels.</p><a href={university.phoneLink}><Phone size={19} aria-hidden="true" /><span><small>Call the university</small>{university.phone}</span></a><a href={`mailto:${university.email}`}><Mail size={19} aria-hidden="true" /><span><small>General email</small>{university.email}</span></a></section>
      <section aria-labelledby="event-questions-title"><CalendarDays size={24} aria-hidden="true" /><h2 id="event-questions-title">Event questions</h2><p>Council, faculty, and staff organizers submit events for their assigned organization. One PHINMA Event administrator reviews and approves each event before it appears on the public board.</p><p>To publish an event, contact your PHINMA Event administrator for access, then sign in to your event workspace.</p><Link href="/login" className="primary-link">Sign in to publish<ArrowUpRight size={17} aria-hidden="true" /></Link><Link href="/events" className="text-link">Browse campus events<ArrowUpRight size={16} aria-hidden="true" /></Link></section></div>
    </div>
  </main><SiteFooter /></>;
}
