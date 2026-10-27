import test from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { registerOrganizer } from "../../supabase/functions/admin-register-organizer/handler.ts";

const input = { email: " Organizer@example.invalid ", password: "x".repeat(20), organization: "Council", department: "College of Management", course: "BSHM" };
function fixture(options: { signedIn?: boolean; admin?: boolean; program?: boolean; existing?: boolean; assignmentError?: { code: string; message: string }; status?: number; cleanupFails?: boolean; throws?: boolean } = {}) {
  const calls: string[] = [];
  const catalog = { select: () => catalog, eq: () => catalog, maybeSingle: async () => ({ data: options.program === false ? null : { code: "BSHM" }, error: null }) };
  const caller = {
    auth: { getUser: async () => ({ data: { user: options.signedIn === false ? null : { id: "admin" } }, error: null }) },
    from: () => catalog,
    rpc: async (name: string) => {
      calls.push(name);
      if (name === "has_role") return { data: options.admin !== false, error: null };
      if (options.throws) throw Error("Connection lost");
      return { data: options.assignmentError ? null : "registered-user", error: options.assignmentError ?? null, status: options.status ?? 200 };
    },
  } as unknown as SupabaseClient;
  const service = { auth: { admin: {
    createUser: async (value: { email: string; email_confirm: boolean; password: string }) => {
      calls.push("createUser");
      assert.equal(value.email, "organizer@example.invalid"); assert.equal(value.email_confirm, true); assert.equal(value.password, input.password);
      return options.existing ? { data: { user: null }, error: { code: "email_exists", status: 422 } } : { data: { user: { id: "registered-user" } }, error: null };
    },
    deleteUser: async () => { calls.push("deleteUser"); return { error: options.cleanupFails ? { message: "Unavailable" } : null }; },
  } } } as unknown as SupabaseClient;
  const request = (body: unknown = input, token = true) => new Request("https://example.invalid/register", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer fixture" } : {}) }, body: JSON.stringify(body) });
  return { calls, run: (body: unknown = input, token = true) => registerOrganizer(request(body, token), caller, service) };
}

test("registration authenticates and checks the current administrator before privileged calls", async () => {
  for (const options of [{ signedIn: false }, { admin: false }]) {
    const state = fixture(options);
    assert.equal((await state.run()).status, options.signedIn === false ? 401 : 403);
    assert.equal(state.calls.includes("createUser"), false);
  }
  const state = fixture(); assert.equal((await state.run(input, false)).status, 401); assert.deepEqual(state.calls, []);
});
test("registration rejects role injection, malformed input, weak passwords and wrong academic scope", async () => {
  for (const body of [null, [], { ...input, role: "event_admin" }, { ...input, password: "short" }, { ...input, email: "invalid" }]) {
    const state = fixture(); assert.equal((await state.run(body)).status, 400); assert.equal(state.calls.includes("createUser"), false);
  }
  const state = fixture({ program: false }); assert.equal((await state.run()).status, 400); assert.equal(state.calls.includes("createUser"), false);
});
test("new registration confirms only after Auth creation and trusted assignment, without returning passwords", async () => {
  const state = fixture(); const response = await state.run(); assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { user_id: "registered-user", existingAccount: false });
  assert.deepEqual(state.calls, ["has_role", "createUser", "admin_assign_organizer"]);
});
test("existing member accounts retain their password and are never deleted on assignment denial", async () => {
  const state = fixture({ existing: true }); const response = await state.run(); assert.equal(response.status, 200);
  assert.equal((await response.json()).existingAccount, true);
  const denied = fixture({ existing: true, assignmentError: { code: "23514", message: "Different access" }, status: 400 });
  assert.equal((await denied.run()).status, 400); assert.equal(denied.calls.includes("deleteUser"), false);
});
test("only definite assignment rejections clean up a newly created account", async () => {
  const rejected = fixture({ assignmentError: { code: "42501", message: "Revoked access" }, status: 403 });
  assert.equal((await rejected.run()).status, 400); assert.equal(rejected.calls.at(-1), "deleteUser");
  for (const options of [{ assignmentError: { code: "08006", message: "Unknown outcome" }, status: 503 }, { throws: true }]) {
    const state = fixture(options); assert.equal((await state.run()).status, 503); assert.equal(state.calls.includes("deleteUser"), false);
  }
  const failed = fixture({ assignmentError: { code: "42501", message: "Revoked" }, status: 403, cleanupFails: true });
  const response = await failed.run(); assert.equal(response.status, 500); assert.match((await response.json()).error, /Retry registration/);
});
