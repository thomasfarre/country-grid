import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Country Grid",
  description: "Fast-paced multiplayer geography challenge",
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Country Grid";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <header className="px-6 py-4 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-5xl flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight text-slate-900">{APP_NAME}</span>
            <span className="text-sm text-slate-500">Parties rapides de matching géographique</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8 min-h-[calc(100vh-5rem)]">{children}</main>
      </body>
    </html>
  );
}
