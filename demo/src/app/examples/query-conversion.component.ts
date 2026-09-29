import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FieldMap, QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { IconComponent } from '../shared/icon.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { isValidRuleSet, toMongo, toReadableText, toSqlStatement } from '../shared/query-format';
import { createPeopleConfig } from '../shared/sample-data';

const CONVERTER_CODE = `function ruleToSql(rule: Rule): string {
  switch (rule.operator) {
    case 'is null':  return \`\${rule.field} IS NULL\`;
    case 'in':       return \`\${rule.field} IN (\${list(rule.value)})\`;
    case 'contains': return \`\${rule.field} LIKE '%\${rule.value}%'\`;
    default:         return \`\${rule.field} \${rule.operator} \${literal(rule.value)}\`;
  }
}

export function toSql(ruleset: RuleSet): string {
  return ruleset.rules
    .map((item) => 'rules' in item ? \`(\${toSql(item)})\` : ruleToSql(item))
    .join(\` \${ruleset.condition.toUpperCase()} \`);
}`;

function encodeQuery(query: RuleSet): string {
  return btoa(encodeURIComponent(JSON.stringify(query)));
}

function decodeQuery(encoded: string, fields: FieldMap): RuleSet | null {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(encoded)));
    return isValidRuleSet(parsed, fields) ? parsed : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-query-conversion-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent, IconComponent],
  template: `
    <app-page-header eyebrow="Integration" title="Query conversion"
      description="The RuleSet is plain JSON, so turning it into SQL, a MongoDB filter, a human-readable sentence or a shareable URL is a small recursive function. The converters used here live in demo/src/app/shared/query-format.ts."
      [apis]="['RuleSet', 'Rule', 'SQL', 'MongoDB', 'URL state']" />

    <app-demo-card heading="Build once, query anywhere" description="Every tab below is derived from the same form value." [tabs]="tabs()">
      <div cardActions class="row">
        <label class="table-name">
          <span class="form-label">SQL table</span>
          <input class="input" data-testid="sql-table" [ngModel]="table()" (ngModelChange)="table.set($event)" aria-label="SQL table name" />
        </label>
        <button type="button" class="btn btn--sm" data-testid="share-link" (click)="updateUrl()">
          <app-icon name="copy" [size]="14" /> {{ shared() ? 'URL updated' : 'Save to URL' }}
        </button>
      </div>
      <div data-testid="example-builder">
        <query-builder [formControl]="queryCtrl" [config]="config" />
      </div>
    </app-demo-card>
  `,
  styles: `
    .table-name { display: inline-flex; align-items: center; gap: 8px; }
    .table-name .input { width: 120px; min-height: 28px; padding: 2px 8px; }
  `,
})
export class QueryConversionExampleComponent {
  private readonly router = inject(Router);

  /** Bound from the `?q=` query param via withComponentInputBinding(). */
  readonly q = input<string>();

  readonly config = createPeopleConfig();
  readonly table = signal('people');
  readonly shared = signal(false);

  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { field: 'age', operator: '>=', value: 21 },
        { field: 'name', operator: 'contains', value: "O'Neil" },
        { field: 'tags', operator: 'in', value: ['angular', 'rxjs'] },
        {
          condition: 'or',
          rules: [
            { field: 'school', operator: 'is null' },
            { field: 'occupation', operator: '!=', value: 'unemployed' },
          ],
        },
      ],
    },
    { nonNullable: true },
  );
  private readonly value = trackControlValue(this.queryCtrl);

  readonly tabs = computed<CodeTab[]>(() => {
    const query = this.value();
    return [
      { id: 'sql', label: 'SQL', language: 'sql', code: toSqlStatement(query, this.table() || 'people'), testId: 'sql-output' },
      { id: 'mongo', label: 'MongoDB', language: 'json', code: toPrettyJson(toMongo(query)), testId: 'mongo-output' },
      { id: 'text', label: 'Readable', language: 'text', code: toReadableText(query, this.config), testId: 'text-output' },
      { id: 'json', label: 'JSON', language: 'json', code: toPrettyJson(query) },
      { id: 'converter', label: 'Converter', language: 'typescript', code: CONVERTER_CODE },
    ];
  });

  constructor() {
    // Restore a query shared through the URL.
    effect(() => {
      const encoded = this.q();
      if (!encoded) {
        return;
      }
      const decoded = decodeQuery(encoded, this.config.fields);
      if (decoded) {
        untracked(() => this.queryCtrl.setValue(decoded));
      }
    });
    this.queryCtrl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.shared.set(false));
  }

  updateUrl(): void {
    void this.router.navigate([], { queryParams: { q: encodeQuery(this.queryCtrl.value) }, replaceUrl: true });
    this.shared.set(true);
  }
}
