import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Validation: Valid/Invalid Badge', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('badge shows "Valid" when query is valid', async () => {
    await expect(demo.badgeValid()).toHaveText('Valid');
    await expect(demo.badgeValid()).toHaveClass(/valid/);
  });

  test('"Valid" badge has green styling', async () => {
    const badge = demo.badgeValid();
    await expect(badge).toHaveClass(/valid/);
    await expect(badge).not.toHaveClass(/invalid/);
  });
});

test.describe('Validation: Touched Badge', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('badge shows "Untouched" initially', async () => {
    await expect(demo.badgeTouched()).toHaveText('Untouched');
    await expect(demo.badgeTouched()).not.toHaveClass(/active/);
  });

  test('badge changes to "Touched" after interacting with a field', async ({ page }) => {
    // Changing an operator value triggers handleDataChange() → onTouchedCallback()
    const firstOp = demo.operatorSelects().first();
    await firstOp.selectOption({ label: '!=' });

    await expect(demo.badgeTouched()).toHaveText('Touched');
    await expect(demo.badgeTouched()).toHaveClass(/active/);
  });

  test('adding a rule marks the form touched', async () => {
    await demo.addRuleButtons().first().click();
    await expect(demo.badgeTouched()).toHaveText('Touched');
  });
});

test.describe('Validation: Empty Ruleset Warning', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('empty warning is not shown when rulesets have rules', async ({ page }) => {
    await expect(page.locator('.q-empty-warning')).not.toBeVisible();
  });

  test('empty warning appears when an empty ruleset is added', async ({ page }) => {
    // Add a nested ruleset — it starts empty
    await demo.addRulesetButtons().first().click();

    // An empty nested ruleset should trigger the warning
    await expect(page.locator('.q-empty-warning')).toBeVisible();
    await expect(page.locator('.q-empty-warning')).toContainText('cannot be empty');
  });

  test('empty warning disappears when a rule is added to the empty ruleset', async ({ page }) => {
    // Add empty nested ruleset
    await demo.addRulesetButtons().first().click();
    await expect(page.locator('.q-empty-warning')).toBeVisible();

    // Add a rule inside the new (empty) nested ruleset — use its "Rule" button
    const addButtons = demo.addRuleButtons();
    const count = await addButtons.count();
    await addButtons.nth(count - 1).click();

    await expect(page.locator('.q-empty-warning')).not.toBeVisible();
  });
});
