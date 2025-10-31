import { describe, expect, it } from "vitest";
import { applyScore, computeScore, scoreDelta } from "../../lib/game/scoring";

describe("scoring", () => {
  it("returns expected delta per result", () => {
    expect(scoreDelta("correct")).toBe(10);
    expect(scoreDelta("incorrect")).toBe(-5);
    expect(scoreDelta("pass")).toBe(0);
  });

  it("computes cumulative score", () => {
    const total = computeScore(["correct", "correct", "incorrect", "pass"]);
    expect(total).toBe(15);
  });

  it("applies delta to existing score", () => {
    let score = 0;
    score = applyScore(score, "correct");
    expect(score).toBe(10);
    score = applyScore(score, "incorrect");
    expect(score).toBe(5);
    score = applyScore(score, "pass");
    expect(score).toBe(5);
  });
});
