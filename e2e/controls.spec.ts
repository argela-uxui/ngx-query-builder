import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Controls: Entity Mode', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('entity selects are not visible in standard mode', async () => {
    await expect(demo.entitySelects().first()).not.toBeVisible();
  });

  test('toggling Entity Mode ON shows entity selects per rule', async () => {
    await demo.toggleEntityMode().check();
    await expect(demo.entitySelects().first()).toBeVisible();
  });

  test('toggling Entity Mode OFF hides entity selects', async () => {
    await demo.toggleEntityMode().check();
    await demo.toggleEntityMode().uncheck();
    await expect(demo.entitySelects().first()).not.toBeVisible();
  });

  test('entity mode filters field options by selected entity', async ({ page }) => {
    await demo.toggleEntityMode().check();
    // Select "Physical Attributes" entity for first rule
    const firstEntity = demo.entitySelects().first();
    await firstEntity.selectOption({ label: 'Physical Attributes' });

    const firstField = demo.fieldSelects().first();
    const fieldOptions = await firstField.locator('option').allTextContents();
    // Physical fields: Age, Gender
    expect(fieldOptions).toContain('Age');
    expect(fieldOptions).toContain('Gender');
    // Nonphysical fields should NOT be shown
    expect(fieldOptions).not.toContain('Name');
    expect(fieldOptions).not.toContain('Notes');
  });
});

test.describe('Controls: Disabled State', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('controls are enabled by default', async () => {
    const firstField = demo.fieldSelects().first();
    await expect(firstField).toBeEnabled();
  });

  test('toggling Disabled disables field dropdowns', async () => {
    await demo.toggleDisabled().check();
    await expect(demo.fieldSelects().first()).toBeDisabled();
  });

  test('toggling Disabled disables operator dropdowns', async () => {
    await demo.toggleDisabled().check();
    await expect(demo.operatorSelects().first()).toBeDisabled();
  });

  test('toggling Disabled disables add rule buttons', async () => {
    await demo.toggleDisabled().check();
    await expect(demo.addRuleButtons().first()).toBeDisabled();
  });

  test('toggling Disabled disables remove rule buttons', async () => {
    await demo.toggleDisabled().check();
    await expect(demo.removeRuleButtons().first()).toBeDisabled();
  });

  test('untoggling Disabled re-enables controls', async () => {
    await demo.toggleDisabled().check();
    await demo.toggleDisabled().uncheck();
    await expect(demo.fieldSelects().first()).toBeEnabled();
    await expect(demo.addRuleButtons().first()).toBeEnabled();
  });
});

test.describe('Controls: Allow Collapse', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('arrow icon buttons are not visible when Allow Collapse is OFF', async () => {
    await expect(demo.arrowButtons().first()).not.toBeVisible();
  });

  test('enabling Allow Collapse shows arrow icon buttons', async () => {
    await demo.toggleAllowCollapse().check();
    await expect(demo.arrowButtons().first()).toBeVisible();
  });

  test('clicking arrow button collapses the ruleset', async ({ page }) => {
    await demo.toggleAllowCollapse().check();
    const firstArrow = demo.arrowButtons().first();
    const firstTree = demo.treeContainers().first();

    // Should not be collapsed initially
    await expect(firstTree).not.toHaveClass(/q-collapsed/);

    await firstArrow.click();

    // After click + animation starts: class q-collapsed should be applied
    await expect(firstTree).toHaveClass(/q-collapsed/, { timeout: 2000 });
  });

  test('clicking arrow button again expands the ruleset', async ({ page }) => {
    await demo.toggleAllowCollapse().check();
    const firstArrow = demo.arrowButtons().first();
    const firstTree = demo.treeContainers().first();

    // Collapse
    await firstArrow.click();
    await expect(firstTree).toHaveClass(/q-collapsed/, { timeout: 2000 });

    // Expand
    await firstArrow.click();
    await expect(firstTree).not.toHaveClass(/q-collapsed/, { timeout: 2000 });
  });

  test('disabling Allow Collapse removes arrow icon buttons', async () => {
    await demo.toggleAllowCollapse().check();
    await demo.toggleAllowCollapse().uncheck();
    await expect(demo.arrowButtons().first()).not.toBeVisible();
  });
});

test.describe('Controls: Persist Value on Field Change', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('value is cleared when changing between incompatible types (persist OFF)', async ({ page }) => {
    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastRow = page.locator('li.q-rule').last();

    // Set to string field and type a value
    await lastFieldSelect.selectOption({ label: 'Name' });
    const textInput = lastRow.locator('input.q-input-control[type="text"]');
    await textInput.fill('test value');
    const prevText = await demo.getOutputText();
    await textInput.blur();

    // Change to number field — value should be cleared (incompatible type)
    await lastFieldSelect.selectOption({ label: 'Age' });
    await demo.waitForOutputChange(prevText);

    const json = await demo.getOutputJson() as any;
    const ageRules = json.rules.filter((r: any) => r.field === 'age');
    const lastAge = ageRules[ageRules.length - 1];
    // Value should be undefined/null/empty when persist is off and types differ
    expect(lastAge?.value == null || lastAge?.value === '').toBeTruthy();
  });

  test('value is preserved when changing between compatible types (persist ON)', async ({ page }) => {
    await demo.togglePersistValue().check();

    await demo.addRule();
    const lastFieldSelect = demo.fieldSelects().last();
    const lastRow = page.locator('li.q-rule').last();

    // Set to string field and type a value
    await lastFieldSelect.selectOption({ label: 'Name' });
    const textInput = lastRow.locator('input.q-input-control[type="text"]');
    await textInput.fill('preserved');
    const prevText = await demo.getOutputText();
    await textInput.blur();

    // Change to another string field (school) — same type, value should persist
    await lastFieldSelect.selectOption({ label: 'School' });
    await demo.waitForOutputChange(prevText);

    const json = await demo.getOutputJson() as any;
    const schoolRules = json.rules.filter((r: any) => r.field === 'school');
    const lastSchool = schoolRules[schoolRules.length - 1];
    expect(lastSchool?.value).toBe('preserved');
  });
});
