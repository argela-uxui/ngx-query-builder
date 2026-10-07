import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderClassNames, QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { PageHeaderComponent } from '../shared/page-header.component';
import { createPeopleEntityConfig, createPlaygroundQuery } from '../shared/sample-data';
import {
  CLASS_PRESETS,
  THEME_SAMPLES,
  THEME_VARS,
  type QueryBuilderThemeProperty,
  type QueryBuilderThemeValues,
} from '../shared/theme-presets';

type ClassNameKey = keyof QueryBuilderClassNames;
type CssThemeVariable = QueryBuilderThemeProperty;
type CssThemeValues = QueryBuilderThemeValues;
type ClassNameValues = Record<ClassNameKey, string>;

interface ThemeToken {
  key: CssThemeVariable;
  description: string;
  kind: 'color' | 'range' | 'text';
  min?: number;
  max?: number;
  unit?: string;
}

interface ThemeTokenGroup {
  label: string;
  tokens: readonly ThemeToken[];
}

interface SavedTheme {
  id: string;
  name: string;
  cssCode: string;
  classNamesCode: string;
}

type ThemeEditorTab =
  | 'typography'
  | 'surfaces'
  | 'accents'
  | 'motion'
  | 'classNames'
  | 'cssCode'
  | 'classNamesCode';

interface EditorTab {
  id: ThemeEditorTab;
  label: string;
}

const STORAGE_KEY = 'ngx-query-builder-custom-themes';

const TOKEN_GROUPS: readonly ThemeTokenGroup[] = [
  {
    label: 'Typography and sizing',
    tokens: [
      { key: '--qb-font-family', description: 'Font family used by the builder.', kind: 'text' },
      { key: '--qb-font-size', description: 'Base text size.', kind: 'range', min: 10, max: 24, unit: 'px' },
      { key: '--qb-control-height', description: 'Minimum height for builder controls.', kind: 'range', min: 24, max: 48, unit: 'px' },
      { key: '--qb-control-padding', description: 'Padding inside text controls.', kind: 'text' },
    ],
  },
  {
    label: 'Surfaces and borders',
    tokens: [
      { key: '--qb-border-radius', description: 'Corner radius for builder controls and groups.', kind: 'range', min: 0, max: 24, unit: 'px' },
      { key: '--qb-border-color', description: 'Default border color.', kind: 'color' },
      { key: '--qb-text-color', description: 'Primary text color.', kind: 'color' },
      { key: '--qb-bg-color', description: 'Control background color.', kind: 'color' },
      { key: '--qb-hover-bg', description: 'Hover and drop-target background.', kind: 'color' },
      { key: '--qb-switch-bg', description: 'Condition switch background.', kind: 'color' },
    ],
  },
  {
    label: 'Accents and validation',
    tokens: [
      { key: '--qb-switch-active-border', description: 'Active condition and focus outline.', kind: 'color' },
      { key: '--qb-switch-active-color', description: 'Active condition text.', kind: 'color' },
      { key: '--qb-remove-color', description: 'Remove action color.', kind: 'color' },
      { key: '--qb-invalid-border', description: 'Invalid control border.', kind: 'color' },
      { key: '--qb-invalid-bg', description: 'Invalid control background.', kind: 'color' },
      { key: '--qb-warning-color', description: 'Empty ruleset warning text.', kind: 'color' },
      { key: '--qb-connector-color', description: 'Nested ruleset connector color.', kind: 'color' },
    ],
  },
  {
    label: 'Motion',
    tokens: [
      { key: '--qb-collapse-transition', description: 'Collapse icon transition.', kind: 'text' },
      { key: '--qb-tree-transition', description: 'Ruleset expand and collapse transition.', kind: 'text' },
      { key: '--qb-item-transition', description: 'Rule item transition.', kind: 'text' },
    ],
  },
];

const CLASS_NAME_KEYS: readonly ClassNameKey[] = [
  'arrowIconButton',
  'arrowIcon',
  'removeIcon',
  'addIcon',
  'button',
  'buttonGroup',
  'removeButton',
  'removeButtonSize',
  'switchRow',
  'switchGroup',
  'switchLabel',
  'switchRadio',
  'switchControl',
  'rightAlign',
  'transition',
  'collapsed',
  'treeContainer',
  'tree',
  'row',
  'connector',
  'rule',
  'ruleSet',
  'invalidRuleSet',
  'emptyWarning',
  'fieldControl',
  'fieldControlSize',
  'entityControl',
  'entityControlSize',
  'operatorControl',
  'operatorControlSize',
  'inputControl',
  'inputControlSize',
  'dragHandle',
  'draggableRule',
  'dropTargetSpacer',
];

