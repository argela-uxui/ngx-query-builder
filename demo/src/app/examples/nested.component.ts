import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { IconComponent } from '../shared/icon.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ToggleComponent } from '../shared/toggle.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { getRuleSetStats, isRuleSet, toReadableText } from '../shared/query-format';
import { cloneRuleSet, createPeopleConfig } from '../shared/sample-data';

function createNestedQuery(): RuleSet {
  return {
    condition: 'and',
    rules: [
      { field: 'age', operator: '>=', value: 18 },
      {
        condition: 'or',
        rules: [
          { field: 'occupation', operator: '=', value: 'student' },
          {
            condition: 'and',
            rules: [
              { field: 'occupation', operator: '=', value: 'teacher' },
              { field: 'educated', operator: '=', value: true },
              {
                condition: 'or',
                collapsed: true,
                rules: [
                  { field: 'school', operator: 'is not null' },
                  { field: 'tags', operator: 'in', value: ['angular'] },
                ],
              },
            ],
          },
        ],
      },
      {
        condition: 'or',
        collapsed: true,
        rules: [
          { field: 'gender', operator: '=', value: 'f' },
          { field: 'name', operator: 'like', value: 'A%' },
        ],
      },
    ],
  };
}

function setCollapsed(ruleset: RuleSet, collapsed: boolean, isRoot = true): void {
  if (!isRoot) {
    ruleset.collapsed = collapsed;
  }
  ruleset.rules.filter(isRuleSet).forEach((child) => setCollapsed(child, collapsed, false));
}

@Component({
  selector: 'app-nested-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent, IconComponent, ToggleComponent],
  template: `
    <app-page-header eyebrow="Interaction" title="Nested rulesets & collapse"
      description="Rulesets nest to any depth; each level renders its own <query-builder> and inherits config, templates and inputs. With allowCollapse every group gets an animated toggle, and the collapsed flag is part of the model."
      [apis]="['[allowRuleset]', '[allowCollapse]', 'RuleSet.collapsed', 'recursive rendering']" />

    <div class="split">
      <app-demo-card heading="Deeply nested query" description="Two groups start collapsed via collapsed: true." [tabs]="tabs()">
        <div cardActions class="row">
          <button type="button" class="btn btn--sm" data-testid="expand-all" (click)="setAll(false)">Expand all</button>
          <button type="button" class="btn btn--sm" data-testid="collapse-all" (click)="setAll(true)">Collapse all</button>
        </div>
        <div data-testid="example-builder">
          <query-builder [formControl]="queryCtrl" [config]="config" [allowCollapse]="allowCollapse()" [allowRuleset]="allowRuleset()" />
        </div>
      </app-demo-card>

      <aside class="stack">
        <section class="panel stack-sm">
          <h2 class="panel-title">Options</h2>
          <app-toggle label="Allow collapse" hint="[allowCollapse]" testId="toggle-nested-collapse"
            [checked]="allowCollapse()" (checkedChange)="allowCollapse.set($event)" />
          <app-toggle label="Allow ruleset" hint="[allowRuleset] — hides group buttons" testId="toggle-nested-ruleset"
            [checked]="allowRuleset()" (checkedChange)="allowRuleset.set($event)" />
          <button type="button" class="btn btn--sm" (click)="reset()"><app-icon name="refresh" [size]="14" /> Reset</button>
        </section>
        <section class="panel">
          <h2 class="panel-title">Tree stats</h2>
          <div class="row">
            <span class="stat"><strong>{{ stats().rules }}</strong> rules</span>
            <span class="stat"><strong>{{ stats().rulesets }}</strong> rulesets</span>
            <span class="stat" data-testid="nested-depth"><strong>{{ stats().depth }}</strong> levels</span>
          </div>
        </section>
      </aside>
    </div>
  `,
})
export class NestedExampleComponent {
  readonly allowCollapse = signal(true);
  readonly allowRuleset = signal(true);
  readonly config = createPeopleConfig();

  readonly queryCtrl = new FormControl<RuleSet>(createNestedQuery(), { nonNullable: true });
  private readonly value = trackControlValue(this.queryCtrl);
  readonly stats = computed(() => getRuleSetStats(this.value()));

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'text', label: 'Readable', language: 'text', code: toReadableText(this.value(), this.config) },
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    {
      id: 'html',
      label: 'HTML',
      language: 'html',
      code: `<query-builder [formControl]="queryCtrl" [config]="config" [allowCollapse]="true" />`,
    },
  ]);

  /** Collapsed state lives in the model, so a new value is written to re-render every level. */
  setAll(collapsed: boolean): void {
    const next = cloneRuleSet(this.queryCtrl.value);
    setCollapsed(next, collapsed);
    this.queryCtrl.setValue(next);
  }

  reset(): void {
    this.queryCtrl.setValue(createNestedQuery());
  }
}
