"use client";

import type { Country } from "../lib/game/types";
import { Button } from "./Button";

export type CurrentCountryProps = {
  country: Country | null;
  onPass: () => void;
  disabled?: boolean;
};

export const CurrentCountry = ({ country, onPass, disabled }: CurrentCountryProps) => {
  if (!country) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
        En attente du prochain pays…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-2xl font-bold text-accent">
          {country.name.slice(0, 1)}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{country.name}</h2>
          <p className="text-sm text-slate-400">
            Sélectionne la règle qui correspond à ce pays ou appuie sur « Passer ».
          </p>
        </div>
      </div>
      <Button variant="secondary" onClick={onPass} disabled={disabled}>
        Passer
      </Button>
    </div>
  );
};