const DEFAULT_TOKENS: CssThemeValues = {
  '--qb-font-family': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  '--qb-font-size': '14px',
  '--qb-control-height': '32px',
  '--qb-control-padding': '5px 8px',
  '--qb-border-radius': '4px',
  '--qb-border-color': '#cccccc',
  '--qb-text-color': '#555555',
  '--qb-bg-color': '#ffffff',
  '--qb-hover-bg': '#f0f0f0',
  '--qb-switch-bg': '#e4e4e4',
  '--qb-switch-active-border': 'rgb(97, 158, 215)',
  '--qb-switch-active-color': 'rgb(49, 118, 179)',
  '--qb-remove-color': '#b3415d',
  '--qb-invalid-border': 'rgba(179, 65, 93, 0.5)',
  '--qb-invalid-bg': 'rgba(179, 65, 93, 0.1)',
  '--qb-warning-color': 'rgb(141, 37, 46)',
  '--qb-connector-color': '#cccccc',
  '--qb-collapse-transition': 'linear 0.25s transform',
  '--qb-tree-transition': 'ease-in 0.25s max-height',
  '--qb-item-transition': 'all 0.1s ease-in-out',
};

const CSS_VARIABLES = TOKEN_GROUPS.flatMap((group) => group.tokens.map((token) => token.key));
const CLASS_NAME_KEY_SET = new Set<string>(CLASS_NAME_KEYS);
const CSS_VARIABLE_SET = new Set<string>(CSS_VARIABLES);
const DEFAULT_CLASS_NAMES = Object.fromEntries(CLASS_NAME_KEYS.map((key) => [key, ''])) as ClassNameValues;

function serializeCss(values: CssThemeValues): string {
  return CSS_VARIABLES.map((key) => `${key}: ${values[key]};`).join('\n');
}

function serializeClassNames(values: ClassNameValues): string {
  const overrides = Object.fromEntries(
    CLASS_NAME_KEYS
      .filter((key) => values[key].trim().length > 0)
      .map((key) => [key, values[key]]),
  );
  return JSON.stringify(overrides, null, 2);
}

function parseCss(code: string): { values?: CssThemeValues; error?: string } {
  const values = { ...DEFAULT_TOKENS };
  const seen = new Set<string>();
  const lines = code.split(/\r?\n/);

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('/*') || line.startsWith('*') || line.startsWith('//')) {
      continue;
    }

    const declaration = line.match(/^(--[\w-]+)\s*:\s*(.*?)\s*;?$/);
    if (!declaration) {
      return { error: `Line ${index + 1}: enter a CSS custom-property declaration, such as --qb-border-color: #334155;` };
    }

    const [, key, value] = declaration;
    if (!CSS_VARIABLE_SET.has(key)) {
      return { error: `Line ${index + 1}: ${key} is not a supported query-builder theme variable.` };
    }
    if (!value.trim()) {
      return { error: `Line ${index + 1}: ${key} needs a value.` };
    }
    if (seen.has(key)) {
      return { error: `Line ${index + 1}: ${key} is declared more than once.` };
    }

    seen.add(key);
    values[key as CssThemeVariable] = value.trim();
  }

  return { values };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSavedTheme(value: unknown): value is SavedTheme {
  return isRecord(value)
    && typeof value['id'] === 'string'
    && typeof value['name'] === 'string'
    && typeof value['cssCode'] === 'string'
    && typeof value['classNamesCode'] === 'string';
}

function createSampleThemes(): readonly SavedTheme[] {
  return THEME_SAMPLES.map((sample) => ({
    id: sample.id,
    name: sample.name,
    cssCode: serializeCss({
      ...DEFAULT_TOKENS,
      ...(sample.colorTheme === 'inherit' ? {} : THEME_VARS[sample.colorTheme]),
    }),
    classNamesCode: serializeClassNames({
      ...DEFAULT_CLASS_NAMES,
      ...(CLASS_PRESETS[sample.classPreset] ?? {}),
    }),
  }));
}

const SAMPLE_THEMES = createSampleThemes();

@Component({
  selector: 'app-theme-builder-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent],
  templateUrl: './theme-builder.component.html',
  styleUrl: './theme-builder.component.scss',
})
export class ThemeBuilderExampleComponent {
  private readonly document = inject(DOCUMENT);

