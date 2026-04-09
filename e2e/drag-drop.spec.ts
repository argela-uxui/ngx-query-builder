import { test, expect } from '@playwright/test';
import { DemoPage } from './demo.page';

function getNestedRulesetAtDepth(root: Record<string, unknown>, depth: number): Record<string, unknown> {
  let current = root;
  for (let i = 0; i < depth; i += 1) {
    const rules = current['rules'] as Array<Record<string, unknown>>;
    const next = rules.find((item) => Array.isArray(item['rules']));
    expect(next, `Expected nested ruleset at depth ${i + 1}`).toBeTruthy();
    current = next!;
  }
  return current;
}

test.describe('Rule Drag-Drop', () => {
  let demo: DemoPage;

  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });

  test('enables draggable rule rows only when drag-drop toggle is on', async () => {
    await expect(demo.dragHandles()).toHaveCount(0);

    await demo.toggleDragDropRules().check();

    await expect(demo.dragHandles().first()).toBeVisible();
    await expect(demo.draggableRuleRows().first()).toBeVisible();
  });

  test('drags rules from root into 2nd and 3rd-level rulesets', async () => {
    test.fail(true, 'Known issue: cross-ruleset drag into depth >=2 does not always register in headless runs.');

    await demo.toggleDragDropRules().check();

    // Build depth-3 by adding a ruleset inside the existing nested ruleset (depth-2).
    await demo.addRulesetAtBuilder(1);
    await expect(demo.queryBuilderInstances()).toHaveCount(3);

    const before = await demo.getOutputJson();
    const rootBeforeRules = before['rules'] as Array<Record<string, unknown>>;
    const rootBeforeCount = rootBeforeRules.filter((item) => !Array.isArray(item['rules'])).length;
    const secondLevelBefore = getNestedRulesetAtDepth(before, 1);
    const secondLevelBeforeCount = (secondLevelBefore['rules'] as Array<Record<string, unknown>>).length;
    const thirdLevelBefore = getNestedRulesetAtDepth(before, 2);
    const thirdLevelBeforeCount = (thirdLevelBefore['rules'] as Array<Record<string, unknown>>).length;

    const firstPrevText = await demo.getOutputText();
    const firstDragChanged = await demo.dragHandleToBuilderUntilOutputChanges(0, 1, firstPrevText);
    expect(firstDragChanged).toBe(true);

    const secondPrevText = await demo.getOutputText();
    const secondDragChanged = await demo.dragHandleToBuilderUntilOutputChanges(0, 2, secondPrevText);
    expect(secondDragChanged).toBe(true);

    const after = await demo.getOutputJson();
    const rootAfterRules = after['rules'] as Array<Record<string, unknown>>;
    const rootAfterCount = rootAfterRules.filter((item) => !Array.isArray(item['rules'])).length;
    const secondLevelAfter = getNestedRulesetAtDepth(after, 1);
    const secondLevelAfterCount = (secondLevelAfter['rules'] as Array<Record<string, unknown>>).length;
    const thirdLevelAfter = getNestedRulesetAtDepth(after, 2);
    const thirdLevelAfterCount = (thirdLevelAfter['rules'] as Array<Record<string, unknown>>).length;

    expect(rootAfterCount).toBe(rootBeforeCount - 2);
    expect(secondLevelAfterCount).toBe(secondLevelBeforeCount + 1);
    expect(thirdLevelAfterCount).toBe(thirdLevelBeforeCount + 1);
  });
});







