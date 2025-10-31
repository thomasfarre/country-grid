import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Grid",
  description: "Fast-paced multiplayer geography challenge"
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Country Grid";

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-950 text-slate-100">
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
            <span className="text-sm text-slate-400">Multiplayer country matching game</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-6 min-h-[calc(100vh-5rem)]">{children}</main>
      </body>
    </html>
  );
}