  readonly editorTabs: readonly EditorTab[] = [
    { id: 'typography', label: 'Type & size' },
    { id: 'surfaces', label: 'Surfaces' },
    { id: 'accents', label: 'Accents' },
    { id: 'motion', label: 'Motion' },
    { id: 'classNames', label: 'Classes' },
    { id: 'cssCode', label: 'CSS' },
    { id: 'classNamesCode', label: 'JSON' },
  ];
  readonly tokenGroups = TOKEN_GROUPS;
  readonly classNameKeys = CLASS_NAME_KEYS;
  readonly sampleThemes = SAMPLE_THEMES;
  readonly config = createPeopleEntityConfig();
  readonly queryCtrl = new FormControl<RuleSet>(createPlaygroundQuery(), { nonNullable: true });
  readonly themeTokens = signal<CssThemeValues>({ ...DEFAULT_TOKENS });
  readonly classNameValues = signal<ClassNameValues>({ ...DEFAULT_CLASS_NAMES });
  readonly cssCode = signal(serializeCss(DEFAULT_TOKENS));
  readonly classNamesCode = signal(serializeClassNames(DEFAULT_CLASS_NAMES));
  readonly cssError = signal('');
  readonly classNamesError = signal('');
  readonly savedThemes = signal<SavedTheme[]>([]);
  readonly selectedThemeId = signal('');
  readonly canDeleteSelectedTheme = computed(() =>
    this.savedThemes().some((theme) => theme.id === this.selectedThemeId()));
  readonly themeName = signal('');
  readonly message = signal('');
  readonly activeEditorTab = signal<ThemeEditorTab>('typography');

  readonly classNames = computed<QueryBuilderClassNames | undefined>(() => {
    const values = this.classNameValues();
    const populated = CLASS_NAME_KEYS.filter((key) => values[key].trim().length > 0);
    if (populated.length === 0) {
      return undefined;
    }
    return Object.fromEntries(populated.map((key) => [key, values[key]])) as QueryBuilderClassNames;
  });

  readonly cssStyle = computed(() => CSS_VARIABLES
    .map((key) => `${key}: ${this.themeTokens()[key]}`)
    .join('; '));

  constructor() {
    this.readSavedThemes();
  }

  selectEditorTab(tab: ThemeEditorTab): void {
    this.activeEditorTab.set(tab);
  }

  resetTheme(): void {
    this.themeTokens.set({ ...DEFAULT_TOKENS });
    this.classNameValues.set({ ...DEFAULT_CLASS_NAMES });
    this.cssCode.set(serializeCss(DEFAULT_TOKENS));
    this.classNamesCode.set(serializeClassNames(DEFAULT_CLASS_NAMES));
    this.cssError.set('');
    this.classNamesError.set('');
    this.selectedThemeId.set('');
    this.message.set('Theme reset to defaults.');
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
    const tabButton = (event.currentTarget as HTMLElement)
      .parentElement?.querySelector<HTMLElement>(`[data-editor-tab="${nextTab.id}"]`);
    tabButton?.focus();
  }

  tokenValue(key: CssThemeVariable): string {
    return this.themeTokens()[key];
  }

  updateToken(key: CssThemeVariable, value: string): void {
    const token = TOKEN_GROUPS.flatMap((group) => group.tokens).find((entry) => entry.key === key);
    if (token?.kind === 'range') {
      value = `${value}${token.unit ?? ''}`;
    }
    const next = { ...this.themeTokens(), [key]: value };
    this.themeTokens.set(next);
    this.cssCode.set(serializeCss(next));
    this.cssError.set('');
    this.message.set('');
  }

  onTokenInput(event: Event, key: CssThemeVariable): void {
    if (event.target instanceof HTMLInputElement) {
      this.updateToken(key, event.target.value);
    }
  }

  rangeValue(key: CssThemeVariable): number {
    const value = Number.parseFloat(this.themeTokens()[key]);
    return Number.isFinite(value) ? value : 0;
  }

  colorPickerValue(value: string): string {
    const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (hex) {
      const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1];
      return `#${digits}`;
    }

