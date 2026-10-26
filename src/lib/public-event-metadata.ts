import type { Metadata } from "next";

export async function publicEventMetadata(id: string): Promise<Metadata> {
  const fallback = { title: "Event details | PHINMA UI Event", description: "Discover approved PHINMA University of Iloilo events." };
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return { ...fallback, robots: { index: false } };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallback;
  try {
    // An anonymous, approved-only request keeps privileged sessions out of shared metadata.
    const response = await fetch(`${url}/rest/v1/events?select=title,description&id=eq.${id}&status=eq.approved`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!response.ok) return fallback;
    const rows: unknown = await response.json();
    const event = Array.isArray(rows) ? rows[0] : null;
    if (!event || typeof event.title !== "string" || typeof event.description !== "string") return { ...fallback, robots: { index: false } };
    const title = `${event.title} | PHINMA UI Event`;
    const description = event.description.replace(/\s+/g, " ").trim().slice(0, 160);
    const canonical = `https://phinma-ui-event.vercel.app/events/${id}`;
    return { title, description, alternates: { canonical }, openGraph: { title, description, type: "website", url: canonical, siteName: "PHINMA UI Event" } };
  } catch { return fallback; }
}
