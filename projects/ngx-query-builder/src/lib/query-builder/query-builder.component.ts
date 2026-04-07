import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { QueryOperatorDirective } from './query-operator.directive';
import { QueryFieldDirective } from './query-field.directive';
import { QueryEntityDirective } from './query-entity.directive';
import { QuerySwitchGroupDirective } from './query-switch-group.directive';
import { QueryButtonGroupDirective } from './query-button-group.directive';
import { QueryInputDirective } from './query-input.directive';
import { QueryRemoveButtonDirective } from './query-remove-button.directive';
import { QueryEmptyWarningDirective } from './query-empty-warning.directive';
import { QueryArrowIconDirective } from './query-arrow-icon.directive';
import {
  ButtonGroupContext,
  Entity,
  Field,
  SwitchGroupContext,
  EntityContext,
  FieldContext,
  InputContext,
  LocalRuleMeta,
  OperatorContext,
  Option,
  QueryBuilderClassNames,
  QueryBuilderConfig,
  RemoveButtonContext,
  ArrowIconContext,
  Rule,
  RuleSet,
  EmptyWarningContext,
} from './query-builder.interfaces';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef,
  contentChild,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

export const CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QueryBuilderComponent),
  multi: true
};

export const VALIDATOR: any = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => QueryBuilderComponent),
  multi: true
};

@Component({
  selector: 'query-builder',
  templateUrl: './query-builder.component.html',
  styleUrls: ['./query-builder.component.scss'],
  providers: [CONTROL_VALUE_ACCESSOR, VALIDATOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    NgTemplateOutlet,
    QueryBuilderComponent,
    QueryInputDirective,
    QueryOperatorDirective,
    QueryFieldDirective,
    QueryEntityDirective,
    QueryButtonGroupDirective,
    QuerySwitchGroupDirective,
    QueryRemoveButtonDirective,
    QueryEmptyWarningDirective,
    QueryArrowIconDirective,
  ],
})
export class QueryBuilderComponent implements OnChanges, ControlValueAccessor, Validator {

  // ---------- Signal Inputs ----------

  readonly allowRuleset = input<boolean>(true);
  readonly allowCollapse = input<boolean>(false);
  readonly emptyMessage = input<string>(
    'A ruleset cannot be empty. Please add a rule or remove it all together.'
  );
  readonly classNames = input<QueryBuilderClassNames | undefined>(undefined);
  readonly operatorMap = input<{ [key: string]: string[] } | undefined>(undefined);
  readonly parentValue = input<RuleSet | undefined>(undefined);
  readonly config = input<QueryBuilderConfig>({ fields: {} });
  readonly persistValueOnFieldChange = input<boolean>(false);

  // Parent template pass-through inputs (for recursive child components)
  readonly parentArrowIconTemplate = input<QueryArrowIconDirective | undefined>(undefined);
  readonly parentInputTemplates = input<readonly QueryInputDirective[]>([]);
  readonly parentOperatorTemplate = input<QueryOperatorDirective | undefined>(undefined);
  readonly parentFieldTemplate = input<QueryFieldDirective | undefined>(undefined);
  readonly parentEntityTemplate = input<QueryEntityDirective | undefined>(undefined);
  readonly parentSwitchGroupTemplate = input<QuerySwitchGroupDirective | undefined>(undefined);
  readonly parentButtonGroupTemplate = input<QueryButtonGroupDirective | undefined>(undefined);
  readonly parentRemoveButtonTemplate = input<QueryRemoveButtonDirective | undefined>(undefined);
  readonly parentEmptyWarningTemplate = input<QueryEmptyWarningDirective | undefined>(undefined);
  readonly parentChangeCallback = input<(() => void) | undefined>(undefined);
  readonly parentTouchedCallback = input<(() => void) | undefined>(undefined);

  // ---------- Mutable State (not signal inputs — mutated by CVA or internally) ----------

  /** The current query rule set. Set via CVA writeValue() or directly via [data] binding. */
  @Input() data: RuleSet = { condition: 'and', rules: [] };

  /** Disabled state — can be set by parent binding or by CVA setDisabledState(). */
  @Input() disabled = false;

  // ---------- Public computed state ----------

  fields: Field[] = [];
  entities: Entity[] | null = null;

