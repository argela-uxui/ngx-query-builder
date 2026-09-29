import { ChangeDetectionStrategy, Component, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, QueryBuilderConfig, QueryInputDirective, Rule, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ToggleComponent } from '../shared/toggle.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';

/** Shape returned by the field validators below and collected into `errors.rules`. */
interface RuleError {
  field: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TS_CODE = `config: QueryBuilderConfig = {
  allowEmptyRulesets: false,              // empty groups → errors.empty
  fields: {
    age: {
      name: 'Age', type: 'number',
      // Return null when valid, anything else is pushed to errors.rules
      validator: (rule) => {
        const age = Number(rule.value);
        return age >= 18 && age <= 120 ? null : { field: 'age', message: 'Age must be between 18 and 120.' };
      },
    },
    email: {
      name: 'Email', type: 'string',
      validator: (rule) => EMAIL_PATTERN.test(String(rule.value ?? ''))
        ? null : { field: 'email', message: 'Enter a valid email address.' },
    },
  },
};`;

const HTML_CODE = `<query-builder [formControl]="queryCtrl" [config]="config">
  <!-- Override the built-in inputs to show inline errors -->
  <ng-container *queryInput="let rule; type: 'number'; let field = field; let onChange = onChange">
    <input type="number" [(ngModel)]="rule.value" (ngModelChange)="onChange()"
      [class.is-invalid]="errorFor(rule, field)" />
    <small>{{ errorFor(rule, field)?.message }}</small>
  </ng-container>
</query-builder>

@if (queryCtrl.errors; as errors) { <pre>{{ errors | json }}</pre> }`;

@Component({
  selector: 'app-validation-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, QueryInputDirective, PageHeaderComponent, DemoCardComponent, ToggleComponent],
  template: `
    <app-page-header eyebrow="Configuration" title="Validation"
      description="The component is also an Angular Validator. Field validators report rule errors, and empty rulesets are rejected unless allowEmptyRulesets is enabled. Custom *queryInput templates can surface errors inline."
      [apis]="['Field.validator', 'config.allowEmptyRulesets', 'NG_VALIDATORS', 'errors.rules', 'errors.empty']" />

    <div class="split">
      <app-demo-card heading="Validated query" description="Try an age of 12 or an invalid email, or add an empty ruleset." [tabs]="tabs()">
        <div cardActions>
          <span class="badge" [class.valid]="queryCtrl.valid" [class.invalid]="queryCtrl.invalid" data-testid="validation-status">{{ queryCtrl.valid ? 'Valid' : 'Invalid' }}</span>
        </div>
        <div data-testid="example-builder">
          <query-builder [formControl]="queryCtrl" [config]="config()">
            <ng-container *queryInput="let rule; type: 'number'; let field = field; let onChange = onChange; let getDisabledState = getDisabledState">
              <span class="validated">
                <input type="number" class="q-input-control text-input" [class.is-invalid]="errorFor(rule, field)"
                  [(ngModel)]="rule.value" (ngModelChange)="onChange()" [disabled]="getDisabledState()"
                  [attr.aria-invalid]="!!errorFor(rule, field)" [attr.aria-label]="field.name" />
                @if (errorFor(rule, field); as error) {
                  <small class="validated__error" data-testid="inline-error">{{ error.message }}</small>
                }
              </span>
            </ng-container>
            <ng-container *queryInput="let rule; type: 'string'; let field = field; let onChange = onChange; let getDisabledState = getDisabledState">
              <span class="validated">
                <input type="text" class="q-input-control text-input" [class.is-invalid]="errorFor(rule, field)"
                  [(ngModel)]="rule.value" (ngModelChange)="onChange()" [disabled]="getDisabledState()"
                  [attr.aria-invalid]="!!errorFor(rule, field)" [attr.aria-label]="field.name" />
                @if (errorFor(rule, field); as error) {
                  <small class="validated__error" data-testid="inline-error">{{ error.message }}</small>
                }
              </span>
            </ng-container>
          </query-builder>
        </div>
      </app-demo-card>

      <aside class="stack">
        <section class="panel stack-sm">
          <h2 class="panel-title">Options</h2>
          <app-toggle label="Allow empty rulesets" hint="config.allowEmptyRulesets" testId="toggle-allow-empty"
            [checked]="allowEmptyRulesets()" (checkedChange)="setAllowEmpty($event)" />
        </section>
        <section class="panel">
          <h2 class="panel-title">Errors</h2>
          @if (errorMessages().length) {
            <ul class="errors" data-testid="error-list">
              @for (message of errorMessages(); track $index) {
                <li>{{ message }}</li>
              }
            </ul>
          } @else {
            <p class="muted">No validation errors 🎉</p>
          }
        </section>
      </aside>
    </div>
  `,
  styles: `
    .validated { display: inline-flex; flex-direction: column; gap: 2px; padding-right: 10px; vertical-align: top; }
    .validated .is-invalid { border-color: var(--danger); background: var(--danger-soft); }
    .validated__error { color: var(--danger); font-size: 11.5px; }
    .errors { margin: 0; padding-left: 18px; color: var(--danger); }
    .errors li + li { margin-top: 4px; }
  `,
})
export class ValidationExampleComponent {
  private readonly injector = inject(Injector);

