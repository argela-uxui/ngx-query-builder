import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderConfig, QueryBuilderModule, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { IconComponent } from '../shared/icon.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ToggleComponent } from '../shared/toggle.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';

interface DirectiveInfo {
  name: string;
  context: string;
}

const DIRECTIVES: DirectiveInfo[] = [
  { name: '*querySwitchGroup', context: '$implicit: RuleSet, onChange(condition), getDisabledState()' },
  { name: '*queryButtonGroup', context: '$implicit: RuleSet, addRule(), addRuleSet?(), removeRuleSet?(), getLabel()' },
  { name: '*queryArrowIcon', context: '$implicit: RuleSet, getDisabledState()' },
  { name: '*queryEntity', context: '$implicit: Rule, entities, onChange(entity, rule)' },
  { name: '*queryField', context: '$implicit: Rule, fields, getFields(entity), onChange(field, rule)' },
  { name: '*queryOperator', context: '$implicit: Rule, operators, getLabel(op), onChange()' },
  { name: '*queryInput', context: "$implicit: Rule, field, options, onChange() — keyed by type: '…'" },
  { name: '*queryRemoveButton', context: '$implicit: Rule, removeRule(rule)' },
  { name: '*queryEmptyWarning', context: '$implicit: RuleSet, message' },
];

const HTML_CODE = `<query-builder [formControl]="queryCtrl" [config]="config" [allowCollapse]="true">
  <ng-container *querySwitchGroup="let ruleset; let onChange = onChange">
    <button (click)="onChange('and')" [attr.aria-pressed]="ruleset.condition === 'and'">Match all</button>
    <button (click)="onChange('or')" [attr.aria-pressed]="ruleset.condition === 'or'">Match any</button>
  </ng-container>

  <ng-container *queryButtonGroup="let ruleset; let addRule = addRule; let addRuleSet = addRuleSet; let removeRuleSet = removeRuleSet">
    <button (click)="addRule()">+ Condition</button>
    @if (addRuleSet) { <button (click)="addRuleSet()">+ Group</button> }
    @if (removeRuleSet) { <button (click)="removeRuleSet()">Delete group</button> }
  </ng-container>

  <ng-container *queryArrowIcon="let ruleset">⌄</ng-container>

  <ng-container *queryEntity="let rule; let entities = entities; let onChange = onChange">
    <select [(ngModel)]="rule.entity" (ngModelChange)="onChange($event, rule)">
      @for (e of entities; track e.value) { <option [ngValue]="e.value">{{ e.name }}</option> }
    </select>
  </ng-container>

  <ng-container *queryField="let rule; let getFields = getFields; let onChange = onChange">
    <select [(ngModel)]="rule.field" (ngModelChange)="onChange($event, rule)">
      @for (f of getFields(rule.entity); track f.value) { <option [ngValue]="f.value">{{ f.name }}</option> }
    </select>
  </ng-container>

  <ng-container *queryOperator="let rule; let operators = operators; let getLabel = getLabel; let onChange = onChange">
    <select [(ngModel)]="rule.operator" (ngModelChange)="onChange()">
      @for (op of operators; track op) { <option [ngValue]="op">{{ getLabel(op) }}</option> }
    </select>
  </ng-container>

  <ng-container *queryInput="let rule; type: 'boolean'; let onChange = onChange">
    <button (click)="rule.value = !rule.value; onChange()">{{ rule.value ? 'Yes' : 'No' }}</button>
  </ng-container>

  <ng-container *queryRemoveButton="let rule; let removeRule = removeRule">
    <button (click)="removeRule(rule)" aria-label="Remove condition">🗑</button>
  </ng-container>

  <ng-container *queryEmptyWarning="let message = message">
    <p class="empty">{{ message }}</p>
  </ng-container>
</query-builder>`;

