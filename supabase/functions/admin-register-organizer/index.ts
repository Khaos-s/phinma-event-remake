import { createClient } from "@supabase/supabase-js";
import { registerOrganizer } from "./handler.ts";

Deno.serve((request: Request) => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = { persistSession: false, autoRefreshToken: false };
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth, global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
  });
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth });
  return registerOrganizer(request, caller, service);
});
