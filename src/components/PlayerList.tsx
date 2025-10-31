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
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase text-slate-400">Joueurs</h3>
      <ul className="flex flex-col gap-2">
        {sorted.map((player) => (
          <li
            key={player.id}
            className={clsx(
              "flex items-center justify-between rounded-md border border-transparent px-3 py-2",
              player.connected ? "bg-slate-800/60" : "bg-slate-900/40",
              player.id === selfId && "border-accent"
            )}
          >
            <span className="text-sm font-medium text-white">
              {player.nickname}
              {player.id === selfId ? " (toi)" : ""}
            </span>
            <span className="text-xs text-slate-400">
              {player.connected ? "connecté" : "déconnecté"}
            </span>
            <span className="text-base font-semibold text-accent">
              {showScores ? player.score : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
