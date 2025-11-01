"use client";

import clsx from "clsx";
import ReactCountryFlag from "react-country-flag";
import type { BoardSlot, Rule, Country } from "../lib/game/types";
import { COUNTRIES } from "../lib/dataset";

export type GameBoardProps = {
  board: BoardSlot[];
  rules: Rule[];
  onSelect: (slotIndex: number) => void;
  disabled?: boolean;
  showReveal?: boolean;
};

const getRule = (rules: Rule[], ruleId: string) => rules.find((rule) => rule.id === ruleId);
const COUNTRY_INDEX = COUNTRIES.reduce<Record<string, Country>>((acc, country) => {
  acc[country.code] = country;
  return acc;
}, {});

export const GameBoard = ({
  board,
  rules,
  onSelect,
  disabled,
  showReveal = false,
}: GameBoardProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {board.map((slot) => {
        const rule = getRule(rules, slot.ruleId);
        const ruleLabel = rule?.label?.trim() ?? "";
        const ruleHint = rule?.hint;
        const country = slot.countryCode ? COUNTRY_INDEX[slot.countryCode] : undefined;
        const countryLabel = country?.name ?? slot.countryCode ?? "-";
        const isSolved = Boolean(slot.solvedBy);
        const isReveal = showReveal && slot.correct !== undefined;
        const statusLabel = (() => {
          if (!isSolved) return "Disponible";
          if (!isReveal) return `Pays placé : ${countryLabel}`;
          return slot.correct ? `✅ ${countryLabel}` : `❌ ${countryLabel}`;
        })();
        const statusColor = !isSolved
          ? "text-slate-400"
          : isReveal
            ? slot.correct
              ? "text-emerald-600"
              : "text-red-500"
            : "text-slate-500";
        return (
          <button
            key={slot.index}
            type="button"
            disabled={disabled || isSolved}
            onClick={() => onSelect(slot.index)}
            className={clsx(
              "flex h-40 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition",
              disabled && "cursor-not-allowed opacity-60",
              !disabled && !isSolved && "hover:shadow-md",
              isReveal && slot.correct === false && "border-red-200 bg-red-50",
              isReveal && slot.correct === true && "border-emerald-200 bg-emerald-50",
              !isReveal && isSolved && "border-slate-200 bg-slate-100",
            )}
            data-rule-id={slot.ruleId}
            data-slot-index={slot.index}
          >
            <div className="flex items-center justify-between gap-2">
              {ruleLabel.length > 0 ? (
                <p className="text-base font-semibold text-slate-900">{ruleLabel}</p>
              ) : (
                <span className="text-base font-semibold text-slate-900">&nbsp;</span>
              )}
              {ruleHint?.type === "flag" ? (
                <span className="h-10 w-16 overflow-hidden rounded border border-slate-200">
                  <ReactCountryFlag
                    countryCode={ruleHint.code}
                    svg
                    style={{ width: "100%", height: "100%" }}
                    aria-label={ruleHint.code}
                  />
                </span>
              ) : null}
            </div>
            <span className={clsx("text-xs", statusColor)}>{statusLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
