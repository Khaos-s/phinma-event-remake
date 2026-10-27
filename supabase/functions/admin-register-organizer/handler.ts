import type { SupabaseClient } from "@supabase/supabase-js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });

export async function registerOrganizer(request: Request, caller: SupabaseClient, service: SupabaseClient) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, { error: "Use POST to register an organizer." });
  const token = request.headers.get("Authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return reply(401, { error: "Sign in before registering an organizer." });
  try {
    const identity = await caller.auth.getUser(token);
    if (identity.error || !identity.data.user) return reply(401, { error: "Your session expired. Sign in again." });
    const access = await caller.rpc("has_role", { expected_role: "event_admin" });
    if (access.error) return reply(503, { error: "Administrator access could not be verified. Try again." });
    if (access.data !== true) return reply(403, { error: "Administrator access is required." });
    if (!request.headers.get("Content-Type")?.startsWith("application/json")) return reply(415, { error: "Send a JSON registration form." });
    const raw = await request.text();
    if (raw.length > 8192) return reply(413, { error: "The registration form is too large." });
    let input: Record<string, unknown>;
    try { input = JSON.parse(raw); } catch { return reply(400, { error: "The registration form is invalid." }); }
    const fields = ["email", "password", "organization", "department", "course"];
    if (!input || Array.isArray(input) || typeof input !== "object" || Object.keys(input).some(key => !fields.includes(key))
      || fields.some(key => typeof input[key] !== "string")) return reply(400, { error: "Complete the organizer registration fields." });
    const email = (input.email as string).trim().toLowerCase();
    const password = input.password as string;
    const organization = (input.organization as string).trim();
    const department = input.department as string;
    const course = input.course as string;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 128
      || !organization || (input.organization as string).length > 120 || department.length > 160 || course.length > 20) {
      return reply(400, { error: "Use a valid email, a 12–128 character password, and a publisher name of up to 120 characters." });
    }
    const program = await caller.from("academic_programs").select("code").eq("code", course).eq("department", department).maybeSingle();
    if (program.error) return reply(503, { error: "The academic catalog could not be checked. Try again." });
    if (!program.data) return reply(400, { error: "Choose a course in the selected department." });
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    const existingAccount = Boolean(created.error && ["email_exists", "user_already_exists"].includes(created.error.code ?? ""));
    if (created.error && !existingAccount) {
      return reply(created.error.status && created.error.status < 500 ? 400 : 503, { error: created.error.status && created.error.status < 500 ? created.error.message : "Account creation could not be confirmed. Refresh the organizer list before retrying." });
    }
    const assigned = await caller.rpc("admin_assign_organizer", { account_email: email, publisher_name: organization, assigned_department: department, assigned_course: course });
    if (assigned.error) {
      const definite = assigned.status >= 400 && assigned.status < 500 && /^(22|23|42|P0)[0-9A-Z]{3}$/.test(assigned.error.code);
      if (definite && created.data.user?.id) {
        const cleanup = await service.auth.admin.deleteUser(created.data.user.id);
        if (cleanup.error) return reply(500, { error: "The account was created, but organizer access could not be assigned or the unused account removed. Retry registration to finish setup." });
      }
      return reply(definite ? 400 : 503, { error: definite ? assigned.error.message : "Registration could not be confirmed. Refresh the organizer list before retrying. The account was retained so a possibly successful assignment is not deleted." });
    }
    return reply(existingAccount ? 200 : 201, { user_id: assigned.data, existingAccount });
  } catch {
    return reply(503, { error: "Registration could not be confirmed. Refresh the organizer list before retrying." });
  }
}
