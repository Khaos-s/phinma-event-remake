"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleHome } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const account = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!account.loading && account.user && !account.error) router.replace(roleHome(account.role));
  }, [account, router]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const { data, error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError || !data.user) {
      setError("Sign-in failed. Check your email and password.");
      setBusy(false);
      return;
    }

    setBusy(false);
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="login-layout">
        <div className="login-story">
          <Image src="/images/phinma-students.jpg" alt="PHINMA University of Iloilo students on campus" fill sizes="(min-width: 1024px) 52vw, 100vw" className="login-photo" priority />
          <div className="login-story-caption"><span className="story-location">PHINMA University of Iloilo</span><p>A place to belong.<br /><span>A moment to be part of.</span></p><span>Discover what brings our campus together.</span></div>
        </div>
        <div className="login-form-panel">
          <div className="login-form-inner">
            <Link href="/" className="back-link"><ArrowLeft size={16} aria-hidden="true" />Back to campus events</Link>
            <h1>Welcome back.</h1>
            <p className="login-intro">One account. Your campus, connected.</p>
            <form onSubmit={signIn} className="login-form">
              <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="Enter your email address" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="password-field"><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 pr-12" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              {(error || account.error) && <p role="alert" className="form-error">{error || account.error}</p>}
              <Button type="submit" className="h-12 w-full justify-between px-5" disabled={busy || account.loading}>{busy ? "Signing in…" : "Sign in"}<ArrowRight size={18} aria-hidden="true" /></Button>
            </form>
            <div className="login-access-note"><ShieldCheck size={18} aria-hidden="true" /><p>Students, staff, council organizers, and administrators sign in here. Your account opens the tools available to you.</p></div>
            <p className="login-help">Need an account or help signing in?<br />Contact your PHINMA Event administrator.</p>
          </div>
          <p className="login-form-footer">Made for our university community.</p>
        </div>
      </main>
    </>
  );
}
