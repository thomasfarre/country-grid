"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./Button";

const NICKNAME_STORAGE_KEY = "country-grid:nickname";

export const Matchmaking = () => {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(NICKNAME_STORAGE_KEY);
    if (stored) {
      setNickname(stored);
    }
  }, []);

  const handlePlay = () => {
    const trimmed = nickname.trim() || "Invité";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, trimmed);
    }
    router.push(`/play?room=quick&nickname=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <label className="text-left text-sm font-medium text-slate-600">Choisis ton pseudo</label>
      <input
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-500 focus:outline-none"
        placeholder="GeoMaster"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
      />
      <Button onClick={handlePlay}>Jouer maintenant</Button>
    </div>
  );
};
