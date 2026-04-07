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
    await demo.addRuleButtons().first().click();
    const after = await demo.fieldSelects().count();
    expect(after).toBe(before + 1);
  });

  test('added rule appears in query output', async () => {
    const jsonBefore = await demo.getOutputJson() as any;
    const countBefore = jsonBefore.rules.length;

    await demo.addRuleButtons().first().click();

    const jsonAfter = await demo.getOutputJson() as any;
    expect(jsonAfter.rules.length).toBe(countBefore + 1);
  });

  test('clicking "Ruleset" button adds a nested ruleset', async ({ page }) => {
    const before = await page.locator('.q-ruleset').count();
    await demo.addRulesetButtons().first().click();
    const after = await page.locator('.q-ruleset').count();
    expect(after).toBeGreaterThan(before);
  });

  test('clicking remove button removes a rule', async () => {
    // Add a rule first so we have a known removable one
    await demo.addRuleButtons().first().click();
    const before = await demo.fieldSelects().count();

    // Remove the last rule
    await demo.removeRuleButtons().last().click();
    const after = await demo.fieldSelects().count();
    expect(after).toBe(before - 1);
  });

  test('remove button removes the correct rule from output', async () => {
    await demo.addRuleButtons().first().click();
    const countBefore = (await demo.getOutputJson() as any).rules.length;

    await demo.removeRuleButtons().last().click();

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
    // Add a fresh ruleset
    await demo.addRulesetButtons().first().click();
    const before = await page.locator('.q-ruleset').count();

    // The remove-ruleset button is a ".q-remove-button" inside a ".q-ruleset" row
    // that is NOT a remove-rule button (it has no sibling .q-field-control)
    const removeRulesetBtn = page.locator('.q-ruleset .q-remove-button').last();
    await removeRulesetBtn.click();

    const after = await page.locator('.q-ruleset').count();
    expect(after).toBeLessThan(before);
  });
});
