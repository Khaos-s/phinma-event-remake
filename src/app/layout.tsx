import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

const displayFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "PHINMA UI Event | University of Iloilo",
  description: "Discover PHINMA University of Iloilo events by department, course, organizer, and year level.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning data-scroll-behavior="smooth" className={`h-full antialiased ${displayFont.variable} ${bodyFont.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){var t;try{t=localStorage.getItem('phinma-theme')}catch(e){}document.documentElement.dataset.theme=t==='dark'||t==='light'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()` }} /></head>
      {/* Extensions such as Grammarly inject body attributes before hydration. */}
      <body suppressHydrationWarning className="min-h-full flex flex-col"><ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider></body>
    </html>
  );
}