  readonly defaultClassNames: QueryBuilderClassNames = {
    arrowIconButton: 'q-arrow-icon-button',
    arrowIcon: 'q-icon q-arrow-icon',
    removeIcon: 'q-icon q-remove-icon',
    addIcon: 'q-icon q-add-icon',
    button: 'q-button',
    buttonGroup: 'q-button-group',
    removeButton: 'q-remove-button',
    switchGroup: 'q-switch-group',
    switchLabel: 'q-switch-label',
    switchRadio: 'q-switch-radio',
    rightAlign: 'q-right-align',
    transition: 'q-transition',
    collapsed: 'q-collapsed',
    treeContainer: 'q-tree-container',
    tree: 'q-tree',
    row: 'q-row',
    connector: 'q-connector',
    rule: 'q-rule',
    ruleSet: 'q-ruleset',
    invalidRuleSet: 'q-invalid-ruleset',
    emptyWarning: 'q-empty-warning',
    fieldControl: 'q-field-control',
    fieldControlSize: 'q-control-size',
    entityControl: 'q-entity-control',
    entityControlSize: 'q-control-size',
    operatorControl: 'q-operator-control',
    operatorControlSize: 'q-control-size',
    inputControl: 'q-input-control',
    inputControlSize: 'q-control-size'
  };

  readonly defaultOperatorMap: { [key: string]: string[] } = {
    string: ['=', '!=', 'contains', 'like'],
    number: ['=', '!=', '>', '>=', '<', '<='],
    time: ['=', '!=', '>', '>=', '<', '<='],
    date: ['=', '!=', '>', '>=', '<', '<='],
    category: ['=', '!=', 'in', 'not in'],
    boolean: ['=']
  };

  // ---------- ControlValueAccessor callbacks ----------

  onChangeCallback: (() => void) | undefined = undefined;
  onTouchedCallback: (() => void) | undefined = undefined;

  // ---------- Signal Queries ----------

  readonly treeContainer = viewChild.required<ElementRef>('treeContainer');

  readonly buttonGroupTemplate = contentChild(QueryButtonGroupDirective);
  readonly switchGroupTemplate = contentChild(QuerySwitchGroupDirective);
  readonly fieldTemplate = contentChild(QueryFieldDirective);
  readonly entityTemplate = contentChild(QueryEntityDirective);
  readonly operatorTemplate = contentChild(QueryOperatorDirective);
  readonly removeButtonTemplate = contentChild(QueryRemoveButtonDirective);
  readonly emptyWarningTemplate = contentChild(QueryEmptyWarningDirective);
  readonly arrowIconTemplate = contentChild(QueryArrowIconDirective);
  readonly inputTemplates = contentChildren(QueryInputDirective);

  // ---------- DI ----------

  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  // ---------- Private state ----------

  private readonly defaultTemplateTypes: string[] = [
    'string', 'number', 'time', 'date', 'category', 'boolean', 'multiselect'
  ];
  private readonly defaultPersistValueTypes: string[] = [
    'string', 'number', 'time', 'date', 'boolean'
  ];
  private readonly defaultEmptyList: any[] = [];
  private operatorsCache: { [key: string]: string[] } = {};
  private inputContextCache = new Map<Rule, InputContext>();
  private operatorContextCache = new Map<Rule, OperatorContext>();
  private fieldContextCache = new Map<Rule, FieldContext>();
  private entityContextCache = new Map<Rule, EntityContext>();
  private removeButtonContextCache = new Map<Rule, RemoveButtonContext>();
  private buttonGroupContext: ButtonGroupContext | null = null;

  constructor() {
    // Recompute fields/entities whenever config signal changes
    effect(() => {
      const config = this.config();
      if (typeof config !== 'object') {
        throw new Error(`Expected 'config' must be a valid object, got ${typeof config} instead.`);
      }
      this.fields = Object.keys(config.fields).map((value) => {
        const field = config.fields[value];
        field.value = field.value || value;
        return field;
      });
      this.entities = config.entities
        ? Object.keys(config.entities).map((value) => {
            const entity = config.entities![value];
            entity.value = entity.value || value;
            return entity;
          })
        : null;
      this.operatorsCache = {};
    });
  }

