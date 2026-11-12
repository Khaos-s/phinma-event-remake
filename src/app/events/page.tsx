import { EventBrowser } from "@/components/event-browser";

export const metadata = { title: "All events | PHINMA UI Event" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").slice(0, 200);
  return <EventBrowser key={query} initialSearch={query} />;
}
