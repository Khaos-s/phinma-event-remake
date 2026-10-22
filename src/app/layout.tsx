import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHINMA Event | University of Iloilo",
  description: "Find approved CITE Council events at PHINMA University of Iloilo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
