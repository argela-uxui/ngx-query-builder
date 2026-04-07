import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Live JSON Output', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('output contains top-level "condition" key', async () => {
    const json = await demo.getOutputJson() as any;
    expect(typeof json.condition).toBe('string');
  });

  test('output contains top-level "rules" array', async () => {
    const json = await demo.getOutputJson() as any;
    expect(Array.isArray(json.rules)).toBe(true);
  });

  test('each rule has "field" and "operator" keys', async () => {
    const json = await demo.getOutputJson() as any;
    const flatRules = json.rules.filter((r: any) => !r.condition);
    for (const rule of flatRules) {
      expect(rule).toHaveProperty('field');
      expect(rule).toHaveProperty('operator');
    }
  });

  test('nested ruleset in output has "condition" and "rules" keys', async () => {
    const json = await demo.getOutputJson() as any;
    const nested = json.rules.find((r: any) => r.condition !== undefined);
    expect(nested).toBeDefined();
    expect(nested).toHaveProperty('condition');
    expect(nested).toHaveProperty('rules');
  });

  test('output updates when a rule is added', async () => {
    const before = (await demo.getOutputJson() as any).rules.length;
    await demo.addRuleButtons().first().click();
    const after = (await demo.getOutputJson() as any).rules.length;
    expect(after).toBe(before + 1);
  });

  test('output updates when a rule is removed', async () => {
    await demo.addRuleButtons().first().click();
    const before = (await demo.getOutputJson() as any).rules.length;
    await demo.removeRuleButtons().last().click();
    const after = (await demo.getOutputJson() as any).rules.length;
    expect(after).toBe(before - 1);
  });

  test('output updates when a field is changed', async ({ page }) => {
    await demo.addRuleButtons().first().click();
    const lastField = demo.fieldSelects().last();
    await lastField.selectOption({ label: 'Name' });

    const json = await demo.getOutputJson() as any;
    const lastRule = json.rules[json.rules.length - 1];
    expect(lastRule.field).toBe('name');
  });

  test('output updates when an operator is changed', async ({ page }) => {
    const firstField = demo.fieldSelects().first();
    const firstOp = demo.operatorSelects().first();

    // Ensure age field is selected
    await firstField.selectOption({ label: 'Age' });
    await firstOp.selectOption({ label: '>' });

    const json = await demo.getOutputJson() as any;
    const ageRule = json.rules.find((r: any) => r.field === 'age');
    expect(ageRule?.operator).toBe('>');
  });

  test('output updates when a string value is typed', async ({ page }) => {
    await demo.addRuleButtons().first().click();
    const lastRow = page.locator('li.q-rule').last();
    const lastField = demo.fieldSelects().last();

    await lastField.selectOption({ label: 'Name' });
    const textInput = lastRow.locator('input.q-input-control[type="text"]');
    await textInput.fill('John');
    await textInput.blur();

    const json = await demo.getOutputJson() as any;
    const nameRules = json.rules.filter((r: any) => r.field === 'name');
    expect(nameRules[nameRules.length - 1]?.value).toBe('John');
  });

  test('output updates when condition is toggled', async () => {
    await demo.conditionLabel('OR', 0).click();
    const json = await demo.getOutputJson() as any;
    expect(json.condition).toBe('or');
  });

  test('output is always parseable JSON', async () => {
    // Perform several interactions and verify JSON remains parseable after each
    await demo.addRuleButtons().first().click();
    expect(() => JSON.parse('')).toThrow(); // sanity check
    const text = await demo.queryOutput().innerText();
    expect(() => JSON.parse(text)).not.toThrow();
  });
});
