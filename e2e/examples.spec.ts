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
  'theme-builder',
  'localization',
  'localization-builder',
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

  test('theme builder applies valid CSS and preserves its last valid preview on errors', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    await page.getByTestId('theme-tab-cssCode').click();
    const cssEditor = page.getByTestId('theme-css-code');
    await cssEditor.fill('--qb-border-radius: 13px;');

    const builder = demo.exampleBuilder().locator('query-builder').first();
    await expect.poll(() => builder.evaluate((element) => getComputedStyle(element).getPropertyValue('--qb-border-radius').trim()))
      .toBe('13px');

    await cssEditor.fill('--qb-border-radius: ;');
    await expect(page.getByTestId('theme-css-error')).toContainText('needs a value');
    await expect.poll(() => builder.evaluate((element) => getComputedStyle(element).getPropertyValue('--qb-border-radius').trim()))
      .toBe('13px');
  });

  test('theme builder selects Type & size by default with clear selected-tab contrast', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    const selectedTab = page.getByTestId('theme-tab-typography');
    const inactiveTab = page.getByTestId('theme-tab-surfaces');

    await expect(selectedTab).toHaveAttribute('aria-selected', 'true');
    await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByLabel('--qb-font-family')).toBeVisible();

    const selectedColors = await selectedTab.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color];
    });
    const inactiveColors = await inactiveTab.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.backgroundColor, style.color];
    });
    expect(selectedColors[0]).not.toBe(inactiveColors[0]);
    expect(selectedColors[1]).not.toBe(inactiveColors[1]);
  });

  test('theme builder validates classNames JSON and updates the preview', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    await page.getByTestId('theme-tab-classNamesCode').click();
    const classNamesEditor = page.getByTestId('theme-classnames-code');
    await classNamesEditor.fill('{"button":"theme-action"}');
    await expect(demo.exampleBuilder().locator('.theme-action').first()).toBeVisible();

    await classNamesEditor.fill('{ invalid }');
    await expect(page.getByTestId('theme-classnames-error')).toBeVisible();
    await expect(demo.exampleBuilder().locator('.theme-action').first()).toBeVisible();
  });

  test('theme builder copies the editable CSS declarations', async ({ page, context }) => {
    const demo = new DemoPage(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await demo.gotoExample('theme-builder');
    await page.getByTestId('theme-tab-cssCode').click();
    const cssCode = await page.getByTestId('theme-css-code').inputValue();
    await page.getByTestId('copy-theme-css').click();
    await expect(page.getByTestId('theme-message')).toContainText('CSS copied');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(cssCode);
  });

  test('theme builder saves, restores, and deletes named themes', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    await page.getByTestId('theme-name').fill('Night mode');
    await page.getByTestId('theme-tab-cssCode').click();
    await page.getByTestId('theme-css-code').fill('--qb-border-radius: 17px;');
    await page.getByTestId('save-theme').click();
    await expect(page.getByTestId('theme-message')).toContainText('Saved');

    await page.reload();
    await expect(page.getByTestId('saved-theme-select')).toContainText('Night mode');
    await page.getByTestId('saved-theme-select').selectOption({ label: 'Night mode' });
    await page.getByTestId('load-theme').click();
    await expect.poll(() => demo.exampleBuilder().locator('query-builder').first()
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--qb-border-radius').trim()))
      .toBe('17px');

    await page.getByTestId('delete-theme').click();
    await expect(page.getByTestId('saved-theme-select')).not.toContainText('Night mode');
  });

  test('theme builder applies typography and theme tokens to built-in and preset controls', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    const builder = demo.exampleBuilder().locator('query-builder').first();
    const fontSizeInput = page.getByLabel('--qb-font-size');

    await fontSizeInput.press('End');
    await expect(fontSizeInput).toHaveValue('24');
    const builtInControls = await builder.evaluate((root) => ({
      controls: Array.from(root.querySelectorAll('select, input:not([type="radio"])'))
        .map((control) => getComputedStyle(control).fontSize),
      removeButtons: Array.from(root.querySelectorAll('.q-remove-button'))
        .map((button) => getComputedStyle(button).fontSize),
      builderHosts: [root, ...Array.from(root.querySelectorAll('query-builder'))]
        .map((host) => getComputedStyle(host).fontSize),
    }));
    expect(builtInControls.controls.length).toBeGreaterThan(0);
    expect(builtInControls.controls.every((size) => size === '24px')).toBe(true);
    expect(builtInControls.removeButtons.length).toBeGreaterThan(0);
    expect(builtInControls.removeButtons.every((size) => size === '24px')).toBe(true);
    expect(builtInControls.builderHosts.every((size) => size === '24px')).toBe(true);

    const themeSelect = page.getByTestId('saved-theme-select');
    const sampleOptions = themeSelect.locator('optgroup[label="Styling examples"] option');
    await expect(sampleOptions).toHaveCount(12);
    await expect.poll(() => sampleOptions.allTextContents()).toEqual([
      'Default',
      'Ocean',
      'Forest',
      'Sunset',
      'Cards',
      'Cards - Ocean',
      'Cards - Forest',
      'Cards - Sunset',
      'Minimal',
      'Minimal - Ocean',
      'Minimal - Forest',
      'Minimal - Sunset',
    ]);

    await themeSelect.selectOption({ label: 'Cards - Ocean' });
    await page.getByTestId('load-theme').click();
    await expect(page.getByTestId('theme-message')).toContainText('Loaded “Cards - Ocean”.');
    const sampleButton = demo.exampleBuilder().locator('.sd-btn').first();
    await expect(sampleButton).toBeVisible();
    await expect.poll(() => sampleButton.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(79, 70, 229)');
    await expect.poll(() => builder
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--qb-border-radius').trim()))
      .toBe('8px');
    await fontSizeInput.press('End');
    await expect(fontSizeInput).toHaveValue('24');
    const cardsControls = await builder.evaluate((root) => ({
      controls: Array.from(root.querySelectorAll('select, input:not([type="radio"])')).map((control) => ({
        fontSize: getComputedStyle(control).fontSize,
        borderRadius: getComputedStyle(control).borderTopLeftRadius,
        borderColor: getComputedStyle(control).borderBottomColor,
        className: control.className,
        type: control.getAttribute('type'),
      })),
      actionSizes: Array.from(root.querySelectorAll('button.sd-btn, button.sd-link'))
        .map((button) => getComputedStyle(button).fontSize),
      removeSizes: Array.from(root.querySelectorAll('.sd-btn--remove, .sd-link--remove'))
        .map((button) => getComputedStyle(button).fontSize),
    }));
    expect(cardsControls.controls.length).toBeGreaterThan(0);
    expect(cardsControls.controls.every((control) =>
      control.className.includes('sd-control')
      && control.fontSize === '24px')).toBe(true);
    expect(cardsControls.controls.filter((control) => control.type !== 'checkbox').every((control) =>
      control.borderRadius === '8px'
      && control.borderColor === 'rgb(125, 211, 252)')).toBe(true);
    expect(cardsControls.actionSizes.every((size) => size === '24px')).toBe(true);
    expect(cardsControls.removeSizes.length).toBeGreaterThan(0);
    expect(cardsControls.removeSizes.every((size) => size === '24px')).toBe(true);

    await themeSelect.selectOption({ label: 'Minimal - Ocean' });
    await page.getByTestId('load-theme').click();
    await expect(page.getByTestId('theme-message')).toContainText('Loaded “Minimal - Ocean”.');
    await fontSizeInput.press('End');
    await expect(fontSizeInput).toHaveValue('24');
    const minimalControls = await builder.evaluate((root) => ({
      controls: Array.from(root.querySelectorAll('select, input:not([type="radio"])')).map((control) => ({
        fontSize: getComputedStyle(control).fontSize,
        borderRadius: getComputedStyle(control).borderTopLeftRadius,
        borderColor: getComputedStyle(control).borderBottomColor,
        className: control.className,
        type: control.getAttribute('type'),
      })),
      actionSizes: Array.from(root.querySelectorAll('button.sd-btn, button.sd-link'))
        .map((button) => getComputedStyle(button).fontSize),
      removeSizes: Array.from(root.querySelectorAll('.sd-btn--remove, .sd-link--remove'))
        .map((button) => getComputedStyle(button).fontSize),
    }));
    expect(minimalControls.controls.length).toBeGreaterThan(0);
    expect(minimalControls.controls.every((control) =>
      control.className.includes('sd-bare')
      && control.fontSize === '24px')).toBe(true);
    expect(minimalControls.controls.filter((control) => control.type !== 'checkbox').every((control) =>
      control.borderRadius === '8px'
      && control.borderColor === 'rgb(125, 211, 252)')).toBe(true);
    expect(minimalControls.actionSizes.every((size) => size === '24px')).toBe(true);
    expect(minimalControls.removeSizes.length).toBeGreaterThan(0);
    expect(minimalControls.removeSizes.every((size) => size === '24px')).toBe(true);
    await expect(page.getByTestId('delete-theme')).toBeDisabled();
  });

  test('theme builder resets CSS and class overrides and places save controls beside the page title', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    const pageHeader = page.locator('app-page-header');
    const pageTitle = pageHeader.getByRole('heading', { name: 'Theme builder' });
    await expect(pageTitle).toBeVisible();
    await expect(pageHeader.getByTestId('save-theme')).toBeVisible();
    await expect(pageHeader.getByTestId('reset-theme')).toBeVisible();
    expect(await pageHeader.getByTestId('save-theme').evaluate((element) => !!element.closest('app-page-header')))
      .toBe(true);
    const titleBounds = await pageTitle.boundingBox();
    const savePanelBounds = await pageHeader.locator('[pageHeaderActions]').boundingBox();
    expect(titleBounds).toBeTruthy();
    expect(savePanelBounds).toBeTruthy();
    expect(savePanelBounds!.x).toBeGreaterThan(titleBounds!.x);
    expect(savePanelBounds!.y).toBeLessThan(titleBounds!.y + titleBounds!.height);

    await page.getByTestId('theme-name').fill('Keep after reset');
    await page.getByTestId('save-theme').click();
    await expect(page.getByTestId('saved-theme-select')).toContainText('Keep after reset');

    await page.getByTestId('theme-tab-cssCode').click();
    const cssEditor = page.getByTestId('theme-css-code');
    await cssEditor.fill('--qb-border-radius: 15px;');
    await cssEditor.fill('--qb-border-radius: ;');
    await expect(page.getByTestId('theme-css-error')).toBeVisible();

    await page.getByTestId('theme-tab-classNamesCode').click();
    const classNamesEditor = page.getByTestId('theme-classnames-code');
    await classNamesEditor.fill('{"button":"theme-reset-check"}');
    await classNamesEditor.fill('{ invalid }');
    await expect(page.getByTestId('theme-classnames-error')).toBeVisible();
    await expect(demo.exampleBuilder().locator('.theme-reset-check').first()).toBeVisible();

    await page.getByTestId('reset-theme').click();
    await page.getByTestId('theme-tab-cssCode').click();
    await expect(cssEditor).toHaveValue(/--qb-border-radius: 4px;/);
    await expect(page.getByTestId('theme-css-error')).toBeHidden();
    await page.getByTestId('theme-tab-classNamesCode').click();
    await expect(classNamesEditor).toHaveValue('{}');
    await expect(page.getByTestId('theme-classnames-error')).toBeHidden();
    await expect(page.getByTestId('saved-theme-select')).toContainText('Keep after reset');
    await expect(page.getByTestId('theme-message')).toHaveText('Theme reset to defaults.');
    await expect(demo.exampleBuilder().locator('.theme-reset-check')).toHaveCount(0);
    await expect.poll(() => demo.exampleBuilder().locator('query-builder').first()
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--qb-border-radius').trim()))
      .toBe('4px');
  });

  test('theme builder keeps the preview visible while editor tabs scroll on desktop', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    const preview = demo.exampleBuilder();
    const tabs = page.getByTestId('theme-editor-tabs');
    await expect.poll(() => tabs.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThan(35);
    await expect.poll(() => page.locator('.theme-preview')
      .evaluate((element) => getComputedStyle(element).position)).toBe('sticky');
    const controls = page.locator('.theme-controls');

    await page.getByTestId('theme-tab-classNames').click();
    const controlsBox = await controls.boundingBox();
    expect(controlsBox).toBeTruthy();
    await page.mouse.move(
      controlsBox!.x + controlsBox!.width / 2,
      controlsBox!.y + controlsBox!.height - 48,
    );
    await page.mouse.wheel(0, 600);
    await expect.poll(() => controls.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => preview.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return bounds.bottom > 0 && bounds.top < window.innerHeight;
    })).toBe(true);
    await expect.poll(() => page.getByTestId('theme-editor-tabs')
      .evaluate((element) => Math.abs(element.getBoundingClientRect().top
        - element.closest('.theme-controls')!.getBoundingClientRect().top))).toBeLessThan(2);
    await expect(page.getByTestId('theme-tab-classNames')).toHaveAttribute('aria-selected', 'true');
  });

  test('theme builder places the preview first and uses page scrolling on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const demo = new DemoPage(page);
    await demo.gotoExample('theme-builder');
    await expect.poll(() => page.locator('.theme-preview')
      .evaluate((element) => getComputedStyle(element).position)).toBe('static');
    await expect.poll(() => page.locator('.theme-controls')
      .evaluate((element) => getComputedStyle(element).overflowY)).toBe('visible');
    await expect.poll(() => page.getByTestId('theme-editor-tabs')
      .evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

    const preview = demo.exampleBuilder();
    const controls = page.locator('.theme-controls');
    expect(await preview.evaluate((element) => element.getBoundingClientRect().top))
      .toBeLessThan(await controls.evaluate((element) => element.getBoundingClientRect().top));
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