@Component({
  selector: 'app-custom-templates-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderModule, PageHeaderComponent, DemoCardComponent, IconComponent, ToggleComponent],
  template: `
    <app-page-header eyebrow="Customization" title="Custom templates"
      description="All nine structural directives replace a part of the UI while the component keeps owning the data. Templates are inherited by nested rulesets automatically."
      [apis]="directiveNames" />

    <div class="split">
      <app-demo-card heading="Fully custom UI" description="Every piece of chrome below is rendered by your own templates." [tabs]="tabs()">
        <div cardActions>
          <app-toggle label="Disabled" testId="toggle-custom-disabled" [checked]="disabled()" (checkedChange)="setDisabled($event)" />
        </div>
        <div class="custom-qb" data-testid="example-builder">
          <query-builder [formControl]="queryCtrl" [config]="config" [allowCollapse]="true">
            <ng-container *querySwitchGroup="let ruleset; let onChange = onChange; let getDisabledState = getDisabledState">
              <div class="c-switch" role="group" aria-label="Condition" data-testid="custom-switch-group">
                <button type="button" [attr.aria-pressed]="ruleset.condition === 'and'" [disabled]="getDisabledState()" (click)="onChange('and')">Match all</button>
                <button type="button" [attr.aria-pressed]="ruleset.condition === 'or'" [disabled]="getDisabledState()" (click)="onChange('or')">Match any</button>
              </div>
            </ng-container>

            <ng-container *queryButtonGroup="let ruleset; let addRule = addRule; let addRuleSet = addRuleSet; let removeRuleSet = removeRuleSet; let getDisabledState = getDisabledState">
              <div class="c-actions" data-testid="custom-button-group">
                <button type="button" class="btn btn--sm" [disabled]="getDisabledState()" (click)="addRule()">+ Condition</button>
                @if (addRuleSet) {
                  <button type="button" class="btn btn--sm" [disabled]="getDisabledState()" (click)="addRuleSet()">+ Group</button>
                }
                @if (removeRuleSet) {
                  <button type="button" class="btn btn--sm btn--danger" [disabled]="getDisabledState()" (click)="removeRuleSet()">Delete group</button>
                }
              </div>
            </ng-container>

            <ng-container *queryArrowIcon="let ruleset">
              <span class="c-arrow" data-testid="custom-arrow-icon">›</span>
            </ng-container>

            <ng-container *queryEntity="let rule; let entities = entities; let onChange = onChange; let getDisabledState = getDisabledState">
              <select class="c-select c-select--entity" data-testid="custom-entity" aria-label="Entity"
                [(ngModel)]="rule.entity" (ngModelChange)="onChange($event, rule)" [disabled]="getDisabledState()">
                @for (entity of entities; track entity.value) {
                  <option [ngValue]="entity.value">{{ entity.name }}</option>
                }
              </select>
            </ng-container>

            <ng-container *queryField="let rule; let getFields = getFields; let onChange = onChange; let getDisabledState = getDisabledState">
              <select class="c-select" data-testid="custom-field" aria-label="Field"
                [(ngModel)]="rule.field" (ngModelChange)="onChange($event, rule)" [disabled]="getDisabledState()">
                @for (field of getFields(rule.entity); track field.value) {
                  <option [ngValue]="field.value">{{ field.name }}</option>
                }
              </select>
            </ng-container>

            <ng-container *queryOperator="let rule; let operators = operators; let getLabel = getLabel; let onChange = onChange; let getDisabledState = getDisabledState">
              <select class="c-select c-select--operator" data-testid="custom-operator" aria-label="Operator"
                [(ngModel)]="rule.operator" (ngModelChange)="onChange()" [disabled]="getDisabledState()">
                @for (op of operators; track op) {
                  <option [ngValue]="op">{{ getLabel(op) }}</option>
                }
              </select>
            </ng-container>

            <ng-container *queryInput="let rule; type: 'string'; let onChange = onChange; let getDisabledState = getDisabledState">
              <input class="c-input" data-testid="custom-input-string" aria-label="Value" placeholder="Type a value…"
                [(ngModel)]="rule.value" (ngModelChange)="onChange()" [disabled]="getDisabledState()" />
            </ng-container>

            <ng-container *queryInput="let rule; type: 'number'; let onChange = onChange; let getDisabledState = getDisabledState">
              <input class="c-input c-input--number" type="number" data-testid="custom-input-number" aria-label="Value"
                [(ngModel)]="rule.value" (ngModelChange)="onChange()" [disabled]="getDisabledState()" />
            </ng-container>

            <ng-container *queryInput="let rule; type: 'category'; let options = options; let onChange = onChange; let getDisabledState = getDisabledState">
              <div class="c-chips" role="radiogroup" aria-label="Value" data-testid="custom-input-category">
                @for (option of options; track option.value) {
                  <button type="button" role="radio" [attr.aria-checked]="rule.value === option.value" [disabled]="getDisabledState()"
                    (click)="rule.value = option.value; onChange()">{{ option.name }}</button>
                }
              </div>
            </ng-container>

            <ng-container *queryInput="let rule; type: 'boolean'; let onChange = onChange; let getDisabledState = getDisabledState">
              <button type="button" class="c-bool" data-testid="custom-input-boolean" [class.c-bool--on]="rule.value"
                [attr.aria-pressed]="!!rule.value" [disabled]="getDisabledState()" (click)="rule.value = !rule.value; onChange()">
                {{ rule.value ? 'Yes' : 'No' }}
              </button>
            </ng-container>

            <ng-container *queryRemoveButton="let rule; let removeRule = removeRule; let getDisabledState = getDisabledState">
              <button type="button" class="icon-btn c-remove" data-testid="custom-remove-button" aria-label="Remove condition"
                [disabled]="getDisabledState()" (click)="removeRule(rule)">
                <app-icon name="trash" />
              </button>
            </ng-container>

            <ng-container *queryEmptyWarning="let message = message">
              <p class="callout callout--warning c-empty" data-testid="custom-empty-warning">{{ message }}</p>
            </ng-container>
          </query-builder>
        </div>
      </app-demo-card>

      <section class="panel">
        <h2 class="panel-title">Directive contexts</h2>
        <dl class="directives">
          @for (directive of directives; track directive.name) {
            <dt><code>{{ directive.name }}</code></dt>
            <dd class="muted small">{{ directive.context }}</dd>
          }
        </dl>
      </section>
    </div>
  `,
  styleUrl: './custom-templates.component.scss',
})
export class CustomTemplatesExampleComponent {
  readonly directives = DIRECTIVES;
  readonly directiveNames = DIRECTIVES.map((directive) => directive.name);
  readonly disabled = signal(false);

