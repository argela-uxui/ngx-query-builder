import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { QueryBuilderComponent, QueryBuilderTranslations, RuleSet } from 'ngx-query-builder';
import { PageHeaderComponent } from '../shared/page-header.component';
import {
  ENGLISH_TRANSLATIONS,
  GERMAN_TRANSLATIONS,
  TURKISH_TRANSLATIONS,
  createPeopleEntityConfig,
  createPlaygroundQuery,
} from '../shared/sample-data';

type TranslationStringKey = Exclude<keyof QueryBuilderTranslations, 'operatorLabels'>;
type EditorTab = 'labels' | 'operators' | 'code';

interface TranslationField {
  key: TranslationStringKey;
  label: string;
}

interface LanguageSample {
  id: string;
  name: string;
  translations: QueryBuilderTranslations;
}

interface SavedLocalization {
  id: string;
  name: string;
  translations: QueryBuilderTranslations;
}

interface OperatorLabel {
  key: string;
  value: string;
  custom: boolean;
}

interface EditorTabOption {
  id: EditorTab;
  label: string;
}

const STORAGE_KEY = 'ngx-query-builder-localizations';
const STRING_FIELDS: readonly TranslationField[] = [
  { key: 'addRule', label: 'Add rule button' },
  { key: 'addRuleset', label: 'Add ruleset button' },
  { key: 'removeRule', label: 'Remove rule label' },
  { key: 'removeRuleset', label: 'Remove ruleset label' },
  { key: 'and', label: 'AND condition' },
  { key: 'or', label: 'OR condition' },
  { key: 'collapseRuleset', label: 'Collapse ruleset label' },
  { key: 'expandRuleset', label: 'Expand ruleset label' },
  { key: 'emptyRuleset', label: 'Empty ruleset warning' },
];

const LANGUAGE_SAMPLES: readonly LanguageSample[] = [
  { id: 'en', name: 'English', translations: ENGLISH_TRANSLATIONS },
  { id: 'tr', name: 'Türkçe', translations: TURKISH_TRANSLATIONS },
  { id: 'de', name: 'Deutsch', translations: GERMAN_TRANSLATIONS },
];

const EDITOR_TABS: readonly EditorTabOption[] = [
  { id: 'labels', label: 'Text labels' },
  { id: 'operators', label: 'Operators' },
  { id: 'code', label: 'TypeScript' },
];

