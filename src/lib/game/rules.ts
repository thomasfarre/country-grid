import type { BoardSlot, Country, Rule, RuleHint } from "./types";
import { createRNG } from "../rng";

export type RuleKind = "equality" | "comparison" | "category";

type RuleBlueprint = {
  id: string;
  label: string;
  kind: RuleKind;
  primaryCountry: string;
  predicate: (country: Country) => boolean;
  conflictCodes: string[];
  hint?: RuleHint;
};

type CategoryBlueprint = RuleBlueprint & { kind: "category" };

const comparisonBlueprints: RuleBlueprint[] = [
  {
    id: "population-gt-100m",
    label: "Population > 100M",
    kind: "comparison",
    primaryCountry: "BR",
    predicate: (country) => country.population > 100_000_000,
    conflictCodes: ["BR"],
  },
  {
    id: "gdp-lt-200b",
    label: "PIB < 200 Md$",
    kind: "comparison",
    primaryCountry: "KE",
    predicate: (country) => country.gdp_usd < 200_000_000_000,
    conflictCodes: ["KE"],
  },
];

const categoryBlueprint: CategoryBlueprint = {
  id: "continent-europe",
  label: "Pays d'Europe",
  kind: "category",
  primaryCountry: "FR",
  predicate: (country) => country.continent === "Europe",
  conflictCodes: ["FR", "DE", "GB"],
};

const equalityBlueprints: RuleBlueprint[] = [
  {
    id: "capital-lima",
    label: "Capitale = Lima",
    kind: "equality",
    primaryCountry: "PE",
    predicate: (country) => country.capital === "Lima",
    conflictCodes: ["PE"],
  },
  {
    id: "capital-bogota",
    label: "Capitale = Bogotá",
    kind: "equality",
    primaryCountry: "CO",
    predicate: (country) => country.capital === "Bogotá",
    conflictCodes: ["CO"],
  },
  {
    id: "capital-santiago",
    label: "Capitale = Santiago",
    kind: "equality",
    primaryCountry: "CL",
    predicate: (country) => country.capital === "Santiago",
    conflictCodes: ["CL"],
  },
  {
    id: "capital-buenos-aires",
    label: "Capitale = Buenos Aires",
    kind: "equality",
    primaryCountry: "AR",
    predicate: (country) => country.capital === "Buenos Aires",
    conflictCodes: ["AR"],
  },
  {
    id: "capital-ottawa",
    label: "Capitale = Ottawa",
    kind: "equality",
    primaryCountry: "CA",
    predicate: (country) => country.capital === "Ottawa",
    conflictCodes: ["CA"],
  },
  {
    id: "capital-canberra",
    label: "Capitale = Canberra",
    kind: "equality",
    primaryCountry: "AU",
    predicate: (country) => country.capital === "Canberra",
    conflictCodes: ["AU"],
  },
  {
    id: "capital-mexico-city",
    label: "Capitale = Mexico",
    kind: "equality",
    primaryCountry: "MX",
    predicate: (country) => country.capital === "Mexico City",
    conflictCodes: ["MX"],
  },
  {
    id: "capital-wellington",
    label: "Capitale = Wellington",
    kind: "equality",
    primaryCountry: "NZ",
    predicate: (country) => country.capital === "Wellington",
    conflictCodes: ["NZ"],
  },
  {
    id: "capital-seoul",
    label: "Capitale = Seoul",
    kind: "equality",
    primaryCountry: "KR",
    predicate: (country) => country.capital === "Seoul",
    conflictCodes: ["KR"],
  },
  {
    id: "capital-bangkok",
    label: "Capitale = Bangkok",
    kind: "equality",
    primaryCountry: "TH",
    predicate: (country) => country.capital === "Bangkok",
    conflictCodes: ["TH"],
  },
  {
    id: "capital-hanoi",
    label: "Capitale = Hanoï",
    kind: "equality",
    primaryCountry: "VN",
    predicate: (country) => country.capital === "Hanoi",
    conflictCodes: ["VN"],
  },
  {
    id: "capital-manila",
    label: "Capitale = Manille",
    kind: "equality",
    primaryCountry: "PH",
    predicate: (country) => country.capital === "Manila",
    conflictCodes: ["PH"],
  },
  {
    id: "capital-kuala-lumpur",
    label: "Capitale = Kuala Lumpur",
    kind: "equality",
    primaryCountry: "MY",
    predicate: (country) => country.capital === "Kuala Lumpur",
    conflictCodes: ["MY"],
  },
  {
    id: "capital-riyadh",
    label: "Capitale = Riyad",
    kind: "equality",
    primaryCountry: "SA",
    predicate: (country) => country.capital === "Riyadh",
    conflictCodes: ["SA"],
  },
  {
    id: "capital-abu-dhabi",
    label: "Capitale = Abou Dabi",
    kind: "equality",
    primaryCountry: "AE",
    predicate: (country) => country.capital === "Abu Dhabi",
    conflictCodes: ["AE"],
  },
  {
    id: "capital-cairo",
    label: "Capitale = Le Caire",
    kind: "equality",
    primaryCountry: "EG",
    predicate: (country) => country.capital === "Cairo",
    conflictCodes: ["EG"],
  },
  {
    id: "capital-rabat",
    label: "Capitale = Rabat",
    kind: "equality",
    primaryCountry: "MA",
    predicate: (country) => country.capital === "Rabat",
    conflictCodes: ["MA"],
  },
  {
    id: "capital-accra",
    label: "Capitale = Accra",
    kind: "equality",
    primaryCountry: "GH",
    predicate: (country) => country.capital === "Accra",
    conflictCodes: ["GH"],
  },
  {
    id: "capital-pretoria",
    label: "Capitale = Pretoria",
    kind: "equality",
    primaryCountry: "ZA",
    predicate: (country) => country.capital === "Pretoria",
    conflictCodes: ["ZA"],
  },
  {
    id: "capital-algiers",
    label: "Capitale = Alger",
    kind: "equality",
    primaryCountry: "DZ",
    predicate: (country) => country.capital === "Algiers",
    conflictCodes: ["DZ"],
  },
  {
    id: "capital-baghdad",
    label: "Capitale = Bagdad",
    kind: "equality",
    primaryCountry: "IQ",
    predicate: (country) => country.capital === "Baghdad",
    conflictCodes: ["IQ"],
  },
  {
    id: "capital-addis-ababa",
    label: "Capitale = Addis-Abeba",
    kind: "equality",
    primaryCountry: "ET",
    predicate: (country) => country.capital === "Addis Ababa",
    conflictCodes: ["ET"],
  },
  {
    id: "capital-dodoma",
    label: "Capitale = Dodoma",
    kind: "equality",
    primaryCountry: "TZ",
    predicate: (country) => country.capital === "Dodoma",
    conflictCodes: ["TZ"],
  },
  {
    id: "capital-freetown",
    label: "Capitale = Freetown",
    kind: "equality",
    primaryCountry: "SL",
    predicate: (country) => country.capital === "Freetown",
    conflictCodes: ["SL"],
  },
  {
    id: "capital-muscat",
    label: "Capitale = Mascate",
    kind: "equality",
    primaryCountry: "OM",
    predicate: (country) => country.capital === "Muscat",
    conflictCodes: ["OM"],
  },
  {
    id: "capital-montevideo",
    label: "Capitale = Montevideo",
    kind: "equality",
    primaryCountry: "UY",
    predicate: (country) => country.capital === "Montevideo",
    conflictCodes: ["UY"],
  },
];

