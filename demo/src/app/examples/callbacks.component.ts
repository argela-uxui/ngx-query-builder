import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  Field,
  Option,
  QueryBuilderComponent,
  QueryBuilderConfig,
  QueryInputDirective,
  QueryValue,
  Rule,
  RuleSet,
} from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';

type Region = 'eu' | 'us';

interface LogEntry {
  id: number;
  time: string;
  hook: string;
  detail: string;
}

type RangeValue = [number | null, number | null];

/** Simulates options fetched per region — returned from config.getOptions(). */
const BRANDS: Record<Region, Option[]> = {
  eu: [
    { name: 'Volkswagen', value: 'vw' },
    { name: 'Renault', value: 'renault' },
    { name: 'Fiat', value: 'fiat' },
  ],
  us: [
    { name: 'Ford', value: 'ford' },
    { name: 'Tesla', value: 'tesla' },
    { name: 'Chevrolet', value: 'chevrolet' },
  ],
};

const TS_CODE = `config: QueryBuilderConfig = {
  fields,
  // Map (field, operator) → input type. 'between' renders a custom 'range' *queryInput.
  getInputType: (field, operator) => {
    if (operator === 'is null' || operator === 'is not null') { return null!; }
    if (operator === 'between') { return 'range'; }
    if (operator === 'in' || operator === 'not in') { return 'multiselect'; }
    return fields[field].type;
  },
  // Options can be dynamic — e.g. filtered by current app state.
  getOptions: (field) => field === 'brand' ? BRANDS[region()] : fields[field].options ?? [],
  // Take over structural edits.
  addRule: (parent) => { parent.rules = [{ field: 'price', operator: 'between', value: [10, 100] }, ...parent.rules]; },
  addRuleSet: (parent) => { parent.rules = [...parent.rules, { condition: 'or', rules: [{ field: 'inStock', operator: '=', value: true }] }]; },
  removeRule: (rule, parent) => { parent.rules = parent.rules.filter((r) => r !== rule); },
  removeRuleSet: (ruleset, parent) => { parent.rules = parent.rules.filter((r) => r !== ruleset); },
  // Keep values consistent with the chosen operator.
  coerceValueForOperator: (operator, value) => operator === 'between' ? toRange(value) : Array.isArray(value) && !isList(operator) ? value[0] : value,
  // Decide what happens to the value when the field changes.
  calculateFieldChangeValue: (current, next, value) => current?.type === next.type ? value : next.defaultValue,
};`;

const HTML_CODE = `<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryInput="let rule; type: 'range'; let onChange = onChange">
    <input type="number" [(ngModel)]="rule.value[0]" (ngModelChange)="onChange()" />
    <span>and</span>
    <input type="number" [(ngModel)]="rule.value[1]" (ngModelChange)="onChange()" />
  </ng-container>
</query-builder>`;

