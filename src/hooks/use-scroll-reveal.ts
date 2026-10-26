"use client";

import { useEffect, type RefObject } from "react";

export function useScrollReveal(root: RefObject<HTMLElement | null>, contentKey: string) {
  useEffect(() => {
    if (!root.current || !window.IntersectionObserver || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = [...root.current.querySelectorAll<HTMLElement>("[data-reveal]:not(.reveal-seen)")];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("reveal-seen");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    for (const element of elements) {
      if (element.getBoundingClientRect().top >= window.innerHeight) element.classList.add("reveal-pending");
      observer.observe(element);
    }
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const showAll = () => { if (motion.matches) { elements.forEach(element => element.classList.remove("reveal-pending")); observer.disconnect(); } };
    motion.addEventListener("change", showAll);
    return () => { observer.disconnect(); elements.forEach(element => element.classList.remove("reveal-pending")); motion.removeEventListener("change", showAll); };
  }, [root, contentKey]);
}
