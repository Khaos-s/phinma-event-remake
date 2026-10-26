import { EventDetailPage } from "@/components/event-detail-page";
import { publicEventMetadata } from "@/lib/public-event-metadata";

export async function generateMetadata({ params }: PageProps<"/events/[id]">) {
  return publicEventMetadata((await params).id);
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventDetailPage key={id} id={id} />;
}