function cloneTranslations(translations: QueryBuilderTranslations): QueryBuilderTranslations {
  return {
    ...translations,
    operatorLabels: { ...translations.operatorLabels },
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.values(value).every((entry) => typeof entry === 'string');
}

function isTranslations(value: unknown): value is QueryBuilderTranslations {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const translations = value as Record<string, unknown>;
  return STRING_FIELDS.every(({ key }) => typeof translations[key] === 'string')
    && isStringRecord(translations['operatorLabels']);
}

function isSavedLocalization(value: unknown): value is SavedLocalization {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const localization = value as Record<string, unknown>;
  return typeof localization['id'] === 'string'
    && typeof localization['name'] === 'string'
    && isTranslations(localization['translations']);
}

function serializeTranslations(translations: QueryBuilderTranslations): string {
  return `import type { QueryBuilderTranslations } from 'ngx-query-builder';\n\n`
    + `export const CUSTOM_TRANSLATIONS: QueryBuilderTranslations = ${JSON.stringify(translations, null, 2)};\n`;
}

@Component({
  selector: 'app-localization-builder-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent],
  templateUrl: './localization-builder.component.html',
  styleUrl: './localization-builder.component.scss',
})
export class LocalizationBuilderExampleComponent {
  private readonly document = inject(DOCUMENT);

  readonly stringFields = STRING_FIELDS;
  readonly editorTabs = EDITOR_TABS;
  readonly sampleLanguages = LANGUAGE_SAMPLES;
  readonly config = createPeopleEntityConfig();
  readonly queryCtrl = new FormControl<RuleSet>(createPlaygroundQuery(), { nonNullable: true });
  readonly translations = signal<QueryBuilderTranslations>(cloneTranslations(ENGLISH_TRANSLATIONS));
  readonly translationCode = computed(() => serializeTranslations(this.translations()));
  readonly operatorLabels = computed<OperatorLabel[]>(() =>
    Object.entries(this.translations().operatorLabels)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        key,
        value,
        custom: !Object.hasOwn(ENGLISH_TRANSLATIONS.operatorLabels, key),
      })),
  );
  readonly customOperatorKey = signal('');
  readonly savedLocalizations = signal<SavedLocalization[]>([]);
  readonly selectedLocalizationId = signal('');
  readonly localizationName = signal('');
  readonly message = signal('');
  readonly activeEditorTab = signal<EditorTab>('labels');
  readonly canDeleteSelected = computed(() =>
    this.savedLocalizations().some((profile) => profile.id === this.selectedLocalizationId()));

  constructor() {
    this.readSavedLocalizations();
  }

  selectEditorTab(tab: EditorTab): void {
    this.activeEditorTab.set(tab);
  }

  onEditorTabKeydown(event: KeyboardEvent): void {
    const currentIndex = this.editorTabs.findIndex((tab) => tab.id === this.activeEditorTab());
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % this.editorTabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + this.editorTabs.length) % this.editorTabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = this.editorTabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = this.editorTabs[nextIndex];
    this.activeEditorTab.set(nextTab.id);
    const tabButton = (event.currentTarget as HTMLElement).parentElement
      ?.querySelector<HTMLElement>(`[data-editor-tab="${nextTab.id}"]`);
    tabButton?.focus();
  }

  updateString(key: TranslationStringKey, value: string): void {
    this.translations.update((current) => ({ ...current, [key]: value }));
    this.message.set('');
  }

  updateOperator(key: string, value: string): void {
    this.translations.update((current) => ({
      ...current,
      operatorLabels: { ...current.operatorLabels, [key]: value },
    }));
    this.message.set('');
  }

  addOperatorLabel(): void {
    const key = this.customOperatorKey().trim();
    if (!key) {
      this.message.set('Enter an operator key before adding a label.');
      return;
    }
    if (Object.hasOwn(this.translations().operatorLabels, key)) {
      this.message.set(`An operator label for “${key}” already exists.`);
      return;
    }

    this.updateOperator(key, key);
    this.customOperatorKey.set('');
    this.message.set(`Added the “${key}” operator label.`);
  }

  loadLocalization(): void {
    const sample = LANGUAGE_SAMPLES.find((language) => language.id === this.selectedLocalizationId());
    const saved = this.savedLocalizations().find((profile) => profile.id === this.selectedLocalizationId());
    const selected = sample ?? saved;
    if (!selected) {
      this.message.set('Choose a sample language or saved localization to load.');
      return;
    }

    this.translations.set(cloneTranslations(selected.translations));
    this.localizationName.set(selected.name);
    this.message.set(`Loaded “${selected.name}”.`);
  }

  resetLocalization(): void {
    this.translations.set(cloneTranslations(ENGLISH_TRANSLATIONS));
    this.localizationName.set('');
    this.selectedLocalizationId.set('');
    this.message.set('Translations reset to English.');
  }

  saveLocalization(): void {
    const name = this.localizationName().trim();
    if (!name) {
      this.message.set('Enter a name before saving this localization.');
      return;
    }

    const profile: SavedLocalization = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      translations: cloneTranslations(this.translations()),
    };
    const next = [...this.savedLocalizations(), profile];
    if (!this.writeSavedLocalizations(next)) {
      return;
    }
    this.savedLocalizations.set(next);
    this.selectedLocalizationId.set(profile.id);
    this.message.set(`Saved “${name}”.`);
  }

  deleteLocalization(): void {
    if (!this.canDeleteSelected()) {
      this.message.set('Choose one of your saved localizations to delete.');
      return;
    }
    const next = this.savedLocalizations().filter((profile) => profile.id !== this.selectedLocalizationId());
    if (!this.writeSavedLocalizations(next)) {
      return;
    }
    this.savedLocalizations.set(next);
    this.selectedLocalizationId.set('');
    this.localizationName.set('');
    this.message.set('Deleted the saved localization.');
  }

  async copyLanguageFile(): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.message.set('Clipboard access is not available in this browser context.');
      return;
    }
    try {
      await clipboard.writeText(this.translationCode());
      this.message.set('TypeScript language file copied to clipboard.');
    } catch (error: unknown) {
      this.message.set(error instanceof Error ? `Could not copy language file: ${error.message}` : 'Could not copy language file.');
    }
  }

  private readSavedLocalizations(): void {
    const browser = this.document.defaultView;
    if (!browser) {
      return;
    }
    try {
      const raw = browser.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.every(isSavedLocalization)) {
        this.message.set('Saved localizations could not be loaded because their stored data is invalid.');
        return;
      }
      this.savedLocalizations.set(parsed);
    } catch (error: unknown) {
      this.message.set(error instanceof Error
        ? `Could not read saved localizations: ${error.message}`
        : 'Could not read saved localizations.');
    }
  }

  private writeSavedLocalizations(localizations: SavedLocalization[]): boolean {
    const browser = this.document.defaultView;
    if (!browser) {
      this.message.set('Browser storage is not available; this localization was not saved.');
      return false;
    }
    try {
      browser.localStorage.setItem(STORAGE_KEY, JSON.stringify(localizations));
      return true;
    } catch (error: unknown) {
      this.message.set(error instanceof Error
        ? `Could not save localizations: ${error.message}`
        : 'Could not save localizations.');
      return false;
    }
  }
}
