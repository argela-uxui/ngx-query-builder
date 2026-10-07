import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

test.describe('Localization Builder', () => {
  test('exposes all translation fields, loads samples, and applies edits to the preview', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('localization-builder');

    await expect(page.getByTestId('translation-addRule')).toBeVisible();
    await expect(page.getByTestId('translation-emptyRuleset')).toBeVisible();
    await expect(page.locator('[data-testid^="translation-"]')).toHaveCount(9);
    await page.getByTestId('localization-tab-operators').click();
    await expect(page.getByTestId('operator-label-contains')).toBeVisible();
    await page.getByTestId('localization-tab-labels').click();
    await expect(demo.addRuleButtons().first()).toContainText('Rule');

    await page.getByTestId('translation-addRule').fill('Ajouter une règle');
    await expect(demo.addRuleButtons().first()).toContainText('Ajouter une règle');

    await page.getByTestId('localization-profile-select').selectOption('de');
    await page.getByTestId('load-localization').click();
    await expect(demo.addRuleButtons().first()).toContainText('Regel');
    await expect(page.getByTestId('localization-message')).toContainText('Loaded “Deutsch”.');

    await page.getByTestId('localization-tab-operators').click();
    await page.getByTestId('custom-operator-key').fill('startsWith');
    await page.getByTestId('add-operator-label').click();
    await expect(page.getByTestId('operator-label-startsWith')).toHaveValue('startsWith');
    await page.getByTestId('localization-tab-code').click();
    await expect(page.getByTestId('localization-code')).toHaveValue(/startsWith/);
  });

  test('saves, reloads, and deletes named language profiles without changing samples', async ({ page }) => {
    const demo = new DemoPage(page);
    await demo.gotoExample('localization-builder');

    await page.getByTestId('translation-addRule').fill('Nouvelle règle');
    await page.getByTestId('localization-name').fill('Français');
    await page.getByTestId('save-localization').click();
    await expect(page.getByTestId('localization-message')).toContainText('Saved “Français”.');

    await page.reload();
    const profileSelect = page.getByTestId('localization-profile-select');
    await expect(profileSelect).toContainText('Français');
    await profileSelect.selectOption({ label: 'Français' });
    await page.getByTestId('load-localization').click();
    await expect(demo.addRuleButtons().first()).toContainText('Nouvelle règle');

    await page.getByTestId('delete-localization').click();
    await expect(profileSelect).not.toContainText('Français');
    await expect(profileSelect.locator('optgroup[label="Sample languages"] option')).toHaveCount(3);
  });

  test('copies the generated TypeScript language file', async ({ page, context }) => {
    const demo = new DemoPage(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await demo.gotoExample('localization-builder');

    await page.getByTestId('localization-tab-code').click();
    const languageFile = await page.getByTestId('localization-code').inputValue();
    await page.getByTestId('copy-localization-file').click();

    await expect(page.getByTestId('localization-message')).toContainText('copied to clipboard');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(languageFile);
  });
});
