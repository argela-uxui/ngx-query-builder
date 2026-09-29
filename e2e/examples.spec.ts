import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

const EXAMPLES = [
  'basic',
  'field-types',
  'entities',
  'operators',
  'validation',
  'callbacks',
  'custom-templates',
  'styling',
  'localization',
  'nested',
  'drag-drop',
  'disabled',
  'query-conversion',
];

test.describe('Example routes', () => {
  test('each example route renders a live query builder', async ({ page }) => {
    const demo = new DemoPage(page);
    for (const slug of EXAMPLES) {
      await demo.gotoExample(slug);
      await expect(page.locator('h1')).not.toBeEmpty();
      await expect(demo.exampleBuilder().locator('query-builder').first()).toBeVisible();
    }
  });

  test('sidebar links navigate between examples and mark the active route', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('basic');
    await demo.sidebarLink('custom-templates').click();
    await expect(page).toHaveURL(/\/examples\/custom-templates$/);
    await expect(demo.sidebarLink('custom-templates')).toHaveAttribute('aria-current', 'page');
    await expect(demo.exampleBuilder().locator('query-builder').first()).toBeVisible();
  });

  test('theme toggle switches themes and persists across reloads', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('basic');
    const root = page.locator('html');
    const before = await root.getAttribute('data-theme');
    await demo.themeToggle().click();
    const after = before === 'dark' ? 'light' : 'dark';
    await expect(root).toHaveAttribute('data-theme', after);
    await page.reload();
    await expect(root).toHaveAttribute('data-theme', after);
  });

  test('custom template example renders all nine directive replacements', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('custom-templates');
    await expect(page.getByTestId('custom-switch-group').first()).toBeVisible();
    await expect(page.getByTestId('custom-button-group').first()).toBeVisible();
    await expect(page.getByTestId('custom-arrow-icon').first()).toBeVisible();
    await expect(page.getByTestId('custom-field').first()).toBeVisible();
    await expect(page.getByTestId('custom-operator').first()).toBeVisible();
    await expect(page.getByTestId('custom-remove-button').first()).toBeVisible();
    await expect(page.getByTestId('custom-empty-warning')).toBeVisible();
  });

  test('validation example exposes an invalid FormControl and inline field errors', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('validation');
    await expect(page.getByTestId('validation-status')).toHaveText('Invalid');
    await expect(page.getByTestId('inline-error').first()).toBeVisible();
    await expect(page.getByTestId('error-list')).toContainText('Age must be between 18 and 120');
  });

  test('callbacks example maps the between operator to a custom range input', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('callbacks');
    await expect(page.getByTestId('range-input').first()).toBeVisible();
    await expect(page.getByTestId('event-log')).toContainText('getInputType');
    await page.getByTestId('region-us').click();
    await expect(page.getByTestId('event-log')).toContainText('US catalogue');
  });

  test('styling example applies a classNames preset', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('styling');
    await page.getByTestId('preset-cards').click();
    await expect(demo.exampleBuilder().locator('.sd-btn').first()).toBeVisible();
  });

  test('query conversion includes SQL, MongoDB and readable output tabs', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('query-conversion');
    await expect(page.getByTestId('tab-sql')).toBeVisible();
    await page.getByTestId('tab-sql').click();
    await expect(page.getByTestId('sql-output')).toContainText('SELECT *');
    await page.getByTestId('tab-mongo').click();
    await expect(page.getByTestId('mongo-output')).toContainText('$and');
  });

  test('disabled example rejects malformed JSON imports', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('disabled');
    await page.getByTestId('import-json').fill('{ invalid json }');
    await page.getByTestId('import-apply').click();
    await expect(page.getByTestId('import-error')).toContainText('Invalid JSON');
  });
});