  // ---------- OnChanges — kept for `data` and `disabled` which are not signal inputs ----------

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['disabled']) {
      this.handleDataChange();
    }
  }

  // ---------- Validator Implementation ----------

  validate(control: AbstractControl): ValidationErrors | null {
    const errors: { [key: string]: any } = {};
    const ruleErrorStore: any[] = [];
    let hasErrors = false;

    if (!this.config().allowEmptyRulesets && this.checkEmptyRuleInRuleset(this.data)) {
      errors['empty'] = 'Empty rulesets are not allowed.';
      hasErrors = true;
    }

    this.validateRulesInRuleset(this.data, ruleErrorStore);

    if (ruleErrorStore.length) {
      errors['rules'] = ruleErrorStore;
      hasErrors = true;
    }
    return hasErrors ? errors : null;
  }

  // ---------- ControlValueAccessor Implementation ----------

  get value(): RuleSet {
    return this.data;
  }
  set value(value: RuleSet) {
    this.data = value || { condition: 'and', rules: [] };
    this.handleDataChange();
  }

  writeValue(obj: RuleSet): void {
    this.value = obj;
  }

  registerOnChange(fn: (value: RuleSet) => void): void {
    this.onChangeCallback = () => fn(this.data);
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.changeDetectorRef.detectChanges();
  }

  // ---------- Public API ----------

  getDisabledState = (): boolean => this.disabled;

  findTemplateForRule(rule: Rule): TemplateRef<unknown> | null {
    const type = this.getInputType(rule.field, rule.operator);
    if (type) {
      const queryInput = this.findQueryInput(type);
      if (queryInput) {
        return queryInput.template;
      } else {
        if (!this.defaultTemplateTypes.includes(type)) {
          console.warn(`Could not find template for field with type: ${type}`);
        }
        return null;
      }
    }
    return null;
  }

  findQueryInput(type: string): QueryInputDirective | undefined {
    const parentTemplates = this.parentInputTemplates();
    const templates = parentTemplates.length ? parentTemplates : this.inputTemplates();
    return templates.find((item) => item.queryInputType === type);
  }

  getOperators(field: string): string[] {
    if (this.operatorsCache[field]) {
      return this.operatorsCache[field];
    }
    let operators = this.defaultEmptyList;
    const config = this.config();
    const fieldObject = config.fields[field];

    if (config.getOperators) {
      return config.getOperators(field, fieldObject);
    }

    const type = fieldObject.type;

    if (fieldObject && fieldObject.operators) {
      operators = fieldObject.operators;
    } else if (type) {
      const opMap = this.operatorMap();
      operators = (opMap && opMap[type]) || this.defaultOperatorMap[type] || this.defaultEmptyList;
      if (operators.length === 0) {
        console.warn(
          `No operators found for field '${field}' with type ${fieldObject.type}. ` +
          `Please define an 'operators' property on the field or use the 'operatorMap' binding to fix this.`
        );
      }
      if (fieldObject.nullable) {
        operators = operators.concat(['is null', 'is not null']);
      }
    } else {
      console.warn(`No 'type' property found on field: '${field}'`);
    }

    this.operatorsCache[field] = operators;
    return operators;
  }

  getFields(entity: string): Field[] {
    if (this.entities && entity) {
      return this.fields.filter((field) => field && field.entity === entity);
    }
    return this.fields;
  }

  getInputType(field: string, operator: string | undefined): string | null {
    const config = this.config();
    if (config.getInputType) {
      return config.getInputType(field, operator ?? '');
    }

    if (!config.fields[field]) {
      throw new Error(`No configuration for field '${field}' could be found! Please add it to config.fields.`);
    }

    const type = config.fields[field].type;
    switch (operator) {
      case 'is null':
      case 'is not null':
        return null;
      case 'in':
      case 'not in':
        return type === 'category' || type === 'boolean' ? 'multiselect' : type;
      default:
        return type;
    }
  }

  getOptions(field: string): Option[] {
    const config = this.config();
    if (config.getOptions) {
      return config.getOptions(field);
    }
    return config.fields[field].options || this.defaultEmptyList;
  }

  getClassNames(...args: string[]): string {
    const clsLookup = this.classNames() ?? this.defaultClassNames;
    const classNames = args
      .map((id) => (clsLookup as Record<string, string | undefined>)[id] || (this.defaultClassNames as Record<string, string | undefined>)[id])
      .filter((c): c is string => !!c);
    return classNames.length ? classNames.join(' ') : '';
  }

  getDefaultField(entity: Entity): Field | null {
    if (!entity) {
      return null;
    } else if (entity.defaultField !== undefined) {
      return this.getDefaultValue(entity.defaultField) as Field | null;
    } else {
      const entityFields = this.fields.filter((field) => field && field.entity === entity.value);
      if (entityFields && entityFields.length) {
        return entityFields[0];
      } else {
        console.warn(
          `No fields found for entity '${entity.name}'. ` +
          `A 'defaultOperator' is also not specified on the field config. Operator value will default to null.`
        );
        return null;
      }
    }
  }

  getDefaultOperator(field: Field): string | null {
    if (field && field.defaultOperator !== undefined) {
      return this.getDefaultValue(field.defaultOperator) as string | null;
    } else {
      const operators = this.getOperators(field.value!);
      if (operators && operators.length) {
        return operators[0];
      } else {
        console.warn(
          `No operators found for field '${field.value}'. ` +
          `A 'defaultOperator' is also not specified on the field config. Operator value will default to null.`
        );
        return null;
      }
    }
  }

  addRule(parent?: RuleSet): void {
    if (this.disabled) { return; }

    parent = parent || this.data;
    if (this.config().addRule) {
      this.config().addRule!(parent);
    } else {
      const field = this.fields[0];
      parent.rules = parent.rules.concat([{
        field: field.value!,
        operator: this.getDefaultOperator(field) ?? undefined,
        value: this.getDefaultValue(field.defaultValue),
        entity: field.entity
      }]);
    }

    this.handleTouched();
    this.handleDataChange();
  }

  removeRule(rule: Rule, parent?: RuleSet): void {
    if (this.disabled) { return; }

    parent = parent || this.data;
    if (this.config().removeRule) {
      this.config().removeRule!(rule, parent);
    } else {
      parent.rules = parent.rules.filter((r) => r !== rule);
    }
    this.inputContextCache.delete(rule);
    this.operatorContextCache.delete(rule);
    this.fieldContextCache.delete(rule);
    this.entityContextCache.delete(rule);
    this.removeButtonContextCache.delete(rule);

    this.handleTouched();
    this.handleDataChange();
  }

  addRuleSet(parent?: RuleSet): void {
    if (this.disabled) { return; }

    parent = parent || this.data;
    if (this.config().addRuleSet) {
      this.config().addRuleSet!(parent);
    } else {
      parent.rules = parent.rules.concat([{ condition: 'and', rules: [] }]);
    }

    this.handleTouched();
    this.handleDataChange();
  }

  removeRuleSet(ruleset?: RuleSet, parent?: RuleSet): void {
    if (this.disabled) { return; }

    ruleset = ruleset || this.data;
    parent = parent || this.parentValue();
    if (this.config().removeRuleSet) {
      this.config().removeRuleSet!(ruleset, parent!);
    } else {
      parent!.rules = parent!.rules.filter((r) => r !== ruleset);
    }

    this.handleTouched();
    this.handleDataChange();
  }

  transitionEnd(e: TransitionEvent): void {
    if (e.propertyName === 'max-height') {
      this.treeContainer().nativeElement.style.maxHeight = null;
    }
  }

  toggleCollapse(): void {
    this.computedTreeContainerHeight();
    setTimeout(() => {
      this.data.collapsed = !this.data.collapsed;
      this.changeDetectorRef.markForCheck();
    }, 100);
  }

  computedTreeContainerHeight(): void {
    const nativeElement: HTMLElement = this.treeContainer().nativeElement;
    if (nativeElement && nativeElement.firstElementChild) {
      nativeElement.style.maxHeight = (nativeElement.firstElementChild.clientHeight + 8) + 'px';
    }
  }

  changeCondition(value: string): void {
    if (this.disabled) { return; }
    this.data.condition = value;
    this.handleTouched();
    this.handleDataChange();
  }

  changeOperator(rule: Rule): void {
    if (this.disabled) { return; }

    const config = this.config();
    if (config.coerceValueForOperator) {
      rule.value = config.coerceValueForOperator(rule.operator!, rule.value, rule);
    } else {
      rule.value = this.coerceValueForOperator(rule.operator!, rule.value, rule);
    }

    this.handleTouched();
    this.handleDataChange();
  }

  coerceValueForOperator(operator: string, value: unknown, rule: Rule): unknown {
    const inputType = this.getInputType(rule.field, operator);
    if (inputType === 'multiselect' && !Array.isArray(value)) {
      return [value];
    }
    return value;
  }

  changeInput(): void {
    if (this.disabled) { return; }
    this.handleTouched();
    this.handleDataChange();
  }

  changeField(fieldValue: string, rule: Rule): void {
    if (this.disabled) { return; }

    const inputContext = this.inputContextCache.get(rule);
    const currentField = inputContext?.field;
    const nextField: Field = this.config().fields[fieldValue];
    const nextValue = this.calculateFieldChangeValue(currentField, nextField, rule.value);

    if (nextValue !== undefined) {
      rule.value = nextValue;
    } else {
      delete rule.value;
    }

    rule.operator = this.getDefaultOperator(nextField) ?? undefined;

    // Invalidate caches so templates re-render with fresh context
    this.inputContextCache.delete(rule);
    this.operatorContextCache.delete(rule);
    this.fieldContextCache.delete(rule);
    this.entityContextCache.delete(rule);
    this.getInputContext(rule);
    this.getFieldContext(rule);
    this.getOperatorContext(rule);
    this.getEntityContext(rule);

    this.handleTouched();
    this.handleDataChange();
  }

  changeEntity(entityValue: string, rule: Rule, index: number, data: RuleSet): void {
    if (this.disabled) { return; }

    let i = index;
    let rs = data;
    const entity = this.entities?.find((e) => e.value === entityValue);
    const defaultField = entity ? this.getDefaultField(entity) : null;

    if (!rs) {
      rs = this.data;
      i = rs.rules.findIndex((x) => x === rule);
    }

    if (defaultField) {
      rule.field = defaultField.value!;
      rs.rules[i] = rule;
      this.changeField(defaultField.value!, rule);
    } else {
      this.handleTouched();
      this.handleDataChange();
    }
  }

  getDefaultValue(defaultValue: unknown): unknown {
    if (typeof defaultValue === 'function') {
      return (defaultValue as () => unknown)();
    }
    return defaultValue;
  }

  getOperatorTemplate(): TemplateRef<unknown> | null {
    const t = this.parentOperatorTemplate() ?? this.operatorTemplate();
    return t?.template ?? null;
  }

  getFieldTemplate(): TemplateRef<unknown> | null {
    const t = this.parentFieldTemplate() ?? this.fieldTemplate();
    return t?.template ?? null;
  }

  getEntityTemplate(): TemplateRef<unknown> | null {
    const t = this.parentEntityTemplate() ?? this.entityTemplate();
    return t?.template ?? null;
  }

  getArrowIconTemplate(): TemplateRef<unknown> | null {
    const t = this.parentArrowIconTemplate() ?? this.arrowIconTemplate();
    return t?.template ?? null;
  }

  getButtonGroupTemplate(): TemplateRef<unknown> | null {
    const t = this.parentButtonGroupTemplate() ?? this.buttonGroupTemplate();
    return t?.template ?? null;
  }

  getSwitchGroupTemplate(): TemplateRef<unknown> | null {
    const t = this.parentSwitchGroupTemplate() ?? this.switchGroupTemplate();
    return t?.template ?? null;
  }

  getRemoveButtonTemplate(): TemplateRef<unknown> | null {
    const t = this.parentRemoveButtonTemplate() ?? this.removeButtonTemplate();
    return t?.template ?? null;
  }

  getEmptyWarningTemplate(): TemplateRef<unknown> | null {
    const t = this.parentEmptyWarningTemplate() ?? this.emptyWarningTemplate();
    return t?.template ?? null;
  }

  getQueryItemClassName(local: LocalRuleMeta): string {
    let cls = this.getClassNames('row', 'connector', 'transition');
    cls += ' ' + this.getClassNames(local.ruleset ? 'ruleSet' : 'rule');
    if (local.invalid) {
      cls += ' ' + this.getClassNames('invalidRuleSet');
    }
    return cls;
  }

  getButtonGroupContext(): ButtonGroupContext {
    if (!this.buttonGroupContext) {
      this.buttonGroupContext = {
        addRule: this.addRule.bind(this),
        addRuleSet: this.allowRuleset() ? this.addRuleSet.bind(this) : undefined,
        removeRuleSet: this.allowRuleset() && this.parentValue() ? this.removeRuleSet.bind(this) : undefined,
        getDisabledState: this.getDisabledState,
        $implicit: this.data
      };
    }
    return this.buttonGroupContext!;
  }

  getRemoveButtonContext(rule: Rule): RemoveButtonContext {
    if (!this.removeButtonContextCache.has(rule)) {
      this.removeButtonContextCache.set(rule, {
        removeRule: this.removeRule.bind(this),
        getDisabledState: this.getDisabledState,
        $implicit: rule
      });
    }
    return this.removeButtonContextCache.get(rule)!;
  }

  getFieldContext(rule: Rule): FieldContext {
    if (!this.fieldContextCache.has(rule)) {
      this.fieldContextCache.set(rule, {
        onChange: this.changeField.bind(this),
        getFields: this.getFields.bind(this),
        getDisabledState: this.getDisabledState,
        fields: this.fields,
        $implicit: rule
      });
    }
    return this.fieldContextCache.get(rule)!;
  }

  getEntityContext(rule: Rule): EntityContext {
    if (!this.entityContextCache.has(rule)) {
      this.entityContextCache.set(rule, {
        onChange: (entityValue: string, r: Rule) => this.changeEntity(entityValue, r, -1, this.data),
        getDisabledState: this.getDisabledState,
        entities: this.entities ?? [],
        $implicit: rule
      });
    }
    return this.entityContextCache.get(rule)!;
  }

  getSwitchGroupContext(): SwitchGroupContext {
    return {
      onChange: this.changeCondition.bind(this),
      getDisabledState: this.getDisabledState,
      $implicit: this.data
    };
  }

  getArrowIconContext(): ArrowIconContext {
    return {
      getDisabledState: this.getDisabledState,
      $implicit: this.data
    };
  }

  getEmptyWarningContext(): EmptyWarningContext {
    return {
      getDisabledState: this.getDisabledState,
      message: this.emptyMessage(),
      $implicit: this.data
    };
  }

  getOperatorContext(rule: Rule): OperatorContext {
    if (!this.operatorContextCache.has(rule)) {
      this.operatorContextCache.set(rule, {
        onChange: () => this.changeOperator(rule),
        getDisabledState: this.getDisabledState,
        operators: this.getOperators(rule.field),
        $implicit: rule
      });
    }
    return this.operatorContextCache.get(rule)!;
  }

  getInputContext(rule: Rule): InputContext {
    if (!this.inputContextCache.has(rule)) {
      this.inputContextCache.set(rule, {
        onChange: this.changeInput.bind(this),
        getDisabledState: this.getDisabledState,
        options: this.getOptions(rule.field),
        field: this.config().fields[rule.field],
        $implicit: rule
      });
    }
    return this.inputContextCache.get(rule)!;
  }

  // ---------- Private Helpers ----------

  private calculateFieldChangeValue(
    currentField: Field | undefined,
    nextField: Field,
    currentValue: unknown
  ): unknown {
    const config = this.config();
    if (config.calculateFieldChangeValue != null) {
      return config.calculateFieldChangeValue(currentField!, nextField, currentValue);
    }

    const canKeepValue = () => {
      if (currentField == null || nextField == null) { return false; }
      return currentField.type === nextField.type
        && this.defaultPersistValueTypes.includes(currentField.type);
    };

    if (this.persistValueOnFieldChange() && canKeepValue()) {
      return currentValue;
    }

    if (nextField && nextField.defaultValue !== undefined) {
      return this.getDefaultValue(nextField.defaultValue);
    }

    return undefined;
  }

  private checkEmptyRuleInRuleset(ruleset: RuleSet): boolean {
    if (!ruleset || !ruleset.rules || ruleset.rules.length === 0) {
      return true;
    }
    return ruleset.rules.some((item) => {
      if ((item as RuleSet).rules) {
        return this.checkEmptyRuleInRuleset(item as RuleSet);
      }
      return false;
    });
  }

  private validateRulesInRuleset(ruleset: RuleSet, errorStore: unknown[]): void {
    if (ruleset && ruleset.rules && ruleset.rules.length > 0) {
      ruleset.rules.forEach((item) => {
        if ((item as RuleSet).rules) {
          this.validateRulesInRuleset(item as RuleSet, errorStore);
        } else if ((item as Rule).field) {
          const field = this.config().fields[(item as Rule).field];
          if (field && field.validator) {
            const error = field.validator(item as Rule, ruleset);
            if (error != null) {
              errorStore.push(error);
            }
          }
        }
      });
    }
  }

  private handleDataChange(): void {
    this.changeDetectorRef.markForCheck();
    this.onChangeCallback?.();
    this.parentChangeCallback()?.();
  }

  private handleTouched(): void {
    this.onTouchedCallback?.();
    this.parentTouchedCallback()?.();
  }
}
