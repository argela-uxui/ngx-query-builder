import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderComponent, RuleSet } from 'ngx-query-builder';
import { CodeTab, DemoCardComponent } from '../shared/demo-card.component';
import { IconComponent } from '../shared/icon.component';
import { PageHeaderComponent } from '../shared/page-header.component';
import { ToggleComponent } from '../shared/toggle.component';
import { toPrettyJson, trackControlValue } from '../shared/control-value';
import { toReadableText } from '../shared/query-format';
import { createPeopleConfig } from '../shared/sample-data';

function createDragQuery(): RuleSet {
  return {
    condition: 'and',
    rules: [
      { field: 'name', operator: 'contains', value: 'an' },
      { field: 'age', operator: '>', value: 25 },
      { field: 'gender', operator: '=', value: 'm' },
      { condition: 'or', rules: [{ field: 'occupation', operator: '=', value: 'scientist' }] },
      { condition: 'and', rules: [{ field: 'educated', operator: '=', value: true }] },
    ],
  };
}

@Component({
  selector: 'app-drag-drop-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, QueryBuilderComponent, PageHeaderComponent, DemoCardComponent, IconComponent, ToggleComponent],
  template: `
    <app-page-header eyebrow="Interaction" title="Drag & drop"
      description="Enable dragDropRules to reorder rules with the :: handle and move them between rulesets at any depth. Built on @angular/cdk/drag-drop — the model is updated in place and the form control is notified."
      [apis]="['[dragDropRules]', '@angular/cdk/drag-drop', 'classNames.dragHandle', 'classNames.draggableRule']" />

    <app-demo-card heading="Reorder & regroup" description="Grab the :: handle next to a field and drop it into another group." [tabs]="tabs()">
      <div cardActions class="row">
        <app-toggle label="Drag & drop" testId="toggle-dd" [checked]="enabled()" (checkedChange)="enabled.set($event)" />
        <button type="button" class="btn btn--sm" (click)="reset()"><app-icon name="refresh" [size]="14" /> Reset</button>
      </div>
      @if (!enabled()) {
        <p class="callout dd-hint">Drag & drop is off — handles are hidden and the lists are locked.</p>
      }
      <div data-testid="example-builder">
        <query-builder [formControl]="queryCtrl" [config]="config" [dragDropRules]="enabled()" />
      </div>
    </app-demo-card>
  `,
  styles: `.dd-hint { margin-bottom: 12px; }`,
})
export class DragDropExampleComponent {
  readonly enabled = signal(true);
  readonly config = createPeopleConfig();
  readonly queryCtrl = new FormControl<RuleSet>(createDragQuery(), { nonNullable: true });
  private readonly value = trackControlValue(this.queryCtrl);

  readonly tabs = computed<CodeTab[]>(() => [
    { id: 'text', label: 'Readable', language: 'text', code: toReadableText(this.value(), this.config) },
    { id: 'output', label: 'Output', language: 'json', code: toPrettyJson(this.value()) },
    {
      id: 'html',
      label: 'HTML',
      language: 'html',
      code: `<query-builder [formControl]="queryCtrl" [config]="config" [dragDropRules]="true" />`,
    },
  ]);

  reset(): void {
    this.queryCtrl.setValue(createDragQuery());
  }
}
