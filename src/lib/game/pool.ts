import type { Country } from "./types";
import type { GeneratedBoard } from "./rules";
import { createRNG } from "../rng";

export type GeneratedPool = {
  pool: Country[];
  validCountries: Country[];
};

export const generatePool = (
  seed: string,
  countries: Country[],
  generated: GeneratedBoard
): GeneratedPool => {
  const { assignedMatches, ruleMatches } = generated;
  const validCodes = Object.values(assignedMatches);
  if (validCodes.length !== generated.rules.length) {
    throw new Error("Assigned matches count does not match rules");
  }

  const validCountries = validCodes
    .map((code) => {
      const country = countries.find((c) => c.code === code);
      if (!country) {
        throw new Error(`Missing country for code ${code}`);
      }
      return country;
    })
    .filter((country, index, arr) => arr.findIndex((c) => c.code === country.code) === index);

  if (validCountries.length !== generated.rules.length) {
    throw new Error("Duplicate country assignment detected while building pool");
  }

  const forbiddenCodes = new Set<string>();
  Object.values(ruleMatches).forEach((codes) => codes.forEach((code) => forbiddenCodes.add(code)));

  const fillerCandidates = countries.filter((country) => !forbiddenCodes.has(country.code));
  const REQUIRED_POOL_SIZE = 30;
  const fillerNeeded = REQUIRED_POOL_SIZE - validCountries.length;

  if (fillerCandidates.length < fillerNeeded) {
    throw new Error("Not enough filler countries to build pool");
  }

  const rng = createRNG(`${seed}-pool`);
  const filler = rng.shuffle(fillerCandidates).slice(0, fillerNeeded);
  const pool = rng.shuffle([...validCountries, ...filler]);

  return {
    pool,
    validCountries
  };
};
