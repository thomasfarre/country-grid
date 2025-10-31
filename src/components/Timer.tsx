"use client";

import type { Phase } from "../lib/game/types";

const phaseLabel: Record<Phase, string> = {
  lobby: "Lobby",
  countdown: "Préparation",
  playing: "En cours",
  reveal: "Scores",
  ended: "Terminé"
};

export type TimerProps = {
  phase: Phase;
  timeLeft: number;
};

export const Timer = ({ phase, timeLeft }: TimerProps) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div>
        <p className="text-xs uppercase text-slate-400">Phase</p>
        <p className="text-lg font-semibold text-white">{phaseLabel[phase]}</p>
      </div>
      <div className="text-3xl font-bold text-accent">{formatted}</div>
    </div>
  );
};
