export type PlacementResult = "correct" | "incorrect" | "pass";

const SCORE_MAP: Record<PlacementResult, number> = {
  correct: 10,
  incorrect: -5,
  pass: 0
};

export const scoreDelta = (result: PlacementResult): number => SCORE_MAP[result];

export const computeScore = (results: PlacementResult[]): number =>
  results.reduce((total, result) => total + scoreDelta(result), 0);

export const applyScore = (current: number, result: PlacementResult): number => current + scoreDelta(result);
