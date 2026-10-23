export type AppRole = "member" | "cite_organizer" | "event_admin";

export const roleLabels: Record<AppRole, string> = {
  member: "University member",
  cite_organizer: "CITE Council organizer",
  event_admin: "PHINMA Event administrator",
};

export function resolveRole(value: unknown): AppRole {
  return value === "cite_organizer" || value === "event_admin" ? value : "member";
}

export function roleHome(role: AppRole | null): string {
  if (role === "event_admin") return "/admin";
  if (role === "cite_organizer") return "/organizer";
  return "/account";
}
