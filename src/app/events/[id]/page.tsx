import { EventDetailPage } from "@/components/event-detail-page";

export const metadata = { title: "Event details | PHINMA UI Event" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetailPage key={id} id={id} />;
}
