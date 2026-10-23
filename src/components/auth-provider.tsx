"use client";

import { createContext, Fragment, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppRole, Organization, resolveRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

type Account = { user: User | null; role: AppRole | null; organization: Organization | null; loading: boolean; error: string };
const initialAccount: Account = { user: null, role: null, organization: null, loading: true, error: "" };
const AuthContext = createContext<Account>(initialAccount);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => createClient(), []);
  const [account, setAccount] = useState<Account>(initialAccount);

  useEffect(() => {
    let active = true;
    let revision = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function loadAccount(request: number) {
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (!active || request !== revision) return;
      if (!user || userError) {
        setAccount({ ...initialAccount, loading: false });
        return;
      }

      const { data, error } = await client.from("role_assignments")
        .select("role,organization_id").eq("user_id", user.id).maybeSingle();
      const role = resolveRole(data?.role);
      let organization: Organization | null = null;
      let accessError = Boolean(error);
      if (!error && role === "organizer") {
        if (!data?.organization_id) accessError = true;
        else {
          const result = await client.from("organizations").select("id,name,department").eq("id", data.organization_id).maybeSingle();
          organization = result.data as Organization | null;
          accessError = Boolean(result.error || !organization);
        }
      }
      if (active && request === revision) {
        setAccount({
          user,
          role: accessError ? null : role,
          organization: accessError ? null : organization,
          loading: false,
          error: accessError ? "We couldn’t check your account access. Please refresh and try again." : "",
        });
      }
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const request = ++revision;
      clearTimeout(timer);
      if (!session) {
        setAccount({ ...initialAccount, loading: false });
        return;
      }
      setAccount((current) => current.user?.id === session.user.id ? current : initialAccount);
      // Defer Supabase calls until its auth callback releases the session lock.
      timer = setTimeout(() => void loadAccount(request), 0);
    });

    return () => { active = false; revision++; clearTimeout(timer); subscription.unsubscribe(); };
  }, [client]);

  return <AuthContext.Provider value={account}><Fragment key={account.user?.id ?? "guest"}>{children}</Fragment></AuthContext.Provider>;
}

export function useAccount() {
  return useContext(AuthContext);
}
