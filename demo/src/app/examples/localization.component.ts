import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, QueryBuilderTranslations, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import {
  ENGLISH_TRANSLATIONS,
  GERMAN_TRANSLATIONS,
  TURKISH_TRANSLATIONS,
  createPeopleConfig,
} from '../shared/sample-data';

type Locale = 'en' | 'tr' | 'de' | 'none';

interface LocaleOption {
  id: Locale;
  label: string;
  translations: QueryBuilderTranslations | undefined;
}

@Component({
  selector: 'app-localization-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Customization" title="Localization"
      description="Pass a QueryBuilderTranslations object to localize button labels, AND/OR, aria-labels, the empty-ruleset warning and every operator label. Operator values in the model never change — only their labels do."
      [apis]="['[translations]', 'QueryBuilderTranslations', 'operatorLabels', '[emptyMessage]']" />

    <app-demo-card heading="Runtime language switching" [description]="description()" [tabs]="tabs()">
      <div cardActions class="segmented" role="group" aria-label="Language">
        @for (option of locales; track option.id) {
          <button type="button" [attr.aria-pressed]="locale() === option.id" [attr.data-testid]="'locale-' + option.id"
            (click)="locale.set(option.id)">{{ option.label }}</button>
        }
      </div>
      @if (locale() === 'none') {
        <div class="form-field empty-message">
          <label class="form-label" for="loc-empty-message">[emptyMessage]</label>
          <input id="loc-empty-message" class="input" data-testid="loc-empty-message" [ngModel]="emptyMessage()"
            (ngModelChange)="emptyMessage.set($event)" />
        </div>
      }
      <div data-testid="example-builder">
        <query-builder [formControl]="queryCtrl" [config]="config" [allowCollapse]="true"
          [translations]="translations()" [emptyMessage]="emptyMessage()" />
      </div>
    </app-demo-card>
  `,
  styles: `.empty-message { max-width: 460px; margin-bottom: 16px; }`,
})
export class LocalizationExampleComponent {
  readonly locales: LocaleOption[] = [
    { id: 'en', label: 'English', translations: ENGLISH_TRANSLATIONS },
    { id: 'tr', label: 'Türkçe', translations: TURKISH_TRANSLATIONS },
    { id: 'de', label: 'Deutsch', translations: GERMAN_TRANSLATIONS },
    { id: 'none', label: 'No translations', translations: undefined },
  ];

  readonly locale = signal<Locale>('tr');
  readonly emptyMessage = signal('Custom empty message: this group needs at least one rule.');
  readonly translations = computed(() => this.locales.find((option) => option.id === this.locale())?.translations);
  readonly description = computed(() =>
    this.locale() === 'none'
      ? 'Without translations the built-in English labels are used and [emptyMessage] controls the warning.'
      : 'The empty group below shows the localized emptyRuleset message.',
  );

  readonly config = createPeopleConfig();
  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'or',
      rules: [
        { field: 'occupation', operator: 'in', value: ['student', 'teacher'] },
        { field: 'school', operator: 'is not null' },
        { field: 'name', operator: 'contains', value: 'Ay' },
        { condition: 'and', rules: [] },
      ],
    },
    { nonNullable: true },
  );

  readonly tabs = computed<CodeTab[]>(() => {
    const translations = this.translations();
    return [
      {
        id: 'translations',
        label: 'Translations',
        language: 'typescript',
        code: translations
          ? `translations: QueryBuilderTranslations = ${JSON.stringify(translations, null, 2)};`
          : `// No [translations] bound\n<query-builder [emptyMessage]="'${this.emptyMessage()}'" ... />`,
      },
      {
        id: 'html',
        label: 'HTML',
        language: 'html',
        code: `<query-builder [formControl]="queryCtrl" [config]="config" [translations]="translations" />`,
      },
    ];
  });
}
