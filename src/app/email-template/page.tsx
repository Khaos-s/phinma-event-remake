import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { EmailTemplatePreview } from "@/components/email-template-preview";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Password reset email template | PHINMA UI Event",
  description: "Preview and copy the PHINMA UI Event recovery email for the project's Supabase settings.",
  robots: { index: false, follow: false },
};

export default async function EmailTemplatePage() {
  const source = await readFile(path.join(process.cwd(), "supabase/templates/recovery.html"), "utf8");
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)?.[1];
  if (!body) throw new Error("The recovery email template must contain a body.");

  return <><SiteHeader /><main id="main-content" className="page-container public-main">
    <div className="mb-9 max-w-2xl">
      <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-primary uppercase">Password recovery · Email template</p>
      <h1 className="text-4xl leading-tight sm:text-5xl">Password reset email.</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">A PHINMA email with a visible, one-time reset code. Preview the design, then copy it into the project’s Supabase email settings.</p>
    </div>
    <EmailTemplatePreview source={source} previewHtml={body.replace("{{ .Token }}", "••••••")} />
  </main><SiteFooter /></>;
}
