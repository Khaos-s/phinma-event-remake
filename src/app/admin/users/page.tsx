"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserPlus } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LoadingPanel } from "@/components/loading-panel";
import { useFeedbackToasts } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { colleges, collegeLabel } from "@/lib/academics";
import { roleHome } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import "../admin.css";

type Organizer = { user_id: string; email: string; organization_id: string; organization_name: string; department: string; course: string | null };

export default function AdminUsersPage() {
  const client = useMemo(() => createClient(), []);
  const account = useAccount();
  const router = useRouter();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [department, setDepartment] = useState<string>(colleges[0].name);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [notice, setNotice] = useState("");
  const saving = useRef(false);
  useFeedbackToasts(error, notice);
  const courses = colleges.find(item => item.name === department)?.courses ?? [];
  const load = useCallback(async () => {
    const result = await client.rpc("admin_organizers");
    if (result.error) setFetchError(`Organizer accounts could not be loaded. ${result.error.message}`);
    else { setFetchError(""); setOrganizers(result.data ?? []); }
    setLoading(false);
  }, [client]);
  useEffect(() => {
    async function checkAccess() {
      if (account.loading || account.error) return;
      if (!account.user) { router.replace("/login"); return; }
      if (account.role !== "event_admin") { router.replace(roleHome(account.role)); return; }
      await load();
    }
    void checkAccess();
  }, [account, load, router]);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = { email: String(fields.get("email") ?? "").trim(), password: String(fields.get("password") ?? ""), organization: String(fields.get("organization") ?? "").trim(), department, course: String(fields.get("course") ?? "") };
    setError(""); setNotice("");
    if (!courses.some(item => item.code === body.course) || !form.checkValidity()) { setError("Check the required account and course fields."); return; }
    saving.current = true; setBusy(true);
    try {
      const result = await client.functions.invoke("admin-register-organizer", { body });
      if (result.error) {
        let message = "Registration could not be confirmed. Refresh the organizer list before retrying.";
        if (result.error.context instanceof Response) {
          try { const detail = await result.error.context.json(); if (typeof detail.error === "string") message = detail.error; } catch {}
        }
        setError(message); return;
      }
      if (!result.data?.user_id) { setError("Registration could not be confirmed. Refresh before retrying."); return; }
      form.reset();
      setNotice(result.data.existingAccount ? "Organizer access assigned. The existing account keeps its password." : "Organizer registered. Share the initial password securely with the account owner.");
      await load();
    } catch { setError("Registration could not be confirmed. Refresh the organizer list before retrying."); }
    finally { saving.current = false; setBusy(false); }
  }

  if (account.error) return <WorkspaceShell title="Manage organizers"><p role="alert" className="form-error">{account.error}</p></WorkspaceShell>;
  if (account.loading || account.role !== "event_admin") return <WorkspaceShell title="Manage organizers"><LoadingPanel>Checking administrator access…</LoadingPanel></WorkspaceShell>;

  return <WorkspaceShell title="Manage organizers">
    <div className="page-heading"><div><h1>Manage organizers</h1><p>Register accounts for a publisher, department, and assigned course.</p></div><Button variant="outline" disabled={busy} onClick={() => void load()}><RefreshCw size={16} aria-hidden="true" />Refresh organizers</Button></div>
    {(error || fetchError) && <p role="alert" className="form-error">{error || fetchError}</p>}{notice && <p role="status" className="success-notice">{notice}</p>}
    <section className="admin-registration" aria-labelledby="register-title"><h2 id="register-title">Register organizer</h2><p>New accounts use the initial password below. Existing member accounts keep their password. An account with different privileged access cannot be reassigned here.</p>
      <form onSubmit={register} className="admin-event-form"><fieldset disabled={busy} className="admin-form-grid">
        <div className="space-y-2"><Label htmlFor="organizer-email">Email address</Label><Input id="organizer-email" name="email" type="email" maxLength={254} autoComplete="off" required /></div>
        <div className="space-y-2"><Label htmlFor="organizer-password">Initial password</Label><Input id="organizer-password" name="password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required /><p className="text-xs text-muted-foreground">12–128 characters. Share securely; never publish passwords.</p></div>
        <div className="space-y-2"><Label htmlFor="organizer-department">Department</Label><select id="organizer-department" className="course-select" value={department} onChange={event => setDepartment(event.target.value)}>{colleges.map(item => <option key={item.code} value={item.name}>{collegeLabel(item.name)}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="organizer-course">Assigned course</Label><select id="organizer-course" name="course" className="course-select" key={department} required defaultValue={courses[0]?.code}>{courses.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="organizer-publisher">Publisher / organization name</Label><Input id="organizer-publisher" name="organization" list="publisher-suggestions" maxLength={120} required placeholder="e.g. your authorized council or faculty group" /><datalist id="publisher-suggestions">{[...new Set(organizers.filter(item => item.department === department).map(item => item.organization_name))].map(name => <option key={name} value={name} />)}</datalist></div>
      </fieldset><p className="info-note">This account can submit events only for this publisher, department and course. Pending and approved events remain locked for organizers.</p><Button type="submit" loading={busy}><UserPlus size={16} aria-hidden="true" />{busy ? "Registering…" : "Register organizer"}</Button></form>
    </section>
    <section aria-labelledby="organizer-list-title"><div className="panel-section-heading"><h2 id="organizer-list-title">Organizer accounts</h2><span>{loading ? "Loading…" : fetchError ? "Unavailable" : `${organizers.length} accounts`}</span></div>{loading ? <LoadingPanel>Loading organizers…</LoadingPanel> : organizers.length ? <div className="admin-organizer-list">{organizers.map(item => <article key={item.user_id}><strong>{item.email}</strong><p>{item.organization_name}</p><p>{collegeLabel(item.department)} · {item.course ?? "All department courses (existing assignment)"}</p></article>)}</div> : !fetchError && <p className="info-note">No organizer accounts are registered.</p>}</section>
  </WorkspaceShell>;
}
