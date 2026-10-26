import type { Metadata } from "next";
import { SiteShowcase } from "@/components/site-showcase";
import "./showcase.css";

export const metadata: Metadata = {
  title: "Design showcase | PHINMA UI Event",
  description: "A local design preview of the PHINMA University of Iloilo event experience.",
  robots: { index: false, follow: false },
};

export default function ShowcasePage() {
  return <SiteShowcase />;
}