@Component({
  selector: 'app-callbacks-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, QueryInputDirective, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Configuration" title="Config callbacks"
      description="Every structural and value decision can be delegated to your code. Each hook below writes to the event log so you can see exactly when it fires."
      [apis]="['getInputType', 'getOptions', 'addRule', 'addRuleSet', 'removeRule', 'removeRuleSet', 'coerceValueForOperator', 'calculateFieldChangeValue']" />

    <div class="split">
      <app-demo-card heading="Product filter" description="“+ Rule” inserts a price range at the top; choose “between” for a custom range input." [tabs]="tabs()">
        <div cardActions class="segmented" role="group" aria-label="Brand region (getOptions)">
          <button type="button" [attr.aria-pressed]="region() === 'eu'" data-testid="region-eu" (click)="setRegion('eu')">EU brands</button>
          <button type="button" [attr.aria-pressed]="region() === 'us'" data-testid="region-us" (click)="setRegion('us')">US brands</button>
        </div>
        <div data-testid="example-builder">
          @for (currentRegion of [region()]; track currentRegion) {
            <query-builder [formControl]="queryCtrl" [config]="config">
              <ng-container *queryInput="let rule; type: 'range'; let onChange = onChange; let getDisabledState = getDisabledState">
                @let range = asRange(rule);
                <span class="range" data-testid="range-input">
                  <input type="number" class="text-input" aria-label="From" [(ngModel)]="range[0]" (ngModelChange)="onChange()" [disabled]="getDisabledState()" />
                  <span class="muted">and</span>
                  <input type="number" class="text-input" aria-label="To" [(ngModel)]="range[1]" (ngModelChange)="onChange()" [disabled]="getDisabledState()" />
                </span>
              </ng-container>
            </query-builder>
          }
        </div>
      </app-demo-card>

      <section class="panel">
        <div class="row row--between log-header">
          <h2 class="panel-title">Event log</h2>
          <button type="button" class="btn btn--sm btn--ghost" (click)="log.set([])">Clear</button>
        </div>
        @if (log().length) {
          <ol class="event-log" data-testid="event-log" aria-live="polite">
            @for (entry of log(); track entry.id) {
              <li><time>{{ entry.time }}</time><strong>{{ entry.hook }}</strong><span class="muted">{{ entry.detail }}</span></li>
            }
          </ol>
        } @else {
          <p class="muted small">Interact with the builder to see callbacks fire.</p>
        }
      </section>
    </div>
  `,
  styles: `
    .range { display: inline-flex; align-items: center; gap: 6px; padding-right: 10px; }
    .range input { width: 90px; }
    .log-header { margin-bottom: 8px; }
    .log-header .panel-title { margin: 0; }
    .event-log li { flex-wrap: wrap; }
  `,
})
export class CallbacksExampleComponent {
  readonly region = signal<Region>('eu');
  readonly log = signal<LogEntry[]>([]);
  private nextLogId = 0;
  private readonly seenCallbacks = new Set<string>();

  private readonly fields: Record<string, Field> = {
    price: { name: 'Price', type: 'number', operators: ['=', '>', '<', 'between'], defaultValue: 0 },
    brand: { name: 'Brand', type: 'category', operators: ['=', '!=', 'in', 'not in'] },
    name: { name: 'Model name', type: 'string' },
    inStock: { name: 'In stock', type: 'boolean', defaultValue: true },
  };

  readonly config: QueryBuilderConfig = {
    fields: this.fields,
    getInputType: (field: string, operator: string): string => {
      this.recordOnce('getInputType', `${field} + ${operator || '='}`);
      if (operator === 'between') {
        return 'range';
      }
      if (operator === 'in' || operator === 'not in') {
        return 'multiselect';
      }
      return this.fields[field].type;
    },
    getOptions: (field: string): Option[] => {
      this.recordOnce('getOptions', `${field} → ${field === 'brand' ? this.region().toUpperCase() : 'field config'}`);
      return field === 'brand' ? BRANDS[this.region()] : (this.fields[field].options ?? []);
    },
    addRule: (parent: RuleSet): void => {
      parent.rules = [{ field: 'price', operator: 'between', value: [10, 100] }, ...parent.rules];
      this.record('addRule', 'inserted price range at the top');
    },
    addRuleSet: (parent: RuleSet): void => {
      parent.rules = [...parent.rules, { condition: 'or', rules: [{ field: 'inStock', operator: '=', value: true }] }];
      this.record('addRuleSet', 'added pre-filled OR group');
    },
    removeRule: (rule: Rule, parent: RuleSet): void => {
      parent.rules = parent.rules.filter((item) => item !== rule);
      this.record('removeRule', `removed "${rule.field}"`);
    },
    removeRuleSet: (ruleset: RuleSet, parent: RuleSet): void => {
      parent.rules = parent.rules.filter((item) => item !== ruleset);
      this.record('removeRuleSet', `removed group with ${ruleset.rules.length} item(s)`);
    },
    coerceValueForOperator: (operator: string, value: QueryValue, rule: Rule): QueryValue => {
      let next: QueryValue = value;
      if (operator === 'between') {
        next = this.toRange(value);
      } else if (operator === 'in' || operator === 'not in') {
        next = Array.isArray(value) ? value : value == null ? [] : [value];
      } else if (Array.isArray(value)) {
        next = value[0] ?? null;
      }
      this.record('coerceValueForOperator', `${rule.field} ${operator}: ${JSON.stringify(value)} → ${JSON.stringify(next)}`);
      return next;
    },
    calculateFieldChangeValue: (currentField: Field, nextField: Field, currentValue: QueryValue): QueryValue => {
      const keep = currentField?.type === nextField.type;
      const next = keep ? currentValue : typeof nextField.defaultValue === 'function' ? nextField.defaultValue() : nextField.defaultValue;
      this.record('calculateFieldChangeValue', `${currentField?.name ?? '∅'} → ${nextField.name}: ${keep ? 'kept value' : 'reset to default'}`);
      return next;
    },
  };

  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { field: 'price', operator: 'between', value: [20, 80] },
        { field: 'brand', operator: 'in', value: ['vw', 'fiat'] },
        { field: 'name', operator: 'contains', value: 'GT' },
      ],
    },
    { nonNullable: true },
  );
  private readonly value = trackControlValue(this.queryCtrl);

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    { id: 'ts', label: 'Config', language: 'typescript', code: TS_CODE },
    { id: 'html', label: 'HTML', language: 'html', code: HTML_CODE },
  ]);

  setRegion(region: Region): void {
    this.region.set(region);
    this.record('getOptions', `brand options now come from the ${region.toUpperCase()} catalogue`);
  }

  /** Ensures the rule holds a mutable [from, to] tuple and returns it for two-way binding. */
  asRange(rule: Rule): RangeValue {
    if (!Array.isArray(rule.value) || rule.value.length !== 2) {
      rule.value = this.toRange(rule.value);
    }
    return rule.value as RangeValue;
  }

  private toRange(value: QueryValue): RangeValue {
    if (Array.isArray(value)) {
      return [Number(value[0] ?? 0), Number(value[1] ?? value[0] ?? 0)];
    }
    const start = typeof value === 'number' ? value : null;
    return [start, start];
  }

  private record(hook: string, detail: string): void {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    this.log.update((entries) => [{ id: this.nextLogId++, time, hook, detail }, ...entries].slice(0, 50));
  }

  private recordOnce(hook: string, detail: string): void {
    const key = `${hook}:${detail}`;
    if (this.seenCallbacks.has(key)) {
      return;
    }
    this.seenCallbacks.add(key);
    // getInputType/getOptions run from template expressions; defer signal writes
    // until after Angular finishes evaluating the current view.
    queueMicrotask(() => this.record(hook, detail));
  }
}
