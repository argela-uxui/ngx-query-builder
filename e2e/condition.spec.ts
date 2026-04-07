import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('AND/OR Condition Toggle', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('root condition defaults to AND', async ({ page }) => {
    // The first AND radio at root level should be checked
    const andRadio = page.locator('.q-switch-radio[value="and"]').first();
    await expect(andRadio).toBeChecked();
  });

  test('clicking OR label switches root condition to OR', async ({ page }) => {
    const orLabel = demo.conditionLabel('OR', 0);
    await orLabel.click();

    const json = await demo.getOutputJson();
    expect((json as any).condition).toBe('or');
  });

  test('clicking AND label switches root condition back to AND', async ({ page }) => {
    // Switch to OR first
    await demo.conditionLabel('OR', 0).click();
    // Switch back to AND
    await demo.conditionLabel('AND', 0).click();

    const json = await demo.getOutputJson();
    expect((json as any).condition).toBe('and');
  });

  test('nested ruleset has its own independent condition', async ({ page }) => {
    // The demo starts with a nested ruleset; find its OR radio
    const orRadios = page.locator('.q-switch-radio[value="or"]');
    const count = await orRadios.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Nested ruleset condition defaults to OR (from initial query)
    const nestedOrRadio = orRadios.last();
    await expect(nestedOrRadio).toBeChecked();
  });

  test('nested condition can be toggled independently', async ({ page }) => {
    // Toggle nested condition to AND (index 1 = second AND label = nested component)
    const nestedAndLabel = demo.conditionLabels('AND').nth(1);
    const prevText = await demo.getOutputText();
    await nestedAndLabel.click();
    await demo.waitForOutputChange(prevText);

    const json = await demo.getOutputJson() as any;
    // Root condition should still be AND
    expect(json.condition).toBe('and');

    // Find the nested ruleset condition
    const nestedRuleset = json.rules.find((r: any) => r.condition !== undefined);
    expect(nestedRuleset?.condition).toBe('and');
  });

  test('output JSON reflects condition changes', async () => {
    const prevText = await demo.getOutputText();
    await demo.conditionLabel('OR', 0).click();
    await demo.waitForOutputChange(prevText);
    const json = await demo.getOutputJson() as any;
    expect(json.condition).toBe('or');
  });
});
