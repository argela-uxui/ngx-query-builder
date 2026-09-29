import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Switch Group Isolation (unique radio id per instance)', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('root and nested rulesets have radios with distinct id prefixes', async () => {
    const radios = demo.switchRadios();
    const count = await radios.count();
    // Demo has root + at least one nested ruleset → at least 4 radios
    expect(count).toBeGreaterThanOrEqual(4);

    // Collect all distinct id prefixes (e.g. "qb-0" from "qb-0-and")
    const prefixes = new Set<string>();
    for (let i = 0; i < count; i++) {
      const id = await radios.nth(i).getAttribute('id');
      expect(id).toBeTruthy();
      const prefix = id!.replace(/-(and|or)$/, '');
      prefixes.add(prefix);
    }

    // Root and nested should have different id prefixes
    expect(prefixes.size).toBeGreaterThanOrEqual(2);
  });

  test('each component instance has exactly 2 radios (AND + OR) sharing an id prefix', async () => {
    const radios = demo.switchRadios();
    const count = await radios.count();

    // Group radios by id prefix
    const groups = new Map<string, string[]>();
    for (let i = 0; i < count; i++) {
      const id = await radios.nth(i).getAttribute('id');
      const value = await radios.nth(i).getAttribute('value');
      const prefix = id!.replace(/-(and|or)$/, '');
      if (!groups.has(prefix)) {
        groups.set(prefix, []);
      }
      groups.get(prefix)!.push(value!);
    }

    // Each group should have exactly 2 radios: one "and" and one "or"
    for (const [, values] of groups) {
      expect(values.length).toBe(2);
      expect(values).toContain('and');
      expect(values).toContain('or');
    }
  });

  test('all radio id attributes are globally unique', async () => {
    const radios = demo.switchRadios();
    const count = await radios.count();

    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = await radios.nth(i).getAttribute('id');
      expect(id).toBeTruthy();
      ids.push(id!);
    }

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('each radio id follows the qb-N-and/or naming pattern', async () => {
    const radios = demo.switchRadios();
    const count = await radios.count();

    for (let i = 0; i < count; i++) {
      const id = await radios.nth(i).getAttribute('id');
      expect(id).toMatch(/^qb-\d+-(and|or)$/);
    }
  });

  test('labels have for attributes matching their corresponding radio ids', async () => {
    const radios = demo.switchRadios();
    const count = await radios.count();

    for (let i = 0; i < count; i++) {
      const id = await radios.nth(i).getAttribute('id');
      const label = demo.page.locator(`label[for="${id}"]`);
      await expect(label).toHaveCount(1);
    }
  });

  test('toggling nested condition does not affect root radios due to isolation', async () => {
    // Get the root AND radio — it should be checked by default
    const rootAndRadio = demo.switchRadios().first();
    const rootId = await rootAndRadio.getAttribute('id');
    await expect(rootAndRadio).toBeChecked();

    // Toggle nested condition to AND (index 1 = second AND label = nested component)
    const nestedAndLabel = demo.conditionLabelsByValue('and').nth(1);
    const prevText = await demo.getOutputText();
    await nestedAndLabel.click();
    await demo.waitForOutputChange(prevText);

    // Verify root AND radio is still checked and its id is unchanged
    await expect(rootAndRadio).toBeChecked();
    expect(await rootAndRadio.getAttribute('id')).toBe(rootId);

    // Verify the root condition in JSON output is still 'and'
    const json = await demo.getOutputJson() as Record<string, unknown>;
    expect(json['condition']).toBe('and');

    // Verify the nested ruleset's condition changed
    const rules = json['rules'] as Record<string, unknown>[];
    const nestedRuleset = rules.find((r) => r['condition'] !== undefined);
    expect(nestedRuleset).toBeTruthy();
    expect(nestedRuleset!['condition']).toBe('and');
  });
});
