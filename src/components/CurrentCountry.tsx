"use client";

import type { Country } from "../lib/game/types";
import { Button } from "./Button";

export type CurrentCountryProps = {
  country: Country | null;
  currentIndex: number;
  total: number;
  onPass: () => void;
  disabled?: boolean;
};

export const CurrentCountry = ({
  country,
  currentIndex,
  total,
  onPass,
  disabled,
}: CurrentCountryProps) => {
  if (!country) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        En attente du prochain pays…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-2xl font-bold text-blue-600">
          {country.name.slice(0, 1)}
        </span>
        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{country.name}</h2>
            <span className="text-sm text-slate-500">
              {Math.min(currentIndex, total)}/{total}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Sélectionne la caractéristique qui correspond à ce pays ou appuie sur « Passer ».
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={onPass} disabled={disabled}>
        Passer
      </Button>
    </div>
  );
};
