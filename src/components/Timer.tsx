"use client";

import type { Phase } from "../lib/game/types";

const phaseLabel: Record<Phase, string> = {
  lobby: "Lobby",
  countdown: "Préparation",
  playing: "En cours",
  reveal: "Scores",
  ended: "Terminé",
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
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs uppercase text-slate-500">Phase</p>
        <p className="text-lg font-semibold text-slate-900">{phaseLabel[phase]}</p>
      </div>
      <div className="text-3xl font-bold text-blue-600">{formatted}</div>
    </div>
  );
};