const flagBlueprints: RuleBlueprint[] = [
  {
    id: "flag-canada",
    label: "Associer au drapeau",
    kind: "equality",
    primaryCountry: "CA",
    predicate: (country) => country.code === "CA",
    conflictCodes: ["CA"],
    hint: { type: "flag", code: "CA" },
  },
  {
    id: "flag-australia",
    label: "Associer au drapeau",
    kind: "equality",
    primaryCountry: "AU",
    predicate: (country) => country.code === "AU",
    conflictCodes: ["AU"],
    hint: { type: "flag", code: "AU" },
  },
  {
    id: "flag-chile",
    label: "Associer au drapeau",
    kind: "equality",
    primaryCountry: "CL",
    predicate: (country) => country.code === "CL",
    conflictCodes: ["CL"],
    hint: { type: "flag", code: "CL" },
  },
  {
    id: "flag-uruguay",
    label: "Associer au drapeau",
    kind: "equality",
    primaryCountry: "UY",
    predicate: (country) => country.code === "UY",
    conflictCodes: ["UY"],
    hint: { type: "flag", code: "UY" },
  },
];

export type GeneratedBoard = {
  rules: Rule[];
  board: BoardSlot[];
  ruleMatches: Record<string, string[]>;
  assignedMatches: Record<string, string>;
};

const BOARD_SIZE = 10;
const REQUIRED_FLAG_COUNT = 1;
const REQUIRED_EQUALITY_COUNT =
  BOARD_SIZE - (comparisonBlueprints.length + REQUIRED_FLAG_COUNT + 1);

