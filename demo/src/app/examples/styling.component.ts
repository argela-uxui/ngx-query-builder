import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderClassNames, QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { createPeopleConfig } from '../shared/sample-data';

type ClassPreset = 'default' | 'cards' | 'minimal';
type ColorTheme = 'inherit' | 'ocean' | 'forest' | 'sunset';

/** classNames presets — unspecified keys fall back to the built-in q-* classes. */
const CLASS_PRESETS: Record<ClassPreset, QueryBuilderClassNames | undefined> = {
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
  },
};

const THEME_VARS: Record<Exclude<ColorTheme, 'inherit'>, Record<string, string>> = {
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

@Component({
  selector: 'app-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Styles must reach elements rendered inside <query-builder>, so they are global
  // but scoped under the `.styling-demo` wrapper.
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent],
  template: `
    <app-page-header eyebrow="Customization" title="Styling & themes"
      description="Two complementary styling hooks: the classNames input swaps the CSS classes used for every element, and --qb-* CSS custom properties re-theme the default look without touching markup."
      [apis]="['[classNames]', 'QueryBuilderClassNames', '--qb-* custom properties']" />

    <app-demo-card heading="Live styling" description="Combine a class preset with a colour theme." [tabs]="tabs()">
      <div cardActions class="stack-sm styling-controls">
        <div class="segmented" role="group" aria-label="classNames preset">
          @for (preset of classPresets; track preset) {
            <button type="button" [attr.aria-pressed]="classPreset() === preset" [attr.data-testid]="'preset-' + preset"
              (click)="classPreset.set(preset)">{{ preset }}</button>
          }
        </div>
        <div class="segmented" role="group" aria-label="Colour theme">
          @for (theme of colorThemes; track theme) {
            <button type="button" [attr.aria-pressed]="colorTheme() === theme" [attr.data-testid]="'theme-' + theme"
              (click)="colorTheme.set(theme)">{{ theme }}</button>
          }
        </div>
      </div>
      <div class="styling-demo" [class]="'styling-demo styling-demo--' + colorTheme()" data-testid="example-builder">
        <query-builder [formControl]="queryCtrl" [config]="config" [classNames]="classNames()" />
      </div>
    </app-demo-card>
  `,
  styleUrl: './styling.component.scss',
})
export class StylingExampleComponent {
  readonly classPresets: ClassPreset[] = ['default', 'cards', 'minimal'];
  readonly colorThemes: ColorTheme[] = ['inherit', 'ocean', 'forest', 'sunset'];

  readonly classPreset = signal<ClassPreset>('default');
  readonly colorTheme = signal<ColorTheme>('inherit');
  readonly classNames = computed(() => CLASS_PRESETS[this.classPreset()]);

  readonly config = createPeopleConfig();
  readonly queryCtrl = new FormControl<RuleSet>(
    {
      condition: 'and',
      rules: [
        { field: 'name', operator: 'contains', value: 'Jo' },
        { field: 'age', operator: '>=', value: 21 },
        { condition: 'or', rules: [{ field: 'gender', operator: '=', value: 'f' }, { field: 'educated', operator: '=', value: true }] },
      ],
    },
    { nonNullable: true },
  );

  readonly tabs = computed<CodeTab[]>(() => {
    const classNames = this.classNames();
    const theme = this.colorTheme();
    const css = theme === 'inherit'
      ? `/* Using the demo's design tokens (see styles.scss) */\n.app-shell query-builder {\n  --qb-border-color: var(--border-strong);\n  --qb-switch-active-border: var(--primary);\n  /* ... */\n}`
      : `/* Nested builders define their own :host variables, so target every instance */\n.my-theme query-builder {\n${Object.entries(THEME_VARS[theme]).map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`;
    return [
      {
        id: 'ts',
        label: 'classNames',
        language: 'typescript',
        code: classNames ? `classNames: QueryBuilderClassNames = ${JSON.stringify(classNames, null, 2)};\n\n<query-builder [classNames]="classNames" ... />` : '// No [classNames] bound — built-in q-* classes are used.',
      },
      { id: 'css', label: 'CSS variables', language: 'css', code: css },
    ];
  });
}
