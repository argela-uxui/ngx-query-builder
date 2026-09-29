import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Add / Remove Rules and Rulesets', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('clicking "Rule" button adds a new rule row', async () => {
    const before = await demo.fieldSelects().count();
    await demo.addRule();
    await expect(demo.fieldSelects()).toHaveCount(before + 1);
  });

  test('added rule appears in query output', async () => {
    const prevText = await demo.getOutputText();
    const countBefore = (JSON.parse(prevText) as any).rules.length;

    await demo.addRule();

    const jsonAfter = await demo.getOutputJson() as any;
    expect(jsonAfter.rules.length).toBe(countBefore + 1);
  });

  test('clicking "Ruleset" button adds a nested ruleset', async ({ page }) => {
    const before = await page.locator('.q-ruleset').count();
    await demo.addRuleset();
    await expect(page.locator('.q-ruleset')).toHaveCount(before + 1);
  });

  test('clicking remove button removes a rule', async () => {
    await demo.addRule();
    const before = await demo.fieldSelects().count();

    await demo.removeRuleButtons().last().click();
    await expect(demo.fieldSelects()).toHaveCount(before - 1);
  });

  test('remove button removes the correct rule from output', async () => {
    await demo.addRule();
    const prevText = await demo.getOutputText();
    const countBefore = (JSON.parse(prevText) as any).rules.length;

    await demo.removeRuleButtons().last().click();
    await demo.waitForOutputChange(prevText);

    const countAfter = (await demo.getOutputJson() as any).rules.length;
    expect(countAfter).toBe(countBefore - 1);
  });

  test('Allow Ruleset toggle OFF hides "Ruleset" add button', async () => {
    // The "Ruleset" buttons should be visible initially
    await expect(demo.addRulesetButtons().first()).toBeVisible();

    // Toggle Allow Ruleset OFF
    await demo.toggleAllowRuleset().uncheck();

    // "Ruleset" buttons should no longer be visible
    await expect(demo.addRulesetButtons().first()).not.toBeVisible();
  });

  test('Allow Ruleset toggle ON re-shows "Ruleset" add button', async () => {
    await demo.toggleAllowRuleset().uncheck();
    await demo.toggleAllowRuleset().check();
    await expect(demo.addRulesetButtons().first()).toBeVisible();
  });

  test('remove ruleset button removes nested ruleset', async ({ page }) => {
    // Add a fresh ruleset and wait for it to appear
    await demo.addRuleset();
    const before = await page.locator('.q-ruleset').count();

    // The remove-ruleset button is a ".q-remove-button" inside a ".q-ruleset" row
    // that is NOT a remove-rule button (it has no sibling .q-field-control)
    const removeRulesetBtn = page.locator('.q-ruleset .q-remove-button').last();
    await removeRulesetBtn.click();

    await expect(page.locator('.q-ruleset')).toHaveCount(before - 1);
  });
});
