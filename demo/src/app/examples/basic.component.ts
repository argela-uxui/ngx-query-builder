import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, QueryBuilderConfig, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';

const TS_CODE = `import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, QueryBuilderConfig, RuleSet } from 'ngx-query-builder';

@Component({
  selector: 'app-search',
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent],
  templateUrl: './search.component.html',
})
export class SearchComponent {
  config: QueryBuilderConfig = {
    fields: {
      name: { name: 'Name', type: 'string' },
      age: { name: 'Age', type: 'number' },
      city: {
        name: 'City',
        type: 'category',
        options: [
          { name: 'Istanbul', value: 'ist' },
          { name: 'Ankara', value: 'ank' },
        ],
      },
      active: { name: 'Active', type: 'boolean' },
    },
  };

  // Template-driven
  query: RuleSet = { condition: 'and', rules: [{ field: 'name', operator: '=', value: 'Jane' }] };

  // Reactive
  queryCtrl = new FormControl<RuleSet>({ condition: 'or', rules: [] }, { nonNullable: true });
}`;

const HTML_MODEL = `<query-builder [(ngModel)]="query" [config]="config" />`;
const HTML_REACTIVE = `<query-builder [formControl]="queryCtrl" [config]="config" />

<p>Valid: {{ queryCtrl.valid }} · Dirty: {{ queryCtrl.dirty }}</p>`;

@Component({
  selector: 'app-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Getting started" title="Basic usage"
      description="The query builder is a standalone form control. Bind it with ngModel for template-driven forms or with a FormControl for reactive forms — the value is always a plain RuleSet object."
      [apis]="['QueryBuilderComponent', 'ngModel', 'formControl', 'QueryBuilderConfig.fields']" />

    <div class="stack">
      <app-demo-card heading="Template-driven (ngModel)" description="Two-way binding to a plain RuleSet property."
        [tabs]="modelTabs()">
        <div data-testid="example-builder">
          <query-builder [(ngModel)]="modelQuery" (ngModelChange)="modelJson.set(toJson($event))" [config]="config" />
        </div>
      </app-demo-card>

      <app-demo-card heading="Reactive forms (FormControl)" description="Integrates with validation and form state out of the box."
        [tabs]="reactiveTabs()">
        <div cardActions class="row">
          <span class="badge" [class.valid]="queryCtrl.valid" [class.invalid]="queryCtrl.invalid">{{ queryCtrl.valid ? 'Valid' : 'Invalid' }}</span>
          <span class="badge" [class.active]="queryCtrl.dirty">{{ queryCtrl.dirty ? 'Dirty' : 'Pristine' }}</span>
        </div>
        <query-builder [formControl]="queryCtrl" [config]="config" />
        @if (queryCtrl.invalid) {
          <p class="callout callout--warning hint">
            Empty rulesets are invalid by default — add a rule to make the control valid.
          </p>
        }
      </app-demo-card>
    </div>
  `,
  styles: `.hint { margin-top: 12px; }`,
})
export class BasicExampleComponent {
  readonly config: QueryBuilderConfig = {
    fields: {
      name: { name: 'Name', type: 'string' },
      age: { name: 'Age', type: 'number' },
      city: {
        name: 'City',
        type: 'category',
        options: [
          { name: 'Istanbul', value: 'ist' },
          { name: 'Ankara', value: 'ank' },
          { name: 'Izmir', value: 'izm' },
        ],
      },
      active: { name: 'Active', type: 'boolean' },
    },
  };

  modelQuery: RuleSet = {
    condition: 'and',
    rules: [
      { field: 'name', operator: '=', value: 'Jane' },
      { field: 'age', operator: '>=', value: 18 },
    ],
  };
  readonly modelJson = signal(toPrettyJson(this.modelQuery));

  readonly queryCtrl = new FormControl<RuleSet>({ condition: 'or', rules: [] }, { nonNullable: true });
  private readonly reactiveValue = trackControlValue(this.queryCtrl);

  readonly modelTabs = computed<CodeTab[]>(() => [
    { id: 'output', label: 'Output', language: 'json', code: this.modelJson() },
    { id: 'html', label: 'HTML', language: 'html', code: HTML_MODEL },
    { id: 'ts', label: 'TypeScript', language: 'typescript', code: TS_CODE },
  ]);

  readonly reactiveTabs = computed<CodeTab[]>(() => [
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.reactiveValue()) },
    { id: 'html', label: 'HTML', language: 'html', code: HTML_REACTIVE },
    { id: 'ts', label: 'TypeScript', language: 'typescript', code: TS_CODE },
  ]);

  readonly toJson = toPrettyJson;
}
