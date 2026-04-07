import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

// Initial query rule order (index into fieldSelects() / operatorSelects()):
// 0: age       (number)
// 1: name      (string)
// 2: birthday  (date)
// 3: meetingTime (time)
// 4: gender    (category)
// 5: educated  (boolean)
// 6: tags      (multiselect)
// 7: school    (nullable string — starts with "is null")
// 8: notes     (custom textarea)
// 9: occupation (nested ruleset's only rule)

test.describe('Input Types', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('number input — type value updates output', async ({ page }) => {
    const numberInput = page.locator('input.q-input-control[type="number"]').first();
    await numberInput.fill('42');
    await numberInput.blur();

    const json = await demo.getOutputJson() as any;
    expect(json.rules[0].value).toBe(42);
  });

  test('string input — type value updates output', async ({ page }) => {
    const stringInput = page.locator('input.q-input-control[type="text"]').first();
    await stringInput.fill('Bob');
    await stringInput.blur();

    const json = await demo.getOutputJson() as any;
    const nameRule = json.rules.find((r: any) => r.field === 'name');
    expect(nameRule?.value).toBe('Bob');
  });

  test('date input — set date value updates output', async ({ page }) => {
    const dateInput = page.locator('input.q-input-control[type="date"]').first();
    await dateInput.fill('2000-06-15');
    await dateInput.blur();

    const json = await demo.getOutputJson() as any;
    const dateRule = json.rules.find((r: any) => r.field === 'birthday');
    expect(dateRule?.value).toBe('2000-06-15');
  });

  test('time input — set time value updates output', async ({ page }) => {
    const timeInput = page.locator('input.q-input-control[type="time"]').first();
    await timeInput.fill('14:30');
    await timeInput.blur();

    const json = await demo.getOutputJson() as any;
    const timeRule = json.rules.find((r: any) => r.field === 'meetingTime');
    expect(timeRule?.value).toBe('14:30');
  });

  test('category (select) input — select option updates output', async ({ page }) => {
    // Gender field (index 4) is a category — field select is already 'gender'
    // The input category select is the single-select .q-input-control
    const categoryInputs = page.locator('select.q-input-control:not([multiple])');
    // Gender is the first category input
    await categoryInputs.first().selectOption({ label: 'Female' });

    const json = await demo.getOutputJson() as any;
    const genderRule = json.rules.find((r: any) => r.field === 'gender');
    expect(genderRule?.value).toBe('f');
  });

  test('boolean (checkbox) input — toggle updates output', async ({ page }) => {
    const checkboxInput = page.locator('input.q-input-control[type="checkbox"]').first();

    const jsonBefore = await demo.getOutputJson() as any;
    const before = jsonBefore.rules.find((r: any) => r.field === 'educated')?.value;

    await checkboxInput.click();

    const jsonAfter = await demo.getOutputJson() as any;
    const after = jsonAfter.rules.find((r: any) => r.field === 'educated')?.value;
    expect(after).toBe(!before);
  });

  test('multiselect input — select multiple options updates output', async ({ page }) => {
    const multiInput = page.locator('select.q-input-control[multiple]').first();
    await multiInput.selectOption([{ label: 'Angular' }, { label: 'RxJS' }]);

    const json = await demo.getOutputJson() as any;
    const tagsRule = json.rules.find((r: any) => r.field === 'tags');
    expect(tagsRule?.value).toContain('angular');
    expect(tagsRule?.value).toContain('rxjs');
  });

  test('nullable field — "is null" operator hides input control', async ({ page }) => {
    // School (index 7) starts with "is null" operator
    const schoolOperator = demo.operatorSelects().nth(7);
    await expect(schoolOperator).toHaveValue(/is null/);

    // No text input visible in that row (find the row containing the school field select)
    const schoolFieldSelect = demo.fieldSelects().nth(7);
    await expect(schoolFieldSelect).toBeVisible();
    // The input control after school's field select should not exist
    const schoolRow = page.locator('li.q-rule').nth(7);
    await expect(schoolRow.locator('input.q-input-control[type="text"]')).not.toBeVisible();
  });

  test('nullable field — switching away from "is null" shows input', async ({ page }) => {
    const schoolOperator = demo.operatorSelects().nth(7);
    await schoolOperator.selectOption({ label: '=' });

    const schoolRow = page.locator('li.q-rule').nth(7);
    await expect(schoolRow.locator('input.q-input-control[type="text"]')).toBeVisible();
  });

  test('custom textarea input — type text updates output', async () => {
    // Notes field (index 8) uses the custom *queryInput textarea template
    const textarea = demo.customTextarea();
    await textarea.fill('Custom note text');
    await textarea.blur();

    const json = await demo.getOutputJson() as any;
    const notesRule = json.rules.find((r: any) => r.field === 'notes');
    expect(notesRule?.value).toBe('Custom note text');
  });
});

