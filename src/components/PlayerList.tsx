"use client";

import clsx from "clsx";
import type { Player } from "../lib/game/types";

export type PlayerListProps = {
  players: Player[];
  selfId?: string;
  showScores?: boolean;
};

export const PlayerList = ({ players, selfId, showScores = true }: PlayerListProps) => {
  const sorted = showScores ? [...players].sort((a, b) => b.score - a.score) : [...players];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Joueurs</h3>
      <ul className="flex flex-col gap-2">
        {sorted.map((player) => (
          <li
            key={player.id}
            className={clsx(
              "flex items-center justify-between rounded-md border border-slate-200 px-3 py-2",
              player.connected ? "bg-slate-100" : "bg-slate-200/80",
              player.id === selfId && "border-blue-400",
            )}
          >
            <span className="text-sm font-medium text-slate-900">
              {player.nickname}
              {player.id === selfId ? " (toi)" : ""}
            </span>
            <span className="text-xs text-slate-500">
              {player.connected ? "connecté" : "déconnecté"}
            </span>
            <span className="text-base font-semibold text-blue-600">
              {showScores ? player.score : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
