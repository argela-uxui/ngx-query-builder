import { QueryBuilderClassNames } from 'ngx-query-builder';

export type ClassPreset = 'default' | 'cards' | 'minimal';
export type ColorTheme = 'inherit' | 'ocean' | 'forest' | 'sunset';

export type QueryBuilderThemeProperty =
  | '--qb-font-family'
  | '--qb-font-size'
  | '--qb-control-height'
  | '--qb-control-padding'
  | '--qb-border-radius'
  | '--qb-border-color'
  | '--qb-text-color'
  | '--qb-bg-color'
  | '--qb-hover-bg'
  | '--qb-switch-bg'
  | '--qb-switch-active-border'
  | '--qb-switch-active-color'
  | '--qb-remove-color'
  | '--qb-invalid-border'
  | '--qb-invalid-bg'
  | '--qb-warning-color'
  | '--qb-connector-color'
  | '--qb-collapse-transition'
  | '--qb-tree-transition'
  | '--qb-item-transition';

export type QueryBuilderThemeValues = Record<QueryBuilderThemeProperty, string>;

export interface ThemeSample {
  id: string;
  name: string;
  classPreset: ClassPreset;
  colorTheme: ColorTheme;
}

export const CLASS_PRESET_OPTIONS: readonly ClassPreset[] = ['default', 'cards', 'minimal'];
export const COLOR_THEME_OPTIONS: readonly ColorTheme[] = ['inherit', 'ocean', 'forest', 'sunset'];

/** classNames presets — unspecified keys fall back to the built-in q-* classes. */
export const CLASS_PRESETS: Record<ClassPreset, QueryBuilderClassNames | undefined> = {
  default: undefined,
  cards: {
    button: 'sd-btn',
    removeButton: 'sd-btn--remove',
    addIcon: 'sd-icon sd-icon--add',
    removeIcon: 'sd-icon sd-icon--remove',
    switchGroup: 'sd-switch',
    switchLabel: 'sd-switch__label',
    rule: 'sd-rule',
    ruleSet: 'sd-ruleset',
    row: 'sd-row',
    fieldControl: 'sd-control',
    operatorControl: 'sd-control sd-control--operator',
    inputControl: 'sd-control',
    entityControl: 'sd-control',
    emptyWarning: 'sd-empty',
  },
  minimal: {
    button: 'sd-link',
    removeButton: 'sd-link--remove',
    addIcon: 'sd-icon sd-icon--add',
    removeIcon: 'sd-icon sd-icon--remove',
    switchLabel: 'sd-underline',
    rule: 'sd-flat',
    ruleSet: 'sd-flat-set',
    connector: 'sd-no-connector',
    fieldControl: 'sd-bare',
    operatorControl: 'sd-bare sd-bare--operator',
    inputControl: 'sd-bare',
    entityControl: 'sd-bare',
  },
};

export const THEME_VARS: Record<Exclude<ColorTheme, 'inherit'>, Partial<QueryBuilderThemeValues>> = {
  ocean: {
    '--qb-border-color': '#7dd3fc',
    '--qb-switch-active-border': '#0284c7',
    '--qb-switch-active-color': '#0369a1',
    '--qb-switch-bg': '#e0f2fe',
    '--qb-connector-color': '#38bdf8',
    '--qb-border-radius': '8px',
  },
  forest: {
    '--qb-border-color': '#86efac',
    '--qb-switch-active-border': '#16a34a',
    '--qb-switch-active-color': '#15803d',
    '--qb-switch-bg': '#dcfce7',
    '--qb-connector-color': '#4ade80',
    '--qb-border-radius': '2px',
  },
  sunset: {
    '--qb-border-color': '#fdba74',
    '--qb-switch-active-border': '#ea580c',
    '--qb-switch-active-color': '#c2410c',
    '--qb-switch-bg': '#ffedd5',
    '--qb-connector-color': '#fb923c',
    '--qb-border-radius': '16px',
  },
};

function sampleName(classPreset: ClassPreset, colorTheme: ColorTheme): string {
  const className = classPreset === 'default'
    ? ''
    : classPreset.charAt(0).toUpperCase() + classPreset.slice(1);
  const colorName = colorTheme === 'inherit'
    ? ''
    : colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1);
  return [className, colorName].filter(Boolean).join(' - ') || 'Default';
}

export const THEME_SAMPLES: readonly ThemeSample[] = CLASS_PRESET_OPTIONS.flatMap((classPreset) =>
  COLOR_THEME_OPTIONS.map((colorTheme) => ({
    id: `sample-${classPreset}-${colorTheme}`,
    name: sampleName(classPreset, colorTheme),
    classPreset,
    colorTheme,
  })),
);
