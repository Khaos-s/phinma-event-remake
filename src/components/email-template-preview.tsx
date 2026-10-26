"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, CircleAlert, Code, Copy, Download, Mail } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const subject = "Your PHINMA UI Event password reset code";
const dashboard = "https://supabase.com/dashboard/project/ulymtioaxraqvoqongrj/auth";

export function EmailTemplatePreview({ source, previewHtml }: { source: string; previewHtml: string }) {
  const notify = useToast();
  const [error, setError] = useState("");
  const sourceDetails = useRef<HTMLDetailsElement>(null);

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(source);
      setError("");
      notify("HTML copied. Paste it into the Supabase Reset Password template.");
    } catch {
      const message = "Automatic copy is unavailable. Select and copy the HTML source below.";
      setError(message);
      if (sourceDetails.current) sourceDetails.current.open = true;
      const input = sourceDetails.current?.querySelector("textarea");
      input?.focus();
      input?.select();
      notify(message, "error");
    }
  }

  return <>
    <div className="mb-7 flex items-start gap-3 rounded-xl border border-border bg-secondary p-4 text-sm text-secondary-foreground">
      <CircleAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p><strong className="block">Template prepared · Supabase setup required</strong>The default link-only email remains until this template is saved in hosted Supabase. Editing or deploying the application does not update outgoing emails.</p>
    </div>
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
      <section aria-labelledby="email-preview-title" className="min-w-0">
        <Card className="overflow-hidden">
          <div className="flex items-start gap-3 border-b border-border px-5 py-5 sm:px-7">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Mail size={19} aria-hidden="true" /></span>
            <div className="min-w-0"><h2 id="email-preview-title" className="text-base">Email preview</h2><p className="mt-1 text-sm text-muted-foreground">{subject}</p></div>
          </div>
          {/* Only the checked-in template body is rendered; no user or hosted HTML enters this preview. */}
          <div style={{ colorScheme: "light" }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </Card>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">The dots are a preview placeholder. Supabase replaces <code className="font-mono text-foreground">{"{{ .Token }}"}</code> with each recipient’s real code. Email apps may display spacing differently.</p>
      </section>
      <section aria-labelledby="email-setup-title">
        <Card className="p-5 sm:p-7">
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">Owner setup</p>
          <h2 id="email-setup-title" className="text-2xl">Put it in your reset email.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Use the Reset Password template for this project. Keep the token variable exactly as supplied.</p>
          <div className="mt-6 grid gap-2">
            <Button type="button" className="min-h-11" onClick={copyHtml}><Copy size={17} aria-hidden="true" />Copy HTML</Button>
            <a className={buttonVariants({ variant: "outline", className: "min-h-11" })} href={`data:text/html;charset=utf-8,${encodeURIComponent(source)}`} download="recovery.html"><Download size={17} aria-hidden="true" />Download HTML</a>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          <ol className="mt-7 grid gap-6 text-sm leading-relaxed">
            <li><strong className="block text-foreground">1. Check email delivery</strong><p className="mt-1 text-muted-foreground">Free projects created from 3 June 2026 must configure custom SMTP before customizing templates.</p><a className="text-link mt-2" href={`${dashboard}/smtp`} target="_blank" rel="noreferrer">Open SMTP settings<ArrowUpRight size={15} aria-hidden="true" /></a></li>
            <li><strong className="block text-foreground">2. Save the template body</strong><p className="mt-1 text-muted-foreground">Open Email Templates → Reset Password. Replace the message body with the copied HTML, then save.</p><a className="text-link mt-2" href={`${dashboard}/templates`} target="_blank" rel="noreferrer">Open email templates<ArrowUpRight size={15} aria-hidden="true" /></a></li>
            <li><Label htmlFor="recovery-email-subject">3. Set the subject</Label><Input id="recovery-email-subject" className="mt-2 h-auto min-h-11" value={subject} readOnly /><p className="mt-2 text-muted-foreground">Copy this subject into the same Reset Password settings and save.</p></li>
            <li><strong className="block text-foreground">4. Confirm a six-digit code</strong><p className="mt-1 text-muted-foreground">In Sign In / Providers → Email, set Email OTP Length to <strong className="text-foreground">6</strong>. Check the expiry against university policy.</p><a className="text-link mt-2" href={`${dashboard}/providers`} target="_blank" rel="noreferrer">Open email provider settings<ArrowUpRight size={15} aria-hidden="true" /></a></li>
            <li><strong className="block text-foreground">5. Verify delivery once setup is saved</strong><p className="mt-1 text-muted-foreground">Use an owner-controlled account to request a fresh reset email. Confirm the visible code works, then check that a used code fails. No email is sent by this preview.</p></li>
          </ol>
        </Card>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Template access depends on the project’s plan and SMTP configuration. <a href="https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Read Supabase’s customization requirements.</a></p>
      </section>
    </div>
    <details ref={sourceDetails} className="mt-7 rounded-xl border border-border bg-card p-5 sm:p-7">
      <summary className="cursor-pointer text-sm font-semibold"><Code size={17} className="mr-2 inline align-text-bottom text-primary" aria-hidden="true" />HTML source</summary>
      <p id="email-source-help" className="mt-3 text-sm text-muted-foreground">This is the exact local template used by Copy HTML and Download HTML. Paste the full document into Supabase, including <code className="font-mono text-foreground">{"{{ .Token }}"}</code>.</p>
      <Textarea aria-label="Reset password email HTML source" aria-describedby="email-source-help" className="mt-4 font-mono text-xs leading-relaxed" rows={14} readOnly value={source} spellCheck={false} />
    </details>
  </>;
}
