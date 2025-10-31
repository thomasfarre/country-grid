import { describe, expect, it } from "vitest";
import { COUNTRIES } from "../../lib/dataset";
import { generateBoard } from "../../lib/game/rules";
import { generatePool } from "../../lib/game/pool";

const SEED = "test-seed";

describe("generatePool", () => {
  it("builds a pool of 30 countries with exactly 10 valid matches", () => {
    const board = generateBoard(SEED, COUNTRIES);
    const pool = generatePool(SEED, COUNTRIES, board);

    expect(pool.pool).toHaveLength(30);
    expect(pool.validCountries).toHaveLength(board.rules.length);

    const validCodes = new Set(pool.validCountries.map((country) => country.code));
    const poolCodes = new Set(pool.pool.map((country) => country.code));

    // All valid countries must be present in the pool
    pool.validCountries.forEach((country) => {
      expect(poolCodes.has(country.code)).toBe(true);
    });

    // Each rule must accept exactly one valid country from the pool
    board.rules.forEach((rule) => {
      const matches = pool.validCountries.filter((country) => rule.validate(country));
      expect(matches).toHaveLength(1);
    });

    // Filler countries should not satisfy any rule
    const filler = pool.pool.filter((country) => !validCodes.has(country.code));
    filler.forEach((country) => {
      const matchingRules = board.rules.filter((rule) => rule.validate(country));
      expect(matchingRules).toHaveLength(0);
    });
  });
});