  readonly config: QueryBuilderConfig = {
    entities: {
      user: { name: 'User' },
      plan: { name: 'Plan' },
    },
    fields: {
      firstName: { name: 'First name', type: 'string', entity: 'user' },
      logins: { name: 'Logins (30d)', type: 'number', entity: 'user' },
      verified: { name: 'Verified', type: 'boolean', entity: 'user' },
      tier: {
        name: 'Tier',
        type: 'category',
        entity: 'plan',
        operators: ['=', '!='],
        options: [
          { name: 'Free', value: 'free' },
          { name: 'Pro', value: 'pro' },
          { name: 'Enterprise', value: 'enterprise' },
        ],
      },
      seats: { name: 'Seats', type: 'number', entity: 'plan' },
    },
  };

  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { entity: 'user', field: 'firstName', operator: 'contains', value: 'an' },
        { entity: 'user', field: 'verified', operator: '=', value: true },
        {
          condition: 'or',
          rules: [
            { entity: 'plan', field: 'tier', operator: '=', value: 'pro' },
            { entity: 'plan', field: 'seats', operator: '>=', value: 10 },
          ],
        },
        { condition: 'and', rules: [] },
      ],
    },
    { nonNullable: true },
  );
  private readonly value = trackControlValue(this.queryCtrl);

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'html', label: 'HTML', language: 'html', code: HTML_CODE },
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
  ]);

  setDisabled(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) {
      this.queryCtrl.disable();
    } else {
      this.queryCtrl.enable();
    }
  }
}
