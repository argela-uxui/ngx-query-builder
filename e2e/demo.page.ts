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

  toggleDragDropRules(): Locator {
    return this.page.locator('[data-testid="toggle-drag-drop-rules"]');
  }

  languageSelect(): Locator {
    return this.page.locator('[data-testid="language-select"]');
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
    return this.page.locator('.q-button-group > button.q-button:not(.q-remove-button):first-child');
  }

  addRulesetButtons(): Locator {
    return this.page.locator('.q-button-group > button.q-button:not(.q-remove-button):has(.q-add-icon):nth-child(2)');
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

  /** Draggable rule rows (visible when dragDropRules is enabled). */
  draggableRuleRows(): Locator {
    return this.page.locator('li.q-draggable-rule');
  }

  /** Default drag handles rendered next to field selectors. */
  dragHandles(): Locator {
    return this.page.locator('button.q-drag-handle');
  }

  queryBuilderInstances(): Locator {
    return this.page.locator('query-builder');
  }

  builderAt(index: number): Locator {
    return this.queryBuilderInstances().nth(index);
  }

  dropListAtBuilder(index: number): Locator {
    return this.builderAt(index).locator('ul.q-tree').first();
  }

  dragHandleAtBuilder(index: number, ruleIndex = 0): Locator {
    return this.builderAt(index).locator('button.q-drag-handle').nth(ruleIndex);
  }

  async addRulesetAtBuilder(index: number): Promise<void> {
    const before = await this.queryBuilderInstances().count();
    await this.builderAt(index)
      .locator('.q-button-group > button.q-button:not(.q-remove-button):has(.q-add-icon):nth-child(2)')
      .first()
      .click();
    await expect(this.queryBuilderInstances()).toHaveCount(before + 1);
  }

  async dragHandleToBuilder(sourceBuilderIndex: number, targetBuilderIndex: number, sourceRuleIndex = 0): Promise<void> {
    const source = this.dragHandleAtBuilder(sourceBuilderIndex, sourceRuleIndex);
    const target = this.dropListAtBuilder(targetBuilderIndex);
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    expect(sourceBox).toBeTruthy();
    expect(targetBox).toBeTruthy();

    const startX = sourceBox!.x + sourceBox!.width / 2;
    const startY = sourceBox!.y + sourceBox!.height / 2;
    const targetX = targetBox!.x + targetBox!.width / 2;
    const targetY = targetBox!.y + Math.min(24, targetBox!.height / 2);

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + 6, startY + 6, { steps: 4 });
    await this.page.mouse.move(targetX, targetY, { steps: 14 });
    await this.page.mouse.up();
  }

  async dragHandleToBuilderUntilOutputChanges(
    sourceBuilderIndex: number,
    targetBuilderIndex: number,
    prevOutputText: string,
    sourceRuleIndex = 0,
  ): Promise<boolean> {
    const source = this.dragHandleAtBuilder(sourceBuilderIndex, sourceRuleIndex);
    const target = this.dropListAtBuilder(targetBuilderIndex);

    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    expect(sourceBox).toBeTruthy();
    expect(targetBox).toBeTruthy();

    const startX = sourceBox!.x + sourceBox!.width / 2;
    const startY = sourceBox!.y + sourceBox!.height / 2;
    const targetPoints = [
      { x: targetBox!.x + 16, y: targetBox!.y + 14 },
      { x: targetBox!.x + targetBox!.width / 2, y: targetBox!.y + targetBox!.height / 2 },
      { x: targetBox!.x + 18, y: targetBox!.y + Math.max(16, targetBox!.height - 12) },
    ];

    for (const point of targetPoints) {
      await this.page.mouse.move(startX, startY);
      await this.page.mouse.down();
      await this.page.mouse.move(startX + 8, startY + 8, { steps: 5 });
      await this.page.mouse.move(point.x, point.y, { steps: 16 });
      await this.page.mouse.up();

      await this.page.waitForTimeout(120);
      const after = await this.getOutputText();
      if (after !== prevOutputText) {
        return true;
      }
    }

    return false;
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

  /** Condition labels by underlying radio value (localization-safe). */
  conditionLabelsByValue(value: 'and' | 'or'): Locator {
    return this.page.locator(`input.q-switch-radio[value="${value}"] + label.q-switch-label`);
  }

  conditionLabelByValue(value: 'and' | 'or', index = 0): Locator {
    return this.conditionLabelsByValue(value).nth(index);
  }

  /** All AND/OR radio inputs across all query-builder instances */
  switchRadios(): Locator {
    return this.page.locator('.q-switch-radio');
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
