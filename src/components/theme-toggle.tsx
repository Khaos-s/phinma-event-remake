"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(update: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  function sync() {
    let stored;
    try { stored = localStorage.getItem("phinma-theme"); } catch {}
    document.documentElement.dataset.theme = stored === "dark" || stored === "light" ? stored : media.matches ? "dark" : "light";
    update();
  }
  sync();
  window.addEventListener("phinma-theme-change", update);
  window.addEventListener("storage", sync);
  media.addEventListener("change", sync);
  return () => { window.removeEventListener("phinma-theme-change", update); window.removeEventListener("storage", sync); media.removeEventListener("change", sync); };
}
const snapshot = () => document.documentElement.dataset.theme === "dark";
const serverSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  function toggle() {
    const theme = dark ? "light" : "dark";
    try { localStorage.setItem("phinma-theme", theme); } catch {}
    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(new Event("phinma-theme-change"));
  }
  return <button type="button" className="icon-button theme-toggle" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={toggle}>{dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}</button>;
}
