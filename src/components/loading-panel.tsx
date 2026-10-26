import { LoaderCircle } from "lucide-react";

export function LoadingPanel({ children = "Loading campus events…" }: { children?: React.ReactNode }) {
  return <div className="loading-panel" role="status"><span className="loading-emblem"><LoaderCircle size={30} className="loading-spinner" aria-hidden="true" /></span><p>{children}</p></div>;
}
