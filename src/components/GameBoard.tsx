"use client";

import clsx from "clsx";
import type { BoardSlot, Player, Rule } from "../lib/game/types";

export type GameBoardProps = {
  board: BoardSlot[];
  rules: Rule[];
  players: Player[];
  onSelect: (slotIndex: number) => void;
  disabled?: boolean;
  showReveal?: boolean;
};

const findRuleLabel = (rules: Rule[], ruleId: string) => rules.find((rule) => rule.id === ruleId)?.label ?? "?";

const playerNickname = (players: Player[], id?: string) => players.find((player) => player.id === id)?.nickname;

export const GameBoard = ({
  board,
  rules,
  players,
  onSelect,
  disabled,
  showReveal = false
}: GameBoardProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {board.map((slot) => {
        const solvedNickname = playerNickname(players, slot.solvedBy);
        const isSolved = Boolean(solvedNickname);
        const isReveal = showReveal && slot.correct !== undefined;
        const statusLabel = (() => {
          if (!isSolved) return "Disponible";
          if (!isReveal) return `Attribué à ${solvedNickname}`;
          const codeSuffix = slot.countryCode ? ` (${slot.countryCode})` : "";
          return slot.correct
            ? `✅ ${solvedNickname}${codeSuffix}`
            : `❌ ${solvedNickname}${codeSuffix}`;
        })();
        const statusColor = !isSolved
          ? "text-slate-400"
          : isReveal
          ? slot.correct
            ? "text-green-400"
            : "text-red-400"
          : "text-slate-200";
        return (
          <button
            key={slot.index}
            type="button"
            disabled={disabled || isSolved}
            onClick={() => onSelect(slot.index)}
            className={clsx(
              "flex h-32 flex-col justify-between rounded-lg border border-slate-700 p-4 text-left transition",
              disabled && "cursor-not-allowed opacity-60",
              !disabled && !isSolved && "hover:border-accent hover:bg-slate-800/50",
              isReveal && slot.correct === false && "border-red-500 bg-red-900/10",
              isReveal && slot.correct === true && "border-green-500 bg-green-900/20",
              !isReveal && isSolved && "border-slate-500 bg-slate-900/50"
            )}
            data-rule-id={slot.ruleId}
            data-slot-index={slot.index}
          >
            <span className="text-sm font-semibold text-accent">
              Case {slot.index + 1}
            </span>
            <p className="text-base font-medium text-white">{findRuleLabel(rules, slot.ruleId)}</p>
            <span className={clsx("text-xs", statusColor)}>{statusLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
