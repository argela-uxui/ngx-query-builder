import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Field and Operator Changes', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('changing field updates the operator dropdown options', async ({ page }) => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    // Switch to number field — should have numeric operators
    await lastFieldSelect.selectOption({ label: 'Age' });
    const numberOptions = await lastOperatorSelect.locator('option').allTextContents();
    expect(numberOptions).toContain('=');
    expect(numberOptions).toContain('>');
    expect(numberOptions).toContain('<');

    // Switch to string field — should have string operators
    await lastFieldSelect.selectOption({ label: 'Name' });
    const stringOptions = await lastOperatorSelect.locator('option').allTextContents();
    expect(stringOptions).toContain('contains');
    expect(stringOptions).toContain('like');
  });

  test('changing field to category shows category operators', async ({ page }) => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'Gender' });
    const options = await lastOperatorSelect.locator('option').allTextContents();
    expect(options).toContain('in');
    expect(options).toContain('not in');
  });

  test('changing field to boolean shows only "=" operator', async ({ page }) => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'College Degree?' });
    await expect(lastOperatorSelect.locator('option')).toHaveCount(1);
    const options = await lastOperatorSelect.locator('option').allTextContents();
    expect(options).toEqual(['=']);
  });

  test('nullable field has "is null" and "is not null" operators', async ({ page }) => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'School' });
    const options = await lastOperatorSelect.locator('option').allTextContents();
    expect(options).toContain('is null');
    expect(options).toContain('is not null');
  });

  test('"is null" operator hides value input', async ({ page }) => {
    await demo.addRule();
    const lastRow = page.locator('li.q-rule').last();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'School' });
    await lastOperatorSelect.selectOption({ label: 'is null' });

    await expect(lastRow.locator('input.q-input-control[type="text"]')).not.toBeVisible();
  });

  test('"is not null" operator also hides value input', async ({ page }) => {
    await demo.addRule();
    const lastRow = page.locator('li.q-rule').last();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'School' });
    await lastOperatorSelect.selectOption({ label: 'is not null' });

    await expect(lastRow.locator('input.q-input-control[type="text"]')).not.toBeVisible();
  });

  test('switching from "is null" to "=" shows input', async ({ page }) => {
    await demo.addRule();
    const lastRow = page.locator('li.q-rule').last();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'School' });
    await lastOperatorSelect.selectOption({ label: 'is null' });
    await lastOperatorSelect.selectOption({ label: '=' });

    await expect(lastRow.locator('input.q-input-control[type="text"]')).toBeVisible();
  });

  test('textarea field shows custom template input', async ({ page }) => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();

    await lastFieldSelect.selectOption({ label: 'Notes' });

    await expect(page.locator('[data-testid="custom-textarea"]').last()).toBeVisible();
  });

  test('changing field updates output JSON field key', async () => {
    await demo.addRule();
    const prevText = await demo.getOutputText();
    const lastFieldSelect = demo.fieldSelects().last();
    await lastFieldSelect.selectOption({ label: 'Name' });
    await demo.waitForOutputChange(prevText);

    const json = await demo.getOutputJson() as any;
    const lastRule = json.rules[json.rules.length - 1];
    expect(lastRule.field).toBe('name');
  });

  test('changing operator updates output JSON operator key', async ({ page }) => {
    await demo.addRule();
    const prevText = await demo.getOutputText();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'Age' });
    await lastOperatorSelect.selectOption({ label: '>' });
    await demo.waitForOutputChange(prevText);

    const json = await demo.getOutputJson() as any;
    const ageRules = json.rules.filter((r: any) => r.field === 'age');
    const lastAgeRule = ageRules[ageRules.length - 1];
    expect(lastAgeRule.operator).toBe('>');
  });
});

