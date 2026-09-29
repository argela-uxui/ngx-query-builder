import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { IconComponent } from '../shared/icon.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ToggleComponent } from '../shared/toggle.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { isValidRuleSet } from '../shared/query-format';
import { createPeopleConfig } from '../shared/sample-data';

type PresetId = 'simple' | 'nested' | 'empty';

const PRESETS: Record<PresetId, RuleSet> = {
  simple: {
    condition: 'and',
    rules: [
      { field: 'name', operator: '=', value: 'Grace' },
      { field: 'age', operator: '<', value: 40 },
    ],
  },
  nested: {
    condition: 'or',
    rules: [
      { field: 'occupation', operator: '=', value: 'scientist' },
      { condition: 'and', rules: [{ field: 'educated', operator: '=', value: true }, { field: 'age', operator: '>', value: 30 }] },
    ],
  },
  empty: { condition: 'and', rules: [] },
};

@Component({
  selector: 'app-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent, IconComponent, ToggleComponent],
  template: `
    <app-page-header eyebrow="Interaction" title="Disabled state & import"
      description="Disable the whole tree through the forms API (control.disable()) or through [disabled] with ngModel. Values can be replaced at any time — load a preset or paste your own JSON."
      [apis]="['setDisabledState', 'FormControl.disable()', '[disabled]', 'writeValue']" />

    <div class="grid-2">
      <app-demo-card heading="Reactive: control.disable()" description="Read-only presentation of a saved query." [tabs]="reactiveTabs()">
        <div cardActions>
          <app-toggle label="Disabled" testId="toggle-reactive-disabled" [checked]="reactiveDisabled()" (checkedChange)="setReactiveDisabled($event)" />
        </div>
        <div data-testid="example-builder">
          <query-builder [formControl]="queryCtrl" [config]="config" />
        </div>
      </app-demo-card>

      <app-demo-card heading="Template-driven: [disabled]" description="ngModel forwards [disabled] to setDisabledState.">
        <div cardActions>
          <app-toggle label="Disabled" testId="toggle-model-disabled" [checked]="modelDisabled()" (checkedChange)="modelDisabled.set($event)" />
        </div>
        <query-builder [(ngModel)]="modelQuery" [disabled]="modelDisabled()" [config]="config" />
      </app-demo-card>
    </div>

    <section class="panel import">
      <h2 class="panel-title">Load a value into the reactive builder</h2>
      <div class="row">
        @for (preset of presetIds; track preset) {
          <button type="button" class="btn btn--sm" [attr.data-testid]="'load-' + preset" (click)="loadPreset(preset)">Load “{{ preset }}”</button>
        }
      </div>
      <div class="form-field">
        <label class="form-label" for="import-json">Paste RuleSet JSON</label>
        <textarea id="import-json" class="textarea" rows="7" data-testid="import-json" [ngModel]="importText()"
          (ngModelChange)="importText.set($event); importError.set(null)"></textarea>
      </div>
      <div class="row">
        <button type="button" class="btn btn--primary btn--sm" data-testid="import-apply" (click)="applyImport()">
          <app-icon name="upload" [size]="14" /> Apply JSON
        </button>
        @if (importError(); as error) {
          <span class="import__error" role="alert" data-testid="import-error">{{ error }}</span>
        }
      </div>
    </section>
  `,
  styles: `
    .import { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
    .import .panel-title { margin: 0; }
    .import__error { color: var(--danger); font-size: 13px; }
  `,
})
export class DisabledExampleComponent {
  readonly presetIds = Object.keys(PRESETS) as PresetId[];
  readonly config = createPeopleConfig();

  readonly queryCtrl = new FormControl<RuleSet>(structuredClone(PRESETS.nested), { nonNullable: true });
  private readonly value = trackControlValue(this.queryCtrl);
  readonly reactiveDisabled = signal(false);

  modelQuery: RuleSet = structuredClone(PRESETS.simple);
  readonly modelDisabled = signal(true);

  readonly importText = signal(toPrettyJson(PRESETS.simple));
  readonly importError = signal<string | null>(null);

  readonly reactiveTabs = computed<CodeTab[]>(() => [
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    {
      id: 'ts',
      label: 'TypeScript',
      language: 'typescript',
      code: `toggle(disabled: boolean) {\n  disabled ? this.queryCtrl.disable() : this.queryCtrl.enable();\n}\n\nload(value: RuleSet) {\n  this.queryCtrl.setValue(value);   // → writeValue()\n}`,
    },
  ]);

  setReactiveDisabled(disabled: boolean): void {
    this.reactiveDisabled.set(disabled);
    if (disabled) {
      this.queryCtrl.disable();
    } else {
      this.queryCtrl.enable();
    }
  }

  loadPreset(preset: PresetId): void {
    const value = structuredClone(PRESETS[preset]);
    this.queryCtrl.setValue(value);
    this.importText.set(toPrettyJson(value));
    this.importError.set(null);
  }

  applyImport(): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(this.importText());
    } catch (error) {
      this.importError.set(`Invalid JSON: ${(error as Error).message}`);
      return;
    }
    if (!isValidRuleSet(parsed, this.config.fields)) {
      this.importError.set('Not a valid RuleSet: expected { condition: "and" | "or", rules: [...] } with known fields.');
      return;
    }
    this.importError.set(null);
    this.queryCtrl.setValue(parsed);
  }
}
