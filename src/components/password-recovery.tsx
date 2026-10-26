"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, KeyRound, Mail } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { LoadingPanel } from "@/components/loading-panel";
import { SiteHeader } from "@/components/site-header";
import { useFeedbackToasts } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleHome } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

export function PasswordRecovery({ update = false }: { update?: boolean }) {
  const client = useMemo(() => createClient(), []);
  const account = useAccount();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const notice = done ? "Your password has been updated." : codeSent ? "If an account uses that email, a 6-digit reset code has been requested. Check your inbox and spam folder." : "";
  useFeedbackToasts(error, notice);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function requestCode() {
    if (busy || cooldown) return;
    setError(""); setBusy(true);
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: new URL("/reset-password", window.location.origin).href });
      if (error) {
        if (error.code === "over_email_send_rate_limit") {
          setError("Email sending limit reached. Please try again later. If this continues, contact the administrator to check email delivery.");
          setCooldown(60);
        } else if (error.status === 429) {
          setError("Too many reset requests. Please wait before trying again.");
          setCooldown(60);
        } else if (error.code === "email_address_not_authorized") {
          setError("Email delivery is restricted by Supabase. Contact the administrator to configure email sending for your account.");
        } else {
          setError("The reset code could not be requested. Please try again later or contact the administrator if this continues.");
        }
        return;
      }
      setCodeSent(true); setCode(""); setCooldown(60);
    } catch { setError("The connection was interrupted. Please try again."); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!update && !codeSent) { await requestCode(); return; }
    setError("");
    if (!update && !/^[0-9]{6}$/.test(code)) { setError("Enter the 6-digit code from your email."); return; }
    if (update && (password.length < 8 || password !== confirmation)) {
      setError(password.length < 8 ? "Use at least 8 characters for your new password." : "The passwords do not match.");
      return;
    }
    if (update && !account.user) { setError("Your reset session has expired. Request a new code to continue."); return; }
    setBusy(true);
    try {
      if (!update) {
        const { data, error } = await client.auth.verifyOtp({ email: email.trim(), token: code, type: "recovery" });
        if (error || !data.session) { setError("That code is invalid or has expired. Check the most recent email or request a new code."); return; }
        router.replace("/reset-password");
      } else {
        const { error } = await client.auth.updateUser({ password });
        if (error) { setError(`Your password could not be updated. ${error.message}`); return; }
        setPassword(""); setConfirmation(""); setDone(true);
      }
    } catch { setError("The connection was interrupted. Please try again."); }
    finally { setBusy(false); }
  }

  const Icon = update || codeSent ? KeyRound : Mail;
  return <><SiteHeader /><main id="main-content" className="recovery-page page-container"><section className="recovery-card" aria-labelledby="recovery-title"><Link href="/login" className="back-link"><ArrowLeft size={16} aria-hidden="true" />Back to sign in</Link><span className="recovery-icon"><Icon size={26} aria-hidden="true" /></span><p className="eyebrow">Your campus account</p><h1 id="recovery-title">{update ? "A fresh start." : codeSent ? "Check your email." : "Forgot your password?"}</h1><p className="recovery-intro">{update ? "Choose a new password to keep your account secure." : codeSent ? `Enter the 6-digit code for ${email.trim()} to reset your password.` : "We’ll email you a 6-digit code to reset your password."}</p>
    {done ? <div className="space-y-5"><p role="status" className="success-notice"><Check size={20} aria-hidden="true" />{notice}</p><Link className="primary-link" href={roleHome(account.role)}>Continue to your account<ArrowRight size={17} aria-hidden="true" /></Link></div>
    : update && account.loading ? <LoadingPanel>Checking your reset session…</LoadingPanel>
    : update && !account.user ? <div className="space-y-5"><p role="alert" className="form-error">Your reset session is invalid or has expired. Request a code and verify your email to continue.</p><Link href="/forgot-password" className="primary-link">Request a reset code<ArrowRight size={17} aria-hidden="true" /></Link></div>
    : <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
      <fieldset disabled={busy} className="space-y-5">
        {update ? <>
          <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} aria-describedby="password-guidance" /><p id="password-guidance" className="text-sm text-muted-foreground">At least 8 characters. Use a unique password.</p></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></div>
        </> : codeSent ? <>
          <p className="text-sm text-muted-foreground" role="status">{notice}</p>
          <div className="space-y-2"><Label htmlFor="recovery-code">6-digit code</Label><Input id="recovery-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code} onChange={event => setCode(event.target.value.replace(/[^0-9]/g, ""))} className="recovery-code" autoFocus /></div>
        </> : <div className="space-y-2"><Label htmlFor="recovery-email">Email address</Label><Input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} placeholder="Enter your account email" /></div>}
      </fieldset>
      {error && <p role="alert" className="form-error">{error}</p>}
      <Button type="submit" loading={busy} disabled={!update && !codeSent && cooldown > 0} className="w-full h-12">{busy ? update ? "Updating password…" : codeSent ? "Verifying code…" : "Requesting code…" : update ? "Update password" : codeSent ? "Verify code" : cooldown ? `Try again in ${cooldown}s` : "Send reset code"}{!busy && <ArrowRight size={17} aria-hidden="true" />}</Button>
      {!update && codeSent && <div className="recovery-code-actions"><Button type="button" variant="ghost" disabled={busy || cooldown > 0} onClick={() => void requestCode()}>{cooldown ? `Resend code in ${cooldown}s` : "Resend code"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => { setCodeSent(false); setCode(""); setError(""); }}>Use another email</Button></div>}
    </form>}
  </section></main></>;
}
