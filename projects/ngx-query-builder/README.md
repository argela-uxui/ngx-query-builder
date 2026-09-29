# ngx-query-builder

## General Overview

`@argela-uxui/ngx-query-builder` is a configurable Angular query-builder component for composing nested filter expressions. It provides a standalone, signal-based UI, supports reactive and template-driven forms through `ControlValueAccessor`, and allows custom templates for its controls.

Forked from [zebzhao/Angular-QueryBuilder](https://github.com/zebzhao/Angular-QueryBuilder) and fully updated to current Angular best practices.

[![Angular](https://img.shields.io/badge/Angular-19-red)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Features

- ✅ **Standalone component** — no NgModule required (NgModule export provided for backward compat)
- ✅ **Signal inputs** — reactive, type-safe `input()` API
- ✅ **Signal queries** — `viewChild`, `contentChild`, `contentChildren`
- ✅ **OnPush change detection** — optimal performance
- ✅ **`inject()` DI** — constructor-free dependency injection
- ✅ **New template control flow** — `@if`, `@for`, `@switch`, `@let`
- ✅ **ControlValueAccessor** — works with Angular reactive forms and template-driven forms
- ✅ **Fully customizable** — replace any template (fields, operators, inputs, buttons, etc.)
- ✅ **Recursive rule sets** — nested AND/OR grouping
- ✅ **Radio group isolation** — each component instance generates unique IDs for AND/OR radios, safe for nested rulesets
- ✅ **Jest** — fast unit tests

## Peer Dependencies

| Package | Version |
|---|---:|
| `@angular/cdk` | `>=21.0.0` |
| `@angular/common` | `>=21.0.0` |
| `@angular/core` | `>=21.0.0` |
| `@angular/forms` | `>=21.0.0` |
| `rxjs` | `>=7.0.0` |

## Installation

```bash
npm install @argela-uxui/ngx-query-builder
```

---

## Quick Start

### Standalone (Angular 17+)

```ts
import { QueryBuilderComponent, QueryBuilderConfig } from '@argela-uxui/ngx-query-builder';

@Component({
  standalone: true,
  imports: [QueryBuilderComponent, ReactiveFormsModule],
  template: `<query-builder [formControl]="queryCtrl" [config]="config"></query-builder>`
})
export class AppComponent {
  queryCtrl = new FormControl({ condition: 'and', rules: [] });

  config: QueryBuilderConfig = {
    fields: {
      age:      { name: 'Age',      type: 'number' },
      gender:   { name: 'Gender',   type: 'category', options: [
                    { name: 'Male',   value: 'm' },
                    { name: 'Female', value: 'f' },
                  ]},
      birthday: { name: 'Birthday', type: 'date' },
      name:     { name: 'Name',     type: 'string' },
    }
  };
}
```

### NgModule (backward compatible)

```ts
import { QueryBuilderModule } from '@argela-uxui/ngx-query-builder';

@NgModule({
  imports: [QueryBuilderModule, ReactiveFormsModule],
})
export class AppModule {}
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `[formControl]` | `FormControl<RuleSet>` | — | Reactive forms binding |
| `[(ngModel)]` | `RuleSet` | — | Template-driven binding |
| `[config]` | `QueryBuilderConfig` | `{ fields: {} }` | Field/operator configuration |
| `[data]` | `RuleSet` | `{ condition:'and', rules:[] }` | Query value (use with CVA or direct binding) |
| `[disabled]` | `boolean` | `false` | Disable the entire query builder |
| `[allowRuleset]` | `boolean` | `true` | Show "Add Ruleset" button |
| `[allowCollapse]` | `boolean` | `false` | Enable collapse/expand of rule sets |
| `[persistValueOnFieldChange]` | `boolean` | `false` | Keep value when field changes to same type |
| `[dragDropRules]` | `boolean` | `false` | Opt-in pointer drag-drop to reorder/move rules across rulesets (rulesets themselves are not draggable) |
| `[classNames]` | `QueryBuilderClassNames` | — | CSS class overrides for all elements |
| `[operatorMap]` | `{ [type: string]: string[] }` | — | Override operators per field type |
| `[translations]` | `QueryBuilderTranslations` | — | Localize built-in labels, ARIA text, and operator captions |
| `[emptyMessage]` | `string` | `'A ruleset cannot be empty…'` | Legacy empty warning message when `translations` is not set |

## Configuration

### `QueryBuilderConfig`

```ts
interface QueryBuilderConfig {
  fields: {
    [fieldKey: string]: {
      name: string;           // Display label
      type: string;           // 'string' | 'number' | 'date' | 'time' | 'boolean' | 'category' | 'multiselect'
      value?: string;         // Key used in the rule (defaults to fieldKey)
      options?: Option[];     // For category/multiselect
      operators?: string[];   // Override operators for this field
      defaultValue?: any;     // Default value when field is selected
      defaultOperator?: any;  // Default operator when field is selected
      entity?: string;        // Associate field with an entity
      nullable?: boolean;
      validator?: (rule: Rule, parent: RuleSet) => any | null;
    }
  };
  entities?: {
    [entityKey: string]: { name: string; value?: string; defaultField?: any }
  };
  allowEmptyRulesets?: boolean;
  getOperators?: (fieldName: string, field: Field) => string[];
  getInputType?: (field: string, operator: string) => string;
  getOptions?: (field: string) => Option[];
  addRule?: (parent: RuleSet) => void;
  addRuleSet?: (parent: RuleSet) => void;
  removeRule?: (rule: Rule, parent: RuleSet) => void;
  removeRuleSet?: (ruleset: RuleSet, parent: RuleSet) => void;
  coerceValueForOperator?: (operator: string, value: any, rule: Rule) => any;
  calculateFieldChangeValue?: (currentField: Field, nextField: Field, currentValue: any) => any;
}

interface QueryBuilderTranslations {
  addRule: string;
  addRuleset: string;
  removeRule: string;
  removeRuleset: string;
  and: string;
  or: string;
  collapseRuleset: string;
  expandRuleset: string;
  emptyRuleset: string;
  operatorLabels: Record<string, string>;
}
```

### Default Operator Map

| Type | Default Operators |
|---|---|
| `string` | `=`, `!=`, `contains`, `like` |
| `number` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `date` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `time` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `category` | `=`, `!=`, `in`, `not in` |
| `multiselect` | `in`, `not in` |
| `boolean` | `=` |

## Custom Templates

Replace any part of the UI using structural directives as content children.

### Custom Input

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <!-- Custom input for fields of type 'textarea' -->
  <ng-container *queryInput="let rule; type: 'textarea'">
    <textarea [(ngModel)]="rule.value"></textarea>
  </ng-container>
</query-builder>
```

### Custom Field Selector

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryField="let rule; let fields=fields; let onChange=onChange">
    <mat-select [(ngModel)]="rule.field" (ngModelChange)="onChange($event, rule)">
      <mat-option *ngFor="let f of fields" [value]="f.value">{{f.name}}</mat-option>
    </mat-select>
  </ng-container>
</query-builder>
```

### Custom Button Group

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryButtonGroup="let ruleset; let addRule=addRule; let addRuleSet=addRuleSet; let removeRuleSet=removeRuleSet">
    <button (click)="addRule()">+ Rule</button>
    <button *ngIf="addRuleSet" (click)="addRuleSet()">+ Ruleset</button>
    <button *ngIf="removeRuleSet" (click)="removeRuleSet()">- Ruleset</button>
  </ng-container>
</query-builder>
```

### Available Directives

| Directive | Context variables |
|---|---|
| `*queryInput` | `rule`, `field`, `options`, `onChange`, `getDisabledState` |
| `*queryField` | `rule`, `fields`, `onChange`, `getFields`, `getDisabledState`, `dragDropEnabled`, `dragHandleClass`, `dragHandleAriaLabel` |
| `*queryOperator` | `rule`, `operators`, `labels`, `getLabel(operator)`, `onChange`, `getDisabledState` |
| `*queryEntity` | `rule`, `entities`, `onChange`, `getDisabledState` |
| `*queryButtonGroup` | `addRule`, `addRuleSet?`, `removeRuleSet?`, `labels`, `getLabel(key)`, `getDisabledState` |
| `*queryRemoveButton` | `rule`, `removeRule`, `getDisabledState` |
| `*querySwitchGroup` | `onChange`, `labels`, `getLabel(key)`, `getDisabledState` |
| `*queryEmptyWarning` | `message`, `getDisabledState` |
| `*queryArrowIcon` | `getDisabledState` |

## Styling

> Drag-drop interactions are pointer-based in this release. Keyboard drag interactions are currently out of scope.

Apply CSS class overrides via `[classNames]` input:

```ts
classNames: QueryBuilderClassNames = {
  // Bootstrap 4 example
  row:                'row p-2 m-1',
  rule:               'border',
  ruleSet:            'border',
  invalidRuleSet:     'alert alert-danger',
  emptyWarning:       'text-danger mx-auto',
  button:             'btn',
  buttonGroup:        'btn-group',
  rightAlign:         'order-12 ml-auto',
  switchRow:          'd-flex px-2',
  switchGroup:        'd-flex align-items-center',
  switchRadio:        'custom-control-input',
  switchLabel:        'custom-control-label',
  switchControl:      'custom-control custom-radio custom-control-inline',
  fieldControl:       'form-control',
  fieldControlSize:   'col-auto pr-0',
  operatorControl:    'form-control',
  operatorControlSize:'col-auto pr-0',
  inputControl:       'form-control',
  inputControlSize:   'col-auto',
};
```


## Detailed Usage Documentation

### Standalone component

Import `QueryBuilderComponent` and the forms module used by your form binding:

```ts
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  QueryBuilderComponent,
  QueryBuilderConfig,
  RuleSet,
} from '@argela-uxui/ngx-query-builder';

@Component({
  selector: 'app-query',
  standalone: true,
  imports: [QueryBuilderComponent, ReactiveFormsModule],
  template: `<query-builder [formControl]="query" [config]="config" />`,
})
export class QueryComponent {
  readonly query = new FormControl<RuleSet>({
    condition: 'and',
    rules: [],
  });

  readonly config: QueryBuilderConfig = {
    fields: {
      name: { name: 'Name', type: 'string' },
      age: { name: 'Age', type: 'number' },
      birthday: { name: 'Birthday', type: 'date' },
      status: {
        name: 'Status',
        type: 'category',
        options: [
          { name: 'Active', value: 'active' },
          { name: 'Inactive', value: 'inactive' },
        ],
      },
    },
  };
}
```

The component implements both `ControlValueAccessor` and Angular's `Validator`. Use it with `[formControl]`, `formControlName`, or `[(ngModel)]`. For direct binding instead, provide `[data]` with a `RuleSet`.

For NgModule applications, import `QueryBuilderModule` in place of the standalone component:

```ts
import { QueryBuilderModule } from '@argela-uxui/ngx-query-builder';

@NgModule({
  imports: [QueryBuilderModule, ReactiveFormsModule],
})
export class AppModule {}
```

### Query data model

A query is a recursive tree. Each ruleset combines its child rules with `and` or `or`; a child may be either another ruleset or a leaf rule.

```ts
const query: RuleSet = {
  condition: 'and',
  rules: [
    { field: 'age', operator: '>=', value: 18 },
    {
      condition: 'or',
      rules: [
        { field: 'status', operator: '=', value: 'active' },
        { field: 'name', operator: 'contains', value: 'Ada' },
      ],
    },
  ],
};
```

### Field and builder configuration

`QueryBuilderConfig.fields` is a map from field key to its definition. `name` and `type` are required. The field key is used in rules unless `value` overrides it.

```ts
const config: QueryBuilderConfig = {
  fields: {
    price: {
      name: 'Price',
      type: 'number',
      operators: ['=', '>', '<'],
      defaultOperator: '>',
      defaultValue: 0,
      nullable: false,
      validator: (rule) => rule.value == null ? { required: true } : null,
    },
    category: {
      name: 'Category',
      type: 'category',
      options: [
        { name: 'Books', value: 'books' },
        { name: 'Games', value: 'games' },
      ],
    },
  },
  allowEmptyRulesets: false,
};
```

Supported default operator maps:

| Field type | Default operators |
|---|---|
| `string` | `=`, `!=`, `contains`, `like` |
| `number`, `date`, `time` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `category` | `=`, `!=`, `in`, `not in` |
| `boolean` | `=` |

Set a field's `operators` to override its operators, or use the component's `operatorMap` input to override operators by type. `multiselect` is an input type used for multiple values (including `in` and `not in` on category and boolean fields).

### Entities and callbacks

Entities can group fields. Set `entities` on the config and associate fields using their `entity` key. An entity may specify a `defaultField`.

The config also provides hooks for custom data handling:

| Config property | Purpose |
|---|---|
| `getOperators(fieldName, field)` | Return operators available for a field. |
| `getInputType(field, operator)` | Select the value input type for a field/operator pair. |
| `getOptions(field)` | Return options for a field input. |
| `addRule(parent)` / `addRuleSet(parent)` | Customize adding rules or rulesets. |
| `removeRule(rule, parent)` / `removeRuleSet(ruleset, parent)` | Customize removing rules or rulesets. |
| `coerceValueForOperator(operator, value, rule)` | Convert a value when an operator changes. |
| `calculateFieldChangeValue(currentField, nextField, currentValue)` | Choose a value when the selected field changes. |

### Component inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `config` | `QueryBuilderConfig` | `{ fields: {} }` | Fields, entities, and behavior callbacks. |
| `data` | `RuleSet` | Empty `and` ruleset | Query data for direct binding; forms can write the value through `ControlValueAccessor`. |
| `disabled` | `boolean` | `false` | Disables the builder. |
| `allowRuleset` | `boolean` | `true` | Shows controls for adding/removing nested rulesets. |
| `allowCollapse` | `boolean` | `false` | Enables collapse/expand controls on rulesets. |
| `allowEmptyRulesets` | `boolean` in config | `false` | Allows empty rulesets without marking them invalid. |
| `persistValueOnFieldChange` | `boolean` | `false` | Preserves compatible values when changing fields. |
| `dragDropRules` | `boolean` | `false` | Enables pointer drag-and-drop to reorder/move rules between rulesets. Rulesets themselves cannot be dragged. |
| `operatorMap` | `Record<string, string[]>` | Built-in map | Overrides operators by field type. |
| `translations` | `QueryBuilderTranslations` | Built-in English labels | Sets UI and operator labels, including accessible labels. |
| `emptyMessage` | `string` | Built-in empty-ruleset message | Legacy empty warning text when `translations` is not supplied. |
| `classNames` | `QueryBuilderClassNames` | Built-in `q-*` classes | Overrides CSS classes used by the component. |

### Localization and styling

Provide `translations` to customize labels for buttons, AND/OR conditions, collapse controls, empty rulesets, and operator captions. It has `addRule`, `addRuleset`, `removeRule`, `removeRuleset`, `and`, `or`, `collapseRuleset`, `expandRuleset`, `emptyRuleset`, and `operatorLabels` properties.

Use `classNames` to override component CSS classes. Available keys include `row`, `rule`, `ruleSet`, `switchGroup`, `fieldControl`, `entityControl`, `operatorControl`, `inputControl`, button and icon keys, warning/collapse keys, and drag/drop keys. Unspecified keys keep the built-in `q-*` class names.

### Custom templates

Import the directive you use in the host component. The `queryInput` directive selects a custom input by type:

```ts
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  QueryBuilderComponent,
  QueryInputDirective,
} from '@argela-uxui/ngx-query-builder';

@Component({
  standalone: true,
  imports: [
    QueryBuilderComponent,
    QueryInputDirective,
    FormsModule,
    ReactiveFormsModule,
  ],
  template: `
    <query-builder [formControl]="query" [config]="config">
      <ng-container *queryInput="let rule; type: 'textarea'">
        <textarea [(ngModel)]="rule.value"></textarea>
      </ng-container>
    </query-builder>
  `,
})
export class QueryComponent {}
```

The field, operator, entity, button group, remove button, switch group, empty warning, and arrow icon can also be replaced with their corresponding directives. Directive contexts expose the current rule/ruleset, relevant lists and labels, callbacks, and `getDisabledState()`; see the directive context reference below.

## Exports and API Documentation

### Components and module

| Export | Description |
|---|---|
| `QueryBuilderComponent` | Standalone `<query-builder>` component. Implements `ControlValueAccessor` and `Validator`. |
| `QueryBuilderModule` | NgModule compatibility wrapper that re-exports the component. |

### Template directives

Each directive accepts a template and exposes the listed context values. `$implicit` is available as `let value`; named values can be assigned with `let name=name`.

| Directive | Template context |
|---|---|
| `QueryInputDirective` (`*queryInput`) | `$implicit: Rule`, `field: Field`, `options: Option[]`, `onChange()`, `getDisabledState()`; optional `type` selects the input type. |
| `QueryFieldDirective` (`*queryField`) | `$implicit: Rule`, `fields: Field[]`, `onChange(fieldValue, rule)`, `getFields(entityName)`, `getDisabledState()`, drag-handle state and label. |
| `QueryOperatorDirective` (`*queryOperator`) | `$implicit: Rule`, `operators: string[]`, `labels`, `getLabel(operator)`, `onChange()`, `getDisabledState()`. |
| `QueryEntityDirective` (`*queryEntity`) | `$implicit: Rule`, `entities: Entity[]`, `onChange(entityValue, rule)`, `getDisabledState()`. |
| `QueryButtonGroupDirective` (`*queryButtonGroup`) | `$implicit: RuleSet`, `addRule()`, optional `addRuleSet()` and `removeRuleSet()`, labels and `getDisabledState()`. |
| `QueryRemoveButtonDirective` (`*queryRemoveButton`) | `$implicit: Rule`, `removeRule(rule)`, `getDisabledState()`. |
| `QuerySwitchGroupDirective` (`*querySwitchGroup`) | `$implicit: RuleSet`, `onChange(condition)`, AND/OR labels and `getDisabledState()`. |
| `QueryEmptyWarningDirective` (`*queryEmptyWarning`) | `$implicit: RuleSet`, `message`, `getDisabledState()`. |
| `QueryArrowIconDirective` (`*queryArrowIcon`) | `$implicit: RuleSet`, `getDisabledState()`. |

### Public interfaces and types

| Export | Description |
|---|---|
| `QueryBuilderConfig` | Field/entity definitions, empty-ruleset behavior, and customization callbacks. |
| `RuleSet` | Recursive group with `condition`, `rules`, and optional `collapsed`/`isChild` state. |
| `Rule` | Leaf query item with `field`, optional `operator`, `value`, and `entity`. |
| `Field` | Field label/type, values/options/operators, defaults, entity, nullability, and validator. |
| `FieldMap` | Map from field keys to `Field` definitions. |
| `Entity` / `EntityMap` | Entity definition and map used to group fields. |
| `Option` | Select option with `name` and `value`. |
| `QueryValue` | `unknown`, the type used for rule values. |
| `QueryValueFactory` / `QueryDefaultValue` | Value factory and value-or-factory types for field/entity defaults. |
| `QueryBuilderTranslations` | UI labels, accessible labels, empty-ruleset message, and operator captions. |
| `QueryBuilderClassNames` | CSS class-name override keys for the component. |
| `QueryBuilderButtonLabels` / `QueryBuilderSwitchLabels` | Button and AND/OR label shapes for template contexts. |
| `InputContext`, `FieldContext`, `OperatorContext`, `EntityContext` | Context types for value and selector templates. |
| `ButtonGroupContext`, `RemoveButtonContext`, `SwitchGroupContext` | Context types for action and condition templates. |
| `EmptyWarningContext`, `ArrowIconContext` | Context types for empty-warning and collapse-icon templates. |
| `LocalRuleMeta` | Local metadata describing a ruleset and its invalid state. |
| `RuleValidationResult` | Result type accepted by a field validator. |
