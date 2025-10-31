import { test, expect } from "@playwright/test";
import { generateBoard } from "../../lib/game/rules";
import { COUNTRIES } from "../../lib/dataset";

import type { Page } from "@playwright/test";

const getState = async (page: Page) => {
  return page.evaluate(() => (window as unknown as { __countryGrid__?: { state: unknown } }).__countryGrid__?.state);
};

test("two players complete a quick round and see results", async ({ page }) => {
  const roomId = `e2e-${Date.now()}`;

  await page.goto(`/play?room=${roomId}&nickname=Host`);
  const playerTwo = await page.context().newPage();
  await playerTwo.goto(`/play?room=${roomId}&nickname=Guest`);

  await page.waitForFunction(() => {
    const store = (window as unknown as { __countryGrid__?: { state: { phase: string; currentCountry?: { code: string } } } }).__countryGrid__;
    return store?.state?.phase === "playing" && Boolean(store.state.currentCountry);
  });

  for (let i = 0; i < 2; i += 1) {
    const currentState = (await getState(page)) as any;
    expect(currentState).toBeTruthy();
    if (!currentState) return;
    const generated = generateBoard(currentState.seed, COUNTRIES);
    const ruleMap = new Map(generated.rules.map((rule) => [rule.id, rule]));
    const currentCountry = currentState.currentCountry;
    expect(currentCountry).toBeTruthy();
    if (!currentCountry) break;

    const targetSlot = currentState.board.find((slot: { ruleId: string }) => {
      const rule = ruleMap.get(slot.ruleId);
      return rule ? rule.validate(currentCountry) : false;
    });
    expect(targetSlot).toBeTruthy();
    if (!targetSlot) break;

    const previousCode = currentCountry.code;
    await page.locator(`[data-rule-id="${targetSlot.ruleId}"]`).click();
    await page.waitForFunction(
      (code) => {
        const store = (window as unknown as { __countryGrid__?: { state: { currentCountry?: { code: string } } } }).__countryGrid__;
        const nextCode = store?.state?.currentCountry?.code;
        return nextCode !== code && Boolean(nextCode);
      },
      previousCode
    );
  }

  await playerTwo.waitForFunction(() => {
    const store = (window as unknown as { __countryGrid__?: { state: { phase: string } } }).__countryGrid__;
    return store?.state?.phase === "playing";
  });
  await playerTwo.getByRole("button", { name: "Passer ce pays" }).click();

  await page.waitForFunction(() => {
    const store = (window as unknown as { __countryGrid__?: { state: { phase: string } } }).__countryGrid__;
    return store?.state?.phase === "reveal";
  });

  await expect(page.getByText("Scores finaux")).toBeVisible();
  const finalState = await getState(page);
  expect(finalState?.phase).toBe("reveal");
});
