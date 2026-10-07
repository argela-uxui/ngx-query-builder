import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { createPeopleConfig } from '../shared/sample-data';
import {
  CLASS_PRESET_OPTIONS,
  CLASS_PRESETS,
  COLOR_THEME_OPTIONS,
  THEME_VARS,
  type ClassPreset,
  type ColorTheme,
} from '../shared/theme-presets';

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
})
export class StylingExampleComponent {
  readonly classPresets = CLASS_PRESET_OPTIONS;
  readonly colorThemes = COLOR_THEME_OPTIONS;

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
