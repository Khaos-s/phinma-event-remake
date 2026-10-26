"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Expand, X, ZoomIn, ZoomOut } from "lucide-react";

export function PosterViewer({ imageUrl, title }: { imageUrl: string; title: string }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  return <>
    <button type="button" className="poster-open" aria-label={`View full poster for ${title}`} onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt={`Poster for ${title}`} /><span><Expand size={16} aria-hidden="true" />View full poster</span>
    </button>
    <dialog ref={dialog} className="poster-lightbox" aria-labelledby={titleId} onClose={() => { setOpen(false); setZoomed(false); }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className="poster-lightbox-toolbar"><h2 id={titleId}>{title} — poster</h2><button type="button" className="text-link" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? <ZoomOut size={18} aria-hidden="true" /> : <ZoomIn size={18} aria-hidden="true" />}{zoomed ? "Fit image" : "Zoom in"}</button><button type="button" className="icon-button" aria-label="Close poster" onClick={() => dialog.current?.close()} autoFocus><X size={20} /></button></div>
      <div className={`poster-zoom-area ${zoomed ? "is-zoomed" : ""}`} tabIndex={0} aria-label="Event poster; scroll to explore when zoomed">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={`Full poster for ${title}`} />
      </div>
    </dialog>
  </>;
}
