import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Localization Runtime Switching', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('switching language updates button and condition labels', async () => {
    await expect(demo.addRuleButtons().first()).toContainText('Rule');
    await expect(demo.conditionLabelByValue('and', 0)).toHaveText('AND');

    await demo.languageSelect().selectOption('tr');

    await expect(demo.addRuleButtons().first()).toContainText('Kural');
    await expect(demo.conditionLabelByValue('and', 0)).toHaveText('VE');

    await demo.languageSelect().selectOption('en');

    await expect(demo.addRuleButtons().first()).toContainText('Rule');
    await expect(demo.conditionLabelByValue('and', 0)).toHaveText('AND');
  });

  test('switching language updates operator labels while keeping operator values stable', async () => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastOperatorSelect = demo.operatorSelects().last();

    await lastFieldSelect.selectOption({ label: 'School' });
    await demo.languageSelect().selectOption('tr');
    await lastOperatorSelect.selectOption({ label: 'null degil' });

    const json = await demo.getOutputJson() as { rules: Array<{ operator?: string; field?: string }> };
    const schoolRules = json.rules.filter((rule) => rule.field === 'school');
    expect(schoolRules[schoolRules.length - 1]?.operator).toBe('is not null');
  });
});

