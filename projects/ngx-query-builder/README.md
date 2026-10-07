# ngx-query-builder

## General Overview

`@argela-uxui/ngx-query-builder` is a configurable Angular 22 query-builder component for composing, validating, and editing nested filter expressions. It exposes a standalone component, integrates with Angular forms through `ControlValueAccessor` and `Validator`, and lets applications replace individual controls with custom templates.

Forked from [zebzhao/Angular-QueryBuilder](https://github.com/zebzhao/Angular-QueryBuilder) and fully updated to current Angular best practices.

[![Angular](https://img.shields.io/badge/Angular-22-red)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Online Demo

Visit : https://argela-uxui.github.io/qbdemo/ 

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
- ✅ **Configurable validation** — field validators and empty-ruleset validation integrate with Angular forms
- ✅ **Optional drag and drop** — move or reorder rules across rule sets with pointer interactions
- ✅ **Jest** — fast unit tests

## Peer Dependencies

| Package | Version |
|---|---:|
| `@angular/cdk` | `>=22.0.0` |
| `@angular/common` | `>=22.0.0` |
| `@angular/core` | `>=22.0.0` |
| `@angular/forms` | `>=22.0.0` |
| `rxjs` | `>=7.0.0` |

## Installation

```bash
npm install @argela-uxui/ngx-query-builder
```

The published package targets Angular 22 or later. Install the Angular CDK, Common, Core, and Forms packages, plus RxJS, as peer dependencies if they are not already part of your application.

---

## Quick Start

### Standalone (Angular 22+)

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
  template: `<query-builder [formControl]="queryCtrl" [config]="config" />`,
})
export class AppComponent {
  readonly queryCtrl = new FormControl<RuleSet>(
    { condition: 'and', rules: [] },
    { nonNullable: true },
  );

  readonly config: QueryBuilderConfig = {
    fields: {
      age: { name: 'Age', type: 'number', defaultValue: 18 },
      gender: {
        name: 'Gender',
        type: 'category',
        options: [
          { name: 'Male', value: 'm' },
          { name: 'Female', value: 'f' },
        ],
      },
      birthday: { name: 'Birthday', type: 'date' },
      name: { name: 'Name', type: 'string' },
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

The form control is the source of truth: read the current query from `queryCtrl.value`, subscribe to `queryCtrl.valueChanges` to react to edits, or call `queryCtrl.setValue(savedQuery)` to load a saved query. The query value is a `RuleSet` tree. A newly added rule uses the first configured field, its `defaultOperator` (or the first available operator), and its `defaultValue`.

### NgModule (backward compatible)

```ts
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { QueryBuilderModule } from '@argela-uxui/ngx-query-builder';

@NgModule({
  imports: [QueryBuilderModule, ReactiveFormsModule],
})
export class AppModule {}
```

`QueryBuilderComponent` is standalone and is the recommended import for new applications. `QueryBuilderModule` remains available for NgModule-based applications.

## Component Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `[formControl]`, `formControlName` | Angular form control | — | Recommended way to read and update the query. |
| `[(ngModel)]` | `RuleSet` | — | Template-driven forms binding; import `FormsModule`. |
| `[config]` | `QueryBuilderConfig` | `{ fields: {} }` | Field, entity, operator, and callback configuration. |
| `[data]` | `RuleSet` | `{ condition: 'and', rules: [] }` | Direct value input when not using a forms directive. The component edits this tree in place; use forms binding for managed value updates. |
| `[disabled]` | `boolean` | `false` | Disables the builder and its controls. A form control can also set this state. |
| `[allowRuleset]` | `boolean` | `true` | Shows controls for adding nested rulesets and, on child groups, removing them. |
| `[allowCollapse]` | `boolean` | `false` | Enables collapse/expand controls on rulesets. |
| `[persistValueOnFieldChange]` | `boolean` | `false` | Preserves a value when switching between supported fields of the same type. |
| `[dragDropRules]` | `boolean` | `false` | Enables pointer drag-and-drop to reorder or move rules across rulesets. Rulesets themselves are not draggable. |
| `[classNames]` | `QueryBuilderClassNames` | Built-in `q-*` classes | CSS class overrides for the component. |
| `[operatorMap]` | `Record<string, string[]>` | Built-in operator map | Overrides operators by field type; a field's own `operators` or `getOperators` callback takes precedence. |
| `[translations]` | `QueryBuilderTranslations` | Built-in English labels | Localizes UI labels, accessible labels, and operator captions. When supplied, provide the complete interface. |
| `[emptyMessage]` | `string` | `A ruleset cannot be empty. Please add a rule or remove it all together.` | Legacy empty warning text used when `translations` is not supplied. |

## Configuration

### `QueryBuilderConfig`

Define at least one field to allow the default add-rule action to create a rule. Field keys are identifiers in the configuration; `value` optionally overrides the identifier stored in `Rule.field`.

```ts
interface QueryBuilderConfig {
  fields: {
    [fieldKey: string]: {
      name: string;           // Display label
      type: string;           // Built-in types: string, number, date, time, boolean, category
      value?: string;         // Key used in the rule (defaults to fieldKey)
      options?: Option[];     // Select options for category and multiselect inputs
      operators?: string[];   // Override operators for this field
      defaultValue?: QueryDefaultValue;
      defaultOperator?: QueryDefaultValue;
      entity?: string;        // Associate field with an entity
      nullable?: boolean;     // Adds "is null" and "is not null" operators
      validator?: (rule: Rule, parent: RuleSet) => RuleValidationResult | null;
    }
  };
  entities?: {
    [entityKey: string]: Entity;
  };
  allowEmptyRulesets?: boolean;
  getOperators?: (fieldName: string, field: Field) => string[];
  getInputType?: (field: string, operator: string) => string;
  getOptions?: (field: string) => Option[];
  addRule?: (parent: RuleSet) => void;
  addRuleSet?: (parent: RuleSet) => void;
  removeRule?: (rule: Rule, parent: RuleSet) => void;
  removeRuleSet?: (ruleset: RuleSet, parent: RuleSet) => void;
  coerceValueForOperator?: (operator: string, value: QueryValue, rule: Rule) => QueryValue;
  calculateFieldChangeValue?: (
    currentField: Field,
    nextField: Field,
    currentValue: QueryValue
  ) => QueryValue;
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

The built-in operator map is selected by `Field.type`. A field-level `operators` array takes precedence; `getOperators` can supply the list dynamically. Nullable fields also receive `is null` and `is not null`.

| Type | Default Operators |
|---|---|
| `string` | `=`, `!=`, `contains`, `like` |
| `number` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `date` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `time` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `category` | `=`, `!=`, `in`, `not in` |
| `boolean` | `=` |

`multiselect` is an input type rather than a field type with a built-in operator list. For category and boolean fields, selecting `in` or `not in` changes the input to a multi-select. String and number fields use their regular input type for those operators unless `getInputType` overrides the behavior.

## Custom Templates

Replace individual controls by adding the corresponding exported structural directive to content inside `<query-builder>`. Import each directive in a standalone component (or use `QueryBuilderModule`, which exports them). Template callback values should be used to notify the builder after updating a rule.

### Custom Input

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <!-- Custom input for fields of type 'textarea' -->
  <ng-container *queryInput="let rule; type: 'textarea'; let onChange=onChange; let getDisabledState=getDisabledState">
    <textarea
      [(ngModel)]="rule.value"
      [ngModelOptions]="{ standalone: true }"
      (ngModelChange)="onChange()"
      [disabled]="getDisabledState()"></textarea>
  </ng-container>
</query-builder>
```

Import `FormsModule` when using `ngModel` in custom controls. Mark inner controls standalone so they do not register as additional controls with the outer form. Call the context's `onChange()` after custom value/operator changes so the outer query form receives the update.

### Custom Field Selector

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryField="let rule; let fields=fields; let onChange=onChange; let getDisabledState=getDisabledState">
    <mat-select
      [(ngModel)]="rule.field"
      [ngModelOptions]="{ standalone: true }"
      (ngModelChange)="onChange($event, rule)"
      [disabled]="getDisabledState()">
      <mat-option *ngFor="let field of fields" [value]="field.value">{{ field.name }}</mat-option>
    </mat-select>
  </ng-container>
</query-builder>
```

This example uses Angular Material; import `MatSelectModule` in the host component. Use the provided `onChange(fieldValue, rule)` callback rather than only assigning `rule.field`: the callback updates dependent operator/value state and notifies the form. `getFields(entityName)` returns the fields available for a selected entity.

### Custom Button Group

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryButtonGroup="let addRule=addRule; let addRuleSet=addRuleSet; let removeRuleSet=removeRuleSet; let labels=labels; let getDisabledState=getDisabledState">
    <button type="button" (click)="addRule()" [disabled]="getDisabledState()">{{ labels.addRule }}</button>
    @if (addRuleSet) {
      <button type="button" (click)="addRuleSet()" [disabled]="getDisabledState()">{{ labels.addRuleset }}</button>
    }
    @if (removeRuleSet) {
      <button type="button" (click)="removeRuleSet()" [disabled]="getDisabledState()">{{ labels.removeRuleset }}</button>
    }
  </ng-container>
</query-builder>
```

`addRuleSet` and `removeRuleSet` are optional in the template context: they are only present when rulesets are enabled and, for removal, when the group is nested.

### Available Directives

The complete directive list, including each `$implicit` type and context property, is documented in [Template directives](#template-directives).

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

### Forms, values, and validation

The quick-start example uses reactive forms, which is the recommended integration when the host application needs a value stream, disabled state, touched state, or validation. Subscribe to `valueChanges` to process edits, and use `setValue` or `patchValue` on the control to load a saved `RuleSet`.

For template-driven forms, import `FormsModule` and bind a `RuleSet` with `[(ngModel)]`. For integrations that do not use Angular forms, bind `[data]` directly. Direct binding is mutable: the component edits the supplied rule tree in place and does not expose a separate change output, so use a forms directive when the host needs notifications.

```html
<query-builder [(ngModel)]="query" [config]="config" />
```

The component implements both `ControlValueAccessor` and Angular's `Validator`. Its validator reports empty rulesets unless `config.allowEmptyRulesets` is enabled, and runs each configured field validator for its matching rule. A field validator should return `null` for a valid rule or a non-null error value for an invalid one; Angular includes empty-ruleset errors under `empty` and field validation results under `rules` in the form control's validation errors. Use the form's normal `markAsTouched()` or `markAllAsTouched()` flow to surface validation feedback.

NgModule-based applications can use `QueryBuilderModule` as shown in the quick start; it re-exports the standalone component and all template directives. New standalone applications can import only the component and the specific directives they use.

### Query data model

A query is a recursive tree. Each ruleset combines its direct child rules with its own `condition` (`and` or `or`); nested rulesets let different branches use different conditions. A leaf rule contains a configured field identifier, an operator, and an optional value/entity. `value` is `unknown`, so applications can use strings, numbers, booleans, arrays, or domain-specific values.

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

Keep rule field identifiers aligned with each configured field's `value` (or its configuration key when `value` is omitted). Persist the complete `RuleSet` if the query must be restored later; `collapsed` is presentation state and can be omitted from application query serialization if it is not relevant.

### Field and builder configuration

`QueryBuilderConfig.fields` is a map from field key to its definition. `name` and `type` are required. The field key is used in rules unless `value` overrides it. `defaultValue` and `defaultOperator` accept either a value or a zero-argument factory; factories are useful when a new rule needs a fresh array/object value rather than sharing one instance.

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

When an entity is selected, the builder filters the field selector to fields whose `entity` matches that entity's `value`. If `defaultField` is omitted, the first field belonging to that entity is selected. `defaultField` is a `Field` object or a factory that returns one, not a field key string. This example shows how entity values, configuration keys, and rule field values relate:

```ts
import { Field, QueryBuilderConfig } from '@argela-uxui/ngx-query-builder';

const customerName: Field = {
  name: 'Name',
  type: 'string',
  entity: 'customer',
  value: 'customer_name',
};
const orderTotal: Field = {
  name: 'Total',
  type: 'number',
  entity: 'order',
  value: 'order_total',
};

const config: QueryBuilderConfig = {
  entities: {
    customer: { name: 'Customer', defaultField: customerName },
    order: { name: 'Order', defaultField: orderTotal },
  },
  fields: {
    customerName,
    orderTotal,
  },
};
```

The field's `value` determines the identifier written into `Rule.field`. If you provide a default field, ensure its `entity` matches the selected entity.

For the complete list of built-in operators by field type, see [Default Operator Map](#default-operator-map).

Set a field's `operators` to override its operators, use the component's `operatorMap` input to override them by type, or provide `getOperators` for dynamic field-specific logic. `getOperators` takes precedence over both. `multiselect` is an input type, not an operator-map field type; category and boolean fields use it for `in` and `not in` by default.

With nullable fields, the built-in `is null` and `is not null` operators have no value control. `coerceValueForOperator` runs when the operator changes; by default, values are converted to an array when an operator selects a multiselect input. Use `getInputType` and `getOptions` when the built-in type/options behavior does not fit the application. For a value-less operator in a custom `getInputType`, return an empty string so no value control is rendered.

### Entities and callbacks

Entities group fields behind an entity selector. Declare them under `config.entities` and match each field's `entity` to the entity value, as shown in [Field and builder configuration](#field-and-builder-configuration). `defaultField` can set the initial field for the entity; otherwise, the first matching field is selected.

The config also provides hooks for custom data handling:

| Config property | Purpose |
|---|---|
| `getOperators(fieldName, field)` | Return operators available for a field; takes precedence over field-level and type-level operator lists. |
| `getInputType(field, operator)` | Select the value input type for a field/operator pair. Return a type supported by a built-in control or by a matching `queryInput` template. |
| `getOptions(field)` | Return options for a field input; takes precedence over `Field.options`. |
| `addRule(parent)` / `addRuleSet(parent)` | Replace the default add behavior. Mutate `parent.rules` to add the desired item. |
| `removeRule(rule, parent)` / `removeRuleSet(ruleset, parent)` | Replace the default remove behavior for the supplied parent ruleset. |
| `coerceValueForOperator(operator, value, rule)` | Convert a value when an operator changes, for example scalar-to-array when switching to `in`. |
| `calculateFieldChangeValue(currentField, nextField, currentValue)` | Choose the value after a field change; overrides default-value and value-persistence behavior. |

### Component input behavior

All supported bindings, inputs, defaults, and their behavior are listed once in [Component Inputs](#component-inputs). The examples above show how to choose between reactive forms, template-driven forms, and direct mutable `[data]` binding.

### Localization

Provide `translations` to customize labels for buttons, AND/OR conditions, collapse controls, empty rulesets, and operator captions. It is a complete `QueryBuilderTranslations` object with `addRule`, `addRuleset`, `removeRule`, `removeRuleset`, `and`, `or`, `collapseRuleset`, `expandRuleset`, `emptyRuleset`, and `operatorLabels`. Include captions in `operatorLabels` for custom operators; otherwise, the operator text is used as its label.

`emptyMessage` is retained for compatibility when no `translations` object is supplied. If `translations` is present, use its `emptyRuleset` property for the warning instead. CSS class overrides are documented in [Styling](#styling).

### Custom templates

See [Custom Templates](#custom-templates) for working custom input, field-selector, and button-group examples. The same approach applies to operator, entity, remove-button, switch-group, empty-warning, and arrow-icon templates. Import the directive used by a standalone host component; `QueryBuilderModule` exports all directives for NgModule applications. Directive contexts expose the current rule/ruleset, relevant lists and labels, callbacks, and `getDisabledState()`.

## Exports and API Documentation

### Components and module

| Export | Description |
|---|---|
| `QueryBuilderComponent` | Standalone `<query-builder>` component. Implements `ControlValueAccessor` and `Validator`. |
| `QueryBuilderModule` | NgModule compatibility wrapper that re-exports the component. |

### Template directives

Each directive accepts a template and exposes the listed context values. `$implicit` is available as `let value`; named values can be assigned with `let name=name`. For example, `*queryField="let rule; let fields=fields; let onChange=onChange"` exposes the current rule as `rule`, the available fields as `fields`, and the field-change callback as `onChange`. Call the provided callback after custom control changes so Angular forms receive the updated query and touched state.

| Directive | Template context |
|---|---|
| `QueryInputDirective` (`*queryInput`) | `$implicit: Rule`, `field: Field`, `options: Option[]`, `onChange()`, `getDisabledState()`; optional `type` selects the value input type returned by `getInputType`. |
| `QueryFieldDirective` (`*queryField`) | `$implicit: Rule`, `fields: Field[]`, `onChange(fieldValue, rule)`, `getFields(entityName)`, `getDisabledState()`, `dragDropEnabled`, `dragHandleClass`, `dragHandleAriaLabel`. |
| `QueryOperatorDirective` (`*queryOperator`) | `$implicit: Rule`, `operators: string[]`, `labels: Record<string, string>`, `getLabel(operator)`, `onChange()`, `getDisabledState()`. |
| `QueryEntityDirective` (`*queryEntity`) | `$implicit: Rule`, `entities: Entity[]`, `onChange(entityValue, rule)`, `getDisabledState()`. |
| `QueryButtonGroupDirective` (`*queryButtonGroup`) | `$implicit: RuleSet`, `addRule()`, optional `addRuleSet()` and `removeRuleSet()`, `labels`, `getLabel(key)`, `getDisabledState()`. The ruleset actions are optional depending on the component configuration and nesting level. |
| `QueryRemoveButtonDirective` (`*queryRemoveButton`) | `$implicit: Rule`, `removeRule(rule)`, `getDisabledState()`. |
| `QuerySwitchGroupDirective` (`*querySwitchGroup`) | `$implicit: RuleSet`, `onChange(condition)`, `labels: { and, or }`, `getLabel(key)`, `getDisabledState()`. |
| `QueryEmptyWarningDirective` (`*queryEmptyWarning`) | `$implicit: RuleSet`, `message`, `getDisabledState()`. |
| `QueryArrowIconDirective` (`*queryArrowIcon`) | `$implicit: RuleSet`, `getDisabledState()`. |

For custom interactive controls, bind their disabled state to `getDisabledState()` and provide an accessible name or label. Keep action buttons at `type="button"` so they do not submit an enclosing application form.

### Public interfaces and types

| Export | Description |
|---|---|
| `QueryBuilderConfig` | Field/entity definitions, empty-ruleset behavior, and customization callbacks. |
| `RuleSet` | Recursive group with `condition` (`'and'` or `'or'`), `rules`, and optional `collapsed`/`isChild` state. |
| `Rule` | Leaf query item with `field`, optional `operator`, `value`, and `entity`. |
| `Field` | Field label/type, values/options/operators, defaults, entity, nullability, and validator. |
| `FieldMap` | Map from field keys to `Field` definitions. |
| `Entity` / `EntityMap` | Entity definition and map used to group fields. |
| `Option` | Select option with `name` and `value`. |
| `QueryValue` | `unknown`, the type used for rule values. |
| `QueryValueFactory` / `QueryDefaultValue` | Value factory and value-or-factory types for field/entity defaults. |
| `QueryBuilderTranslations` | UI labels, accessible labels, empty-ruleset message, and operator captions. |
| `QueryBuilderClassNames` | CSS class-name override keys listed in the styling reference below. |
| `QueryBuilderButtonLabels` / `QueryBuilderSwitchLabels` | Button and AND/OR label shapes for template contexts. |
| `InputContext`, `FieldContext`, `OperatorContext`, `EntityContext` | Context types for value and selector templates. |
| `ButtonGroupContext`, `RemoveButtonContext`, `SwitchGroupContext` | Context types for action and condition templates. |
| `EmptyWarningContext`, `ArrowIconContext` | Context types for empty-warning and collapse-icon templates. |
| `LocalRuleMeta` | Local metadata describing a ruleset and its invalid state. |
| `RuleValidationResult` | Result type accepted by a field validator. |

`QueryBuilderClassNames` supports these keys: `arrowIconButton`, `arrowIcon`, `removeIcon`, `addIcon`, `button`, `buttonGroup`, `removeButton`, `removeButtonSize`, `switchRow`, `switchGroup`, `switchLabel`, `switchRadio`, `switchControl`, `rightAlign`, `transition`, `collapsed`, `treeContainer`, `tree`, `row`, `connector`, `rule`, `ruleSet`, `invalidRuleSet`, `emptyWarning`, `fieldControl`, `fieldControlSize`, `entityControl`, `entityControlSize`, `operatorControl`, `operatorControlSize`, `inputControl`, `inputControlSize`, `dragHandle`, `draggableRule`, and `dropTargetSpacer`. The earlier [Styling](#styling) example shows how to override a subset of them.
