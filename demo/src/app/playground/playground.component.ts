import { ChangeDetectionStrategy, Component, Injector, afterNextRender, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderConfig, QueryBuilderModule, QueryBuilderTranslations, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { IconComponent } from '../shared/icon.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ToggleComponent } from '../shared/toggle.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { getRuleSetStats, toMongo, toReadableText, toSqlStatement } from '../shared/query-format';
import {
  ENGLISH_TRANSLATIONS,
  TURKISH_TRANSLATIONS,
  createPeopleConfig,
  createPeopleEntityConfig,
  createPlaygroundQuery,
} from '../shared/sample-data';

type PlaygroundLanguage = 'en' | 'tr' | 'none';

const DEFAULT_EMPTY_MESSAGE = 'A ruleset cannot be empty. Please add a rule or remove it all together.';

@Component({
  selector: 'app-playground',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    JsonPipe,
    QueryBuilderModule,
    DemoCardComponent,
    IconComponent,
    PageHeaderComponent,
    ToggleComponent,
  ],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.scss',
})
export class PlaygroundComponent {
  private readonly injector = inject(Injector);

  readonly queryCtrl = new FormControl<RuleSet>(createPlaygroundQuery(), { nonNullable: true });
  readonly query = trackControlValue(this.queryCtrl);

  // ---------- Component inputs ----------
  readonly allowRuleset = signal(true);
  readonly allowCollapse = signal(false);
  readonly persistValueOnFieldChange = signal(false);
  readonly dragDropRules = signal(false);
  readonly emptyMessage = signal(DEFAULT_EMPTY_MESSAGE);
  readonly language = signal<PlaygroundLanguage>('en');

  // ---------- Config ----------
  readonly entityMode = signal(false);
  readonly allowEmptyRulesets = signal(false);
  readonly disabled = signal(false);

  private readonly fieldConfig = createPeopleConfig();
  private readonly entityConfig = createPeopleEntityConfig();

  readonly currentConfig = computed<QueryBuilderConfig>(() => {
    const base = this.entityMode() ? this.entityConfig : this.fieldConfig;
    return this.allowEmptyRulesets() ? { ...base, allowEmptyRulesets: true } : base;
  });

  readonly translations = computed<QueryBuilderTranslations | undefined>(() => {
    switch (this.language()) {
      case 'tr':
        return TURKISH_TRANSLATIONS;
      case 'en':
        return ENGLISH_TRANSLATIONS;
      default:
        return undefined;
    }
  });

  // ---------- Derived output ----------
  readonly stats = computed(() => getRuleSetStats(this.query()));

  readonly outputTabs = computed<CodeTab[]>(() => {
    const query = this.query();
    return [
      { id: 'sql', label: 'SQL', language: 'sql', code: toSqlStatement(query) },
      { id: 'mongo', label: 'MongoDB', language: 'json', code: toPrettyJson(toMongo(query)) },
      { id: 'text', label: 'Readable', language: 'text', code: toReadableText(query, this.currentConfig()) },
      { id: 'code', label: 'Template', language: 'html', code: this.templateSnippet() },
    ];
  });

  readonly templateSnippet = computed(() => {
    const bindings = [
      '[formControl]="queryCtrl"',
      '[config]="config"',
      !this.allowRuleset() && '[allowRuleset]="false"',
      this.allowCollapse() && '[allowCollapse]="true"',
      this.persistValueOnFieldChange() && '[persistValueOnFieldChange]="true"',
      this.dragDropRules() && '[dragDropRules]="true"',
      this.translations() && '[translations]="translations"',
      !this.translations() && this.emptyMessage() !== DEFAULT_EMPTY_MESSAGE && `emptyMessage="${this.emptyMessage()}"`,
    ].filter((binding): binding is string => !!binding);
    return [
      `<query-builder`,
      ...bindings.map((binding) => `  ${binding}`),
      `>`,
      `  <ng-container *queryInput="let rule; type: 'textarea'; let getDisabledState = getDisabledState">`,
      `    <textarea [(ngModel)]="rule.value" [disabled]="getDisabledState()"></textarea>`,
      `  </ng-container>`,
      `</query-builder>`,
    ].join('\n');
  });

  setDisabled(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) {
      this.queryCtrl.disable();
    } else {
      this.queryCtrl.enable();
    }
  }

  setAllowEmptyRulesets(allow: boolean): void {
    this.allowEmptyRulesets.set(allow);
    // The validator reads the config input, so re-validate once the new config has been rendered.
    afterNextRender(() => this.queryCtrl.updateValueAndValidity(), { injector: this.injector });
  }

  changeLanguage(language: PlaygroundLanguage): void {
    this.language.set(language);
  }

  resetQuery(): void {
    this.queryCtrl.setValue(createPlaygroundQuery());
    this.queryCtrl.markAsPristine();
    this.queryCtrl.markAsUntouched();
  }

  clearQuery(): void {
    this.queryCtrl.setValue({ condition: 'and', rules: [] });
    this.queryCtrl.markAsDirty();
  }

  errorsJson(): string {
    return toPrettyJson(this.queryCtrl.errors);
  }

}
