import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, QueryBuilderConfig, QueryInputDirective, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';

interface FieldTypeRow {
  type: string;
  control: string;
  operators: string;
}

const FIELD_TYPE_ROWS: FieldTypeRow[] = [
  { type: 'string', control: 'text input', operators: '= != contains like' },
  { type: 'number', control: 'number input', operators: '= != > >= < <=' },
  { type: 'date', control: 'date input', operators: '= != > >= < <=' },
  { type: 'time', control: 'time input', operators: '= != > >= < <=' },
  { type: 'category', control: 'select (multiselect for in / not in)', operators: '= != in not in' },
  { type: 'boolean', control: 'checkbox', operators: '=' },
  { type: 'multiselect', control: 'multi-select', operators: 'set via field.operators' },
  { type: 'nullable: true', control: 'value hidden for null checks', operators: '+ is null, is not null' },
  { type: '<custom>', control: '*queryInput="…; type: \'custom\'"', operators: 'set via field.operators' },
];

const TS_CODE = `config: QueryBuilderConfig = {
  fields: {
    title:     { name: 'Title', type: 'string' },
    price:     { name: 'Price', type: 'number', defaultValue: 100, defaultOperator: '<=' },
    released:  { name: 'Release date', type: 'date', defaultValue: () => new Date().toISOString().slice(0, 10) },
    showtime:  { name: 'Show time', type: 'time' },
    genre:     { name: 'Genre', type: 'category', options: [...] },
    available: { name: 'Available', type: 'boolean', defaultValue: true },
    languages: { name: 'Languages', type: 'multiselect', operators: ['in', 'not in'], options: [...] },
    director:  { name: 'Director', type: 'string', nullable: true },
    synopsis:  { name: 'Synopsis', type: 'textarea', operators: ['contains'] },
    rating:    { name: 'Rating', type: 'rating', operators: ['>=', '<=', '='], defaultValue: 3 },
  },
};`;

const HTML_CODE = `<query-builder [formControl]="queryCtrl" [config]="config">
  <!-- Custom input type: textarea -->
  <ng-container *queryInput="let rule; type: 'textarea'; let onChange = onChange; let getDisabledState = getDisabledState">
    <textarea [(ngModel)]="rule.value" (ngModelChange)="onChange()" [disabled]="getDisabledState()"></textarea>
  </ng-container>

  <!-- Custom input type: star rating -->
  <ng-container *queryInput="let rule; type: 'rating'; let onChange = onChange; let getDisabledState = getDisabledState">
    @for (star of [1, 2, 3, 4, 5]; track star) {
      <button type="button" (click)="rule.value = star; onChange()" [disabled]="getDisabledState()">
        {{ star <= rule.value ? '★' : '☆' }}
      </button>
    }
  </ng-container>
</query-builder>`;

@Component({
  selector: 'app-field-types-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, QueryInputDirective, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Getting started" title="Field types"
      description="Every built-in input type, nullable fields, default values/operators and two custom input types rendered with *queryInput."
      [apis]="['Field.type', 'Field.options', 'Field.nullable', 'Field.defaultValue', 'Field.defaultOperator', '*queryInput']" />

    <div class="stack">
      <app-demo-card heading="All input types" description="Change a rule's field to see its default operator and value being applied."
        [tabs]="tabs()">
        <div data-testid="example-builder">
          <query-builder [formControl]="queryCtrl" [config]="config">
            <ng-container *queryInput="let rule; type: 'textarea'; let onChange = onChange; let getDisabledState = getDisabledState">
              <textarea class="text-input text-area" [(ngModel)]="rule.value" (ngModelChange)="onChange()"
                [disabled]="getDisabledState()" aria-label="Synopsis" placeholder="Custom textarea input"></textarea>
            </ng-container>
            <ng-container *queryInput="let rule; type: 'rating'; let onChange = onChange; let getDisabledState = getDisabledState">
              <span class="rating" role="radiogroup" aria-label="Rating" data-testid="rating-input">
                @for (star of stars; track star) {
                  <button type="button" class="rating__star" role="radio" [attr.aria-checked]="star === rule.value"
                    [attr.aria-label]="star + ' stars'" [class.rating__star--on]="star <= rule.value"
                    [disabled]="getDisabledState()" (click)="rule.value = star; onChange()">★</button>
                }
              </span>
            </ng-container>
          </query-builder>
        </div>
      </app-demo-card>

      <section class="panel">
        <h2 class="panel-title">Type reference</h2>
        <table class="table">
          <thead><tr><th scope="col">type</th><th scope="col">Rendered control</th><th scope="col">Default operators</th></tr></thead>
          <tbody>
            @for (row of rows; track row.type) {
              <tr><td><code>{{ row.type }}</code></td><td>{{ row.control }}</td><td class="muted">{{ row.operators }}</td></tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: `
    .rating { display: inline-flex; gap: 2px; padding-right: 10px; }
    .rating__star {
      width: 28px; height: 32px; border: 0; background: transparent; cursor: pointer;
      font-size: 20px; line-height: 1; color: var(--border-strong);
    }
    .rating__star--on { color: #f59e0b; }
    .rating__star:disabled { cursor: default; }
  `,
})
export class FieldTypesExampleComponent {
  readonly rows = FIELD_TYPE_ROWS;
  readonly stars = [1, 2, 3, 4, 5];

  readonly config: QueryBuilderConfig = {
    fields: {
      title: { name: 'Title', type: 'string' },
      price: { name: 'Price', type: 'number', defaultValue: 100, defaultOperator: '<=' },
      released: { name: 'Release date', type: 'date', defaultValue: () => new Date().toISOString().slice(0, 10) },
      showtime: { name: 'Show time', type: 'time', defaultValue: '20:00' },
      genre: {
        name: 'Genre',
        type: 'category',
        options: [
          { name: 'Drama', value: 'drama' },
          { name: 'Comedy', value: 'comedy' },
          { name: 'Sci-Fi', value: 'scifi' },
          { name: 'Documentary', value: 'doc' },
        ],
      },
      available: { name: 'Available', type: 'boolean', defaultValue: true },
      languages: {
        name: 'Languages',
        type: 'multiselect',
        operators: ['in', 'not in'],
        options: [
          { name: 'English', value: 'en' },
          { name: 'Turkish', value: 'tr' },
          { name: 'German', value: 'de' },
          { name: 'Japanese', value: 'ja' },
        ],
      },
      director: { name: 'Director', type: 'string', nullable: true },
      synopsis: { name: 'Synopsis', type: 'textarea', operators: ['contains'] },
      rating: { name: 'Rating', type: 'rating', operators: ['>=', '<=', '='], defaultValue: 3 },
    },
  };

  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { field: 'title', operator: 'contains', value: 'Star' },
        { field: 'price', operator: '<=', value: 100 },
        { field: 'released', operator: '>=', value: '2020-01-01' },
        { field: 'showtime', operator: '>', value: '18:30' },
        { field: 'genre', operator: 'in', value: ['drama', 'scifi'] },
        { field: 'available', operator: '=', value: true },
        { field: 'languages', operator: 'in', value: ['en', 'tr'] },
        { field: 'director', operator: 'is not null' },
        { field: 'synopsis', operator: 'contains', value: 'space' },
        { field: 'rating', operator: '>=', value: 4 },
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
}
