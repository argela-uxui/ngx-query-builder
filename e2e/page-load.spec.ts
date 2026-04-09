import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Page Load', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('displays the page title', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('ngx-query-builder Demo');
  });

  test('renders the query builder component', async ({ page }) => {
    // Use .first() since nested rulesets also render query-builder elements
    await expect(page.locator('[data-testid="query-builder"] query-builder').first()).toBeVisible();
  });

  test('renders initial rule rows', async () => {
    const fields = demo.fieldSelects();
    await expect(fields).toHaveCount(await fields.count());
    expect(await fields.count()).toBeGreaterThan(0);
  });

  test('renders the query output section', async () => {
    await expect(demo.queryOutput()).toBeVisible();
  });

  test('query output is valid JSON', async () => {
    const json = await demo.getOutputJson();
    expect(json).toHaveProperty('condition');
    expect(json).toHaveProperty('rules');
  });

  test('renders Controls section with all checkboxes', async () => {
    await expect(demo.toggleEntityMode()).toBeVisible();
    await expect(demo.toggleDisabled()).toBeVisible();
    await expect(demo.toggleAllowRuleset()).toBeVisible();
    await expect(demo.toggleAllowCollapse()).toBeVisible();
    await expect(demo.togglePersistValue()).toBeVisible();
    await expect(demo.languageSelect()).toBeVisible();
  });

  test('valid badge is visible on load', async () => {
    await expect(demo.badgeValid()).toBeVisible();
  });

  test('untouched badge is visible on load', async () => {
    await expect(demo.badgeTouched()).toHaveText('Untouched');
  });
});
