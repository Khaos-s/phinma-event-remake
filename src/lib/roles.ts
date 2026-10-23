export type AppRole = "member" | "organizer" | "event_admin";

export type Organization = { id: string; name: string; department: string };

export const roleLabels: Record<AppRole, string> = {
  member: "University member",
  organizer: "Event organizer",
  event_admin: "PHINMA Event administrator",
};

export function resolveRole(value: unknown): AppRole {
  if (value === "cite_organizer") return "organizer";
  return value === "organizer" || value === "event_admin" ? value : "member";
}

export function roleHome(role: AppRole | null): string {
  if (role === "event_admin") return "/admin";
  if (role === "organizer") return "/organizer";
  return "/account";
}