  readonly allowEmptyRulesets = signal(false);

  private readonly fields: QueryBuilderConfig['fields'] = {
    age: {
      name: 'Age',
      type: 'number',
      validator: (rule: Rule): RuleError | null => {
        const age = Number(rule.value);
        return rule.value !== null && rule.value !== '' && age >= 18 && age <= 120
          ? null
          : { field: 'age', message: 'Age must be between 18 and 120.' };
      },
    },
    email: {
      name: 'Email',
      type: 'string',
      validator: (rule: Rule): RuleError | null =>
        EMAIL_PATTERN.test(String(rule.value ?? '')) ? null : { field: 'email', message: 'Enter a valid email address.' },
    },
    username: {
      name: 'Username',
      type: 'string',
      validator: (rule: Rule): RuleError | null =>
        String(rule.value ?? '').trim().length >= 3 ? null : { field: 'username', message: 'Username needs at least 3 characters.' },
    },
    country: {
      name: 'Country',
      type: 'category',
      options: [
        { name: 'Türkiye', value: 'TR' },
        { name: 'Germany', value: 'DE' },
        { name: 'United States', value: 'US' },
      ],
    },
  };

  readonly config = computed<QueryBuilderConfig>(() => ({
    fields: this.fields,
    allowEmptyRulesets: this.allowEmptyRulesets(),
  }));

  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { field: 'age', operator: '>=', value: 12 },
        { field: 'email', operator: '=', value: 'ada@example' },
        { field: 'username', operator: '=', value: 'ada' },
        { field: 'country', operator: '=', value: 'TR' },
      ],
    },
    { nonNullable: true },
  );
  private readonly value = trackControlValue(this.queryCtrl);

  readonly errorMessages = computed<string[]>(() => {
    this.value();
    const errors = this.queryCtrl.errors;
    if (!errors) {
      return [];
    }
    const messages: string[] = [];
    if (typeof errors['empty'] === 'string') {
      messages.push(errors['empty']);
    }
    const ruleErrors = errors['rules'] as RuleError[] | undefined;
    ruleErrors?.forEach((error) => messages.push(error.message));
    return messages;
  });

  /** `errors` is not a signal; reading `value()` re-evaluates it after every emission. */
  readonly errorsJson = computed(() => {
    this.value();
    return toPrettyJson(this.queryCtrl.errors);
  });

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'errors', label: 'Errors', language: 'json', code: this.errorsJson() },
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    { id: 'ts', label: 'Config', language: 'typescript', code: TS_CODE },
    { id: 'html', label: 'HTML', language: 'html', code: HTML_CODE },
  ]);

  errorFor(rule: Rule, field: QueryBuilderConfig['fields'][string] | undefined): RuleError | null {
    const result = field?.validator?.(rule, this.queryCtrl.value);
    return (result as RuleError | null | undefined) ?? null;
  }

  setAllowEmpty(allow: boolean): void {
    this.allowEmptyRulesets.set(allow);
    // Re-run validation once the new config reached the component.
    afterNextRender(() => this.queryCtrl.updateValueAndValidity(), { injector: this.injector });
  }
}
