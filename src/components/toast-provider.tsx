"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };
const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

function ToastItem({ toast, dismiss }: { toast: Toast; dismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss(toast.id), 8000);
    return () => clearTimeout(timer);
  }, [toast.id, paused, dismiss]);
  const Icon = toast.tone === "success" ? CircleCheck : toast.tone === "error" ? CircleAlert : Info;
  return <li className={`toast toast-${toast.tone}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}><Icon size={20} aria-hidden="true" /><p>{toast.message}</p><button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={17} aria-hidden="true" /></button></li>;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const notify = useCallback((message: string, tone: Tone = "success") => {
    const id = ++nextId.current;
    setToasts(current => current.some(item => item.message === message && item.tone === tone) ? current : [...current.slice(-2), { id, message, tone }]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(current => current.filter(item => item.id !== id)), []);
  return <ToastContext.Provider value={notify}>{children}<section className="toast-region" aria-label="Notifications"><ul aria-live="polite" aria-relevant="additions text">{toasts.map(toast => <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />)}</ul></section></ToastContext.Provider>;
}

export function useToast() { return useContext(ToastContext); }

// Keep existing inline feedback available after the transient notification closes.
export function useFeedbackToasts(error: string, notice: string) {
  const notify = useToast();
  useEffect(() => { if (error) notify(error, "error"); }, [error, notify]);
  useEffect(() => { if (notice) notify(notice); }, [notice, notify]);
}
