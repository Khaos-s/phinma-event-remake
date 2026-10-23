import { Check, Clock3, Radio, X } from "lucide-react";
import type { EventRow, EventStage } from "@/lib/events";

export function EventStatus({ status }: { status: EventRow["status"] | EventStage }) {
  const Icon = status === "rejected" ? X : status === "pending" || status === "upcoming" ? Clock3 : status === "ongoing" ? Radio : Check;
  const label = status === "approved" ? "Published" : status;
  return <span className={`status-badge status-${status}`}><Icon size={13} aria-hidden="true" />{label}</span>;
}