export const generateBoard = (seed: string, countries: Country[]): GeneratedBoard => {
  const rng = createRNG(`${seed}-rules`);
  const selectedBlueprints: RuleBlueprint[] = [];
  const usedCodes = new Set<string>();
  const ruleMatches: Record<string, string[]> = {};
  const assignedMatches: Record<string, string> = {};

  // Include mandatory comparison rules first
  comparisonBlueprints.forEach((blueprint) => {
    const hasCandidate = countries.some((country) => blueprint.predicate(country));
    if (!hasCandidate) {
      throw new Error(`No candidate country found for rule ${blueprint.id}`);
    }
    if (blueprint.conflictCodes.some((code) => usedCodes.has(code))) {
      throw new Error(`Conflict while assigning rule ${blueprint.id}`);
    }
    selectedBlueprints.push(blueprint);
    blueprint.conflictCodes.forEach((code) => usedCodes.add(code));
    ruleMatches[blueprint.id] = [...blueprint.conflictCodes];
    assignedMatches[blueprint.id] = blueprint.primaryCountry;
  });

  // Add the category rule
  const categoryHasCandidate = countries.some((country) => categoryBlueprint.predicate(country));
  if (!categoryHasCandidate) {
    throw new Error(`No candidate country found for rule ${categoryBlueprint.id}`);
  }
  if (categoryBlueprint.conflictCodes.some((code) => usedCodes.has(code))) {
    throw new Error(`Conflict while assigning category rule ${categoryBlueprint.id}`);
  }
  selectedBlueprints.push(categoryBlueprint);
  categoryBlueprint.conflictCodes.forEach((code) => usedCodes.add(code));
  ruleMatches[categoryBlueprint.id] = [...categoryBlueprint.conflictCodes];
  const europeanCandidates = categoryBlueprint.conflictCodes;
  const selectedEuropean = europeanCandidates[rng.nextInt(europeanCandidates.length)];
  assignedMatches[categoryBlueprint.id] = selectedEuropean;

  const availableFlags = flagBlueprints.filter(
    (blueprint) => !blueprint.conflictCodes.some((code) => usedCodes.has(code)),
  );

  if (availableFlags.length < REQUIRED_FLAG_COUNT) {
    throw new Error("Not enough flag rules available to generate board");
  }

  const selectedFlags = rng.shuffle(availableFlags).slice(0, REQUIRED_FLAG_COUNT);
  selectedFlags.forEach((blueprint) => {
    selectedBlueprints.push(blueprint);
    blueprint.conflictCodes.forEach((code) => usedCodes.add(code));
    ruleMatches[blueprint.id] = [...blueprint.conflictCodes];
    assignedMatches[blueprint.id] = blueprint.primaryCountry;
  });

  // Choose equality rules to reach required board size (10)
  const availableEquality = equalityBlueprints.filter((blueprint) => {
    if (blueprint.conflictCodes.some((code) => usedCodes.has(code))) {
      return false;
    }
    return countries.some((country) => blueprint.predicate(country));
  });

  if (availableEquality.length < REQUIRED_EQUALITY_COUNT) {
    throw new Error("Not enough equality rules available to generate board");
  }

  const equalitySelection = rng.shuffle(availableEquality).slice(0, REQUIRED_EQUALITY_COUNT);
  equalitySelection.forEach((blueprint) => {
    selectedBlueprints.push(blueprint);
    blueprint.conflictCodes.forEach((code) => usedCodes.add(code));
    ruleMatches[blueprint.id] = [...blueprint.conflictCodes];
    assignedMatches[blueprint.id] = blueprint.primaryCountry;
  });

  if (selectedBlueprints.length !== 10) {
    throw new Error(`Board generation produced ${selectedBlueprints.length} rules instead of 10`);
  }

  // Build Rule objects keeping validation deterministic
  const orderedBlueprints = rng.shuffle([...selectedBlueprints]);

  const rules: Rule[] = orderedBlueprints.map((blueprint) => ({
    id: blueprint.id,
    label: blueprint.label,
    validate: blueprint.predicate,
    hint: blueprint.hint,
  }));

  const board: BoardSlot[] = rules.map((rule, index) => ({
    index,
    ruleId: rule.id,
    solvedBy: undefined,
    correct: undefined,
    countryCode: undefined,
  }));

  return {
    rules,
    board,
    ruleMatches,
    assignedMatches,
  };
};
