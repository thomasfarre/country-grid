import { describe, expect, it } from "vitest";
import { COUNTRIES } from "../../lib/dataset";
import { generateBoard } from "../../lib/game/rules";

const SEED = "test-seed";

describe("generateBoard", () => {
  it("returns 10 unique rules and board slots", () => {
    const generated = generateBoard(SEED, COUNTRIES);
    expect(generated.rules).toHaveLength(10);
    expect(generated.board).toHaveLength(10);

    const ruleIds = new Set(generated.rules.map((rule) => rule.id));
    expect(ruleIds.size).toBe(10);

    const boardRuleIds = generated.board.map((slot) => slot.ruleId);
    expect(new Set(boardRuleIds).size).toBe(10);
  });

  it("is deterministic for the same seed", () => {
    const first = generateBoard(SEED, COUNTRIES);
    const second = generateBoard(SEED, COUNTRIES);

    expect(second.rules.map((rule) => rule.id)).toEqual(first.rules.map((rule) => rule.id));
    expect(second.board.map((slot) => slot.ruleId)).toEqual(first.board.map((slot) => slot.ruleId));
  });
});
