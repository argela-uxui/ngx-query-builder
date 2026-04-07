/**
 * Shared Playwright Page Object for the ngx-query-builder demo app.
 * Provides typed helpers for all stable selectors so individual spec
 * files stay concise and independent of CSS/attribute changes.
 */
import { Page, Locator, expect } from '@playwright/test';

export class DemoPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for query builder to render all 10 initial rules (ensures Angular CD has run)
    await expect(this.page.locator('select.q-field-control')).toHaveCount(10);
  }

  /** Click "Add Rule" and wait for the new rule row to appear in the DOM. */
  async addRule(): Promise<void> {
    const before = await this.fieldSelects().count();
    await this.addRuleButtons().first().click();
    await expect(this.fieldSelects()).toHaveCount(before + 1);
  }

  /** Click "Add Ruleset" and wait for the new ruleset to appear in the DOM. */
  async addRuleset(): Promise<void> {
    const before = await this.page.locator('.q-ruleset').count();
    await this.addRulesetButtons().first().click();
    await expect(this.page.locator('.q-ruleset')).toHaveCount(before + 1);
  }

  /**
   * Capture the current JSON output text, then return the parsed JSON
   * after it changes from that text. Use this before a mutation to get
   * the current state; then call waitForOutputChange() after the mutation.
   */
  async getOutputText(): Promise<string> {
    return this.queryOutput().innerText();
  }

  /** Wait for the query output panel to show different text from prevText. */
  async waitForOutputChange(prevText: string): Promise<void> {
    await this.page.waitForFunction(
      ([selector, prev]: [string, string]) => {
        const el = document.querySelector(selector);
        return el != null && el.textContent !== prev;
      },
      ['[data-testid="query-output"]', prevText] as [string, string],
    );
  }

  // ---------- Controls ----------

  toggleEntityMode(): Locator {
    return this.page.locator('[data-testid="toggle-entity-mode"]');
  }

  toggleDisabled(): Locator {
    return this.page.locator('[data-testid="toggle-disabled"]');
  }

  toggleAllowRuleset(): Locator {
    return this.page.locator('[data-testid="toggle-allow-ruleset"]');
  }

  toggleAllowCollapse(): Locator {
    return this.page.locator('[data-testid="toggle-allow-collapse"]');
  }

  togglePersistValue(): Locator {
    return this.page.locator('[data-testid="toggle-persist-value"]');
  }

  badgeValid(): Locator {
    return this.page.locator('[data-testid="badge-valid"]');
  }

  badgeTouched(): Locator {
    return this.page.locator('[data-testid="badge-touched"]');
  }

  queryOutput(): Locator {
    return this.page.locator('[data-testid="query-output"]');
  }

  // ---------- Query Builder Internals ----------

  /** All "Rule" add-buttons — excludes "Ruleset" buttons */
  addRuleButtons(): Locator {
    return this.page.locator('.q-button:not(.q-remove-button)')
      .filter({ hasText: /Rule/ })
      .filter({ hasNotText: /Ruleset/ });
  }

  addRulesetButtons(): Locator {
    return this.page.locator('.q-button:not(.q-remove-button)').filter({ hasText: 'Ruleset' });
  }

  removeRuleButtons(): Locator {
    return this.page.locator('.q-remove-button').filter({ hasNot: this.page.locator('.q-add-icon') });
  }

  /** All field <select> dropdowns */
  fieldSelects(): Locator {
    return this.page.locator('select.q-field-control');
  }

  /** All operator <select> dropdowns */
  operatorSelects(): Locator {
    return this.page.locator('select.q-operator-control');
  }

  /** All input controls (text, number, date, time, checkbox, category select) */
  inputControls(): Locator {
    return this.page.locator('.q-input-control');
  }

  /** Arrow icon buttons (collapse toggle) */
  arrowButtons(): Locator {
    return this.page.locator('.q-arrow-icon-button');
  }

  /** Tree containers (the collapsible div) */
  treeContainers(): Locator {
    return this.page.locator('.q-tree-container');
  }

  /** Entity <select> dropdowns */
  entitySelects(): Locator {
    return this.page.locator('select.q-entity-control');
  }

  /** AND/OR condition labels — returns ALL matching labels so callers can use .nth() or .last() */
  conditionLabels(value: 'AND' | 'OR'): Locator {
    return this.page.locator('.q-switch-label').filter({ hasText: value });
  }

  /** @deprecated use conditionLabels(value).nth(index) */
  conditionLabel(value: 'AND' | 'OR', index = 0): Locator {
    return this.conditionLabels(value).nth(index);
  }

  /** The custom textarea from *queryInput template */
  customTextarea(): Locator {
    return this.page.locator('[data-testid="custom-textarea"]');
  }

  /** Parse the current JSON output */
  async getOutputJson(): Promise<Record<string, unknown>> {
    const text = await this.queryOutput().innerText();
    return JSON.parse(text);
  }
}
