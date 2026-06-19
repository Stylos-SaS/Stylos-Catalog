import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Toaster } from "sonner";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster position="top-right" theme="light" />
      <FloatingWhatsApp />
    </div>
  );
}

function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/573014039265"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[oklch(0.7_0.15_155)] text-white shadow-pop transition hover:scale-105"
      aria-label="WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M20.52 3.48A11.92 11.92 0 0012.04 0C5.5 0 .17 5.33.17 11.87c0 2.1.55 4.13 1.6 5.93L0 24l6.34-1.66a11.86 11.86 0 005.7 1.45h.01c6.54 0 11.87-5.32 11.87-11.86 0-3.17-1.24-6.15-3.4-8.45zM12.05 21.4a9.5 9.5 0 01-4.85-1.33l-.35-.2-3.76.99 1-3.66-.23-.38a9.55 9.55 0 1117.36-5.04 9.5 9.5 0 01-9.17 9.62z" />
      </svg>
    </a>
  );
}

export { Link };