    const rgb = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (!rgb) {
      return '#000000';
    }
    return `#${rgb.slice(1, 4).map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`;
  }

  updateClassName(key: ClassNameKey, value: string): void {
    const next = { ...this.classNameValues(), [key]: value };
    this.classNameValues.set(next);
    this.classNamesCode.set(serializeClassNames(next));
    this.classNamesError.set('');
    this.message.set('');
  }

  updateCssCode(code: string): void {
    this.cssCode.set(code);
    const result = parseCss(code);
    if (result.error) {
      this.cssError.set(result.error);
      return;
    }
    this.themeTokens.set(result.values ?? { ...DEFAULT_TOKENS });
    this.cssError.set('');
    this.message.set('');
  }

  updateClassNamesCode(code: string): void {
    this.classNamesCode.set(code);
    try {
      const parsed: unknown = JSON.parse(code);
      if (!isRecord(parsed)) {
        this.classNamesError.set('Enter a JSON object whose values are class-name strings.');
        return;
      }
      const values = { ...DEFAULT_CLASS_NAMES };
      for (const [key, value] of Object.entries(parsed)) {
        if (!CLASS_NAME_KEY_SET.has(key)) {
          this.classNamesError.set(`${key} is not a supported QueryBuilderClassNames key.`);
          return;
        }
        if (typeof value !== 'string') {
          this.classNamesError.set(`${key} must have a string value.`);
          return;
        }
        values[key as ClassNameKey] = value;
      }
      this.classNameValues.set(values);
      this.classNamesError.set('');
      this.message.set('');
    } catch (error: unknown) {
      this.classNamesError.set(error instanceof Error ? error.message : 'Enter valid JSON.');
    }
  }

  saveTheme(): void {
    if (this.cssError() || this.classNamesError()) {
      this.message.set('Fix the code errors before saving this theme.');
      return;
    }
    const name = this.themeName().trim();
    if (!name) {
      this.message.set('Enter a name before saving this theme.');
      return;
    }

    const theme: SavedTheme = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      cssCode: this.cssCode(),
      classNamesCode: this.classNamesCode(),
    };
    const next = [...this.savedThemes(), theme];
    if (!this.writeSavedThemes(next)) {
      return;
    }
    this.savedThemes.set(next);
    this.selectedThemeId.set(theme.id);
    this.message.set(`Saved “${name}”.`);
  }

  loadTheme(): void {
    const theme = SAMPLE_THEMES.find((sample) => sample.id === this.selectedThemeId())
      ?? this.savedThemes().find((saved) => saved.id === this.selectedThemeId());
    if (!theme) {
      this.message.set('Choose a saved theme to load.');
      return;
    }
    this.updateCssCode(theme.cssCode);
    this.updateClassNamesCode(theme.classNamesCode);
    this.themeName.set(theme.name);
    this.message.set(`Loaded “${theme.name}”.`);
  }

  deleteTheme(): void {
    if (!this.canDeleteSelectedTheme()) {
      this.message.set('Choose one of your saved themes to delete.');
      return;
    }
    const next = this.savedThemes().filter((theme) => theme.id !== this.selectedThemeId());
    if (next.length === this.savedThemes().length) {
      this.message.set('Choose a saved theme to delete.');
      return;
    }
    if (!this.writeSavedThemes(next)) {
      return;
    }
    this.savedThemes.set(next);
    this.selectedThemeId.set('');
    this.themeName.set('');
    this.message.set('Deleted the saved theme.');
  }

  async copyCode(code: string, label: string): Promise<void> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.message.set('Clipboard access is not available in this browser context.');
      return;
    }
    try {
      await clipboard.writeText(code);
      this.message.set(`${label} copied to clipboard.`);
    } catch (error: unknown) {
      this.message.set(error instanceof Error ? `Could not copy code: ${error.message}` : 'Could not copy code.');
    }
  }

  private readSavedThemes(): void {
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
      if (!Array.isArray(parsed) || !parsed.every(isSavedTheme)) {
        this.message.set('Saved themes could not be loaded because their stored data is invalid.');
        return;
      }
      this.savedThemes.set(parsed);
    } catch (error: unknown) {
      this.message.set(error instanceof Error ? `Could not read saved themes: ${error.message}` : 'Could not read saved themes.');
    }
  }

  private writeSavedThemes(themes: SavedTheme[]): boolean {
    const browser = this.document.defaultView;
    if (!browser) {
      this.message.set('Browser storage is not available; this theme was not saved.');
      return false;
    }
    try {
      browser.localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
      return true;
    } catch (error: unknown) {
      this.message.set(error instanceof Error ? `Could not save themes: ${error.message}` : 'Could not save themes.');
      return false;
    }
  }
}
