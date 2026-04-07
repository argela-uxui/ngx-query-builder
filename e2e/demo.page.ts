/**
 * Shared Playwright Page Object for the ngx-query-builder demo app.
 * Provides typed helpers for all stable selectors so individual spec
 * files stay concise and independent of CSS/attribute changes.
 */
import { Page, Locator } from '@playwright/test';

export class DemoPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for query builder to render
    await this.page.waitForSelector('[data-testid="query-builder"] query-builder');
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
