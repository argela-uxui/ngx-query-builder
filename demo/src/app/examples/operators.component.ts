import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Field, QueryBuilderComponent, QueryBuilderConfig, QueryBuilderTranslations, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { ENGLISH_TRANSLATIONS } from '../shared/sample-data';

type OperatorMode = 'default' | 'operatorMap' | 'getOperators';

interface ModeOption {
  id: OperatorMode;
  label: string;
  description: string;
}

/** Mirrors the library's built-in operator map, used to seed valid rules. */
const DEFAULT_OPERATOR_MAP: Record<string, string[]> = {
  string: ['=', '!=', 'contains', 'like'],
  number: ['=', '!=', '>', '>=', '<', '<='],
  category: ['=', '!=', 'in', 'not in'],
  boolean: ['='],
};

const CUSTOM_OPERATOR_MAP: Record<string, string[]> = {
  string: ['=', '!=', 'startsWith', 'endsWith', 'contains'],
  number: ['=', '>', '<'],
  category: ['in', 'not in'],
  boolean: ['='],
};

const FIELDS: Record<string, Field> = {
  name: { name: 'Name', type: 'string' },
  email: { name: 'Email', type: 'string' },
  age: { name: 'Age', type: 'number' },
  // Per-field operators always win over operatorMap.
  status: {
    name: 'Status',
    type: 'category',
    operators: ['=', '!='],
    options: [
      { name: 'Active', value: 'active' },
      { name: 'Suspended', value: 'suspended' },
    ],
  },
  premium: { name: 'Premium', type: 'boolean' },
};

function getOperatorsCallback(fieldName: string, field: Field): string[] {
  if (fieldName === 'email') {
    return ['=', 'endsWith'];
  }
  if (field.type === 'number') {
    return ['>=', '<='];
  }
  return field.operators ?? ['=', '!='];
}

function resolveOperators(mode: OperatorMode, key: string): string[] {
  const field = FIELDS[key];
  if (mode === 'getOperators') {
    return getOperatorsCallback(key, field);
  }
  const map = mode === 'operatorMap' ? CUSTOM_OPERATOR_MAP : DEFAULT_OPERATOR_MAP;
  return field.operators ?? map[field.type] ?? [];
}

const SAMPLE_VALUES: Record<string, unknown> = {
  name: 'Ada',
  email: '@example.com',
  age: 30,
  status: 'active',
  premium: true,
};

function createQuery(mode: OperatorMode): RuleSet {
  return {
    condition: 'and',
    rules: Object.keys(FIELDS).map((field) => {
      const operator = resolveOperators(mode, field)[0];
      const value = SAMPLE_VALUES[field];
      return { field, operator, value: operator === 'in' || operator === 'not in' ? [value] : value };
    }),
  };
}

const TRANSLATIONS: QueryBuilderTranslations = {
  ...ENGLISH_TRANSLATIONS,
  operatorLabels: {
    ...ENGLISH_TRANSLATIONS.operatorLabels,
    '=': 'equals',
    '!=': 'does not equal',
    '>': 'greater than',
    '>=': 'at least',
    '<': 'less than',
    '<=': 'at most',
    startsWith: 'starts with',
    endsWith: 'ends with',
    in: 'is one of',
    'not in': 'is none of',
  },
};

const CODE: Record<OperatorMode, string> = {
  default: `// Built-in operator map (per field type) is used.
// Per-field "operators" always take precedence:
status: { name: 'Status', type: 'category', operators: ['=', '!='], options: [...] }

<query-builder [formControl]="queryCtrl" [config]="config" [translations]="translations" />`,
  operatorMap: `operatorMap: Record<string, string[]> = {
  string: ['=', '!=', 'startsWith', 'endsWith', 'contains'],
  number: ['=', '>', '<'],
  category: ['in', 'not in'],
  boolean: ['='],
};

<query-builder [formControl]="queryCtrl" [config]="config" [operatorMap]="operatorMap" />`,
  getOperators: `config: QueryBuilderConfig = {
  fields,
  // Full control — called for every field, overrides operatorMap and field.operators.
  getOperators: (fieldName, field) => {
    if (fieldName === 'email') { return ['=', 'endsWith']; }
    if (field.type === 'number') { return ['>=', '<=']; }
    return field.operators ?? ['=', '!='];
  },
};`,
};

const LABELS_CODE = `// Friendly operator labels via translations.operatorLabels
translations: QueryBuilderTranslations = {
  ...english,
  operatorLabels: {
    ...english.operatorLabels,
    '=': 'equals',
    '!=': 'does not equal',
    startsWith: 'starts with',
    endsWith: 'ends with',
    in: 'is one of',
    ...
  },
};`;

@Component({
  selector: 'app-operators-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Configuration" title="Operators"
      description="Operators are resolved in this order: config.getOperators → field.operators → [operatorMap] → built-in map. Nullable fields get is null / is not null appended. Labels come from translations.operatorLabels."
      [apis]="['[operatorMap]', 'Field.operators', 'config.getOperators', 'translations.operatorLabels']" />

    <app-demo-card heading="Operator resolution" [description]="activeMode().description" [tabs]="tabs()">
      <div cardActions class="segmented" role="group" aria-label="Operator source">
        @for (option of modes; track option.id) {
          <button type="button" [attr.aria-pressed]="mode() === option.id" [attr.data-testid]="'mode-' + option.id"
            (click)="setMode(option.id)">{{ option.label }}</button>
        }
      </div>
      <div class="stack-sm">
        <label class="friendly">
          <input type="checkbox" [checked]="friendlyLabels()" (change)="friendlyLabels.set(!friendlyLabels())"
            data-testid="toggle-friendly-labels" />
          Use friendly operator labels
        </label>
        <div data-testid="example-builder">
          <query-builder [formControl]="queryCtrl" [config]="config()" [operatorMap]="operatorMap()"
            [translations]="friendlyLabels() ? translations : undefined" />
        </div>
      </div>
    </app-demo-card>
  `,
  styles: `.friendly { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer; }`,
})
export class OperatorsExampleComponent {
  readonly modes: ModeOption[] = [
    { id: 'default', label: 'Built-in', description: 'Built-in operators per type, with per-field overrides on "Status".' },
    { id: 'operatorMap', label: '[operatorMap]', description: 'A custom operator map replaces the defaults per field type.' },
    { id: 'getOperators', label: 'getOperators()', description: 'A callback decides the operator list for each field.' },
  ];
  readonly translations = TRANSLATIONS;

  readonly mode = signal<OperatorMode>('default');
  readonly friendlyLabels = signal(true);
  readonly activeMode = computed(() => this.modes.find((m) => m.id === this.mode())!);

  // A fresh config object per mode also resets the component's internal operator cache.
  readonly config = computed<QueryBuilderConfig>(() =>
    this.mode() === 'getOperators' ? { fields: FIELDS, getOperators: getOperatorsCallback } : { fields: FIELDS },
  );
  readonly operatorMap = computed(() => (this.mode() === 'operatorMap' ? CUSTOM_OPERATOR_MAP : undefined));

  readonly queryCtrl = new FormControl<RuleSet>(createQuery('default'), { nonNullable: true });
  private readonly value = trackControlValue(this.queryCtrl);

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    { id: 'code', label: 'Code', language: 'typescript', code: CODE[this.mode()] },
    { id: 'labels', label: 'Labels', language: 'typescript', code: LABELS_CODE },
  ]);

  setMode(mode: OperatorMode): void {
    this.mode.set(mode);
    this.queryCtrl.setValue(createQuery(mode));
  }
}
