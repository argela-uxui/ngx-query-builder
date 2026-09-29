export interface RuleSet {
  condition: string;
  rules: (RuleSet | Rule)[];
  collapsed?: boolean;
  isChild?: boolean;
}

export type QueryValue = unknown;
export type QueryValueFactory = () => QueryValue;
export type QueryDefaultValue = QueryValue | QueryValueFactory;
export type RuleValidationResult = unknown;

export interface Rule {
  field: string;
  value?: QueryValue;
  operator?: string;
  entity?: string;
}

export interface Option {
  name: string;
  value: QueryValue;
}

export type FieldMap = Record<string, Field>;

export interface Field {
  name: string;
  value?: string;
  type: string;
  nullable?: boolean;
  options?: Option[];
  operators?: string[];
  defaultValue?: QueryDefaultValue;
  defaultOperator?: QueryDefaultValue;
  entity?: string;
  validator?: (rule: Rule, parent: RuleSet) => RuleValidationResult | null;
}

export interface LocalRuleMeta {
  ruleset: boolean;
  invalid: boolean;
}

export type EntityMap = Record<string, Entity>;

export interface Entity {
  name: string;
  value?: string;
  defaultField?: QueryDefaultValue;
}

export interface QueryBuilderClassNames {
  arrowIconButton?: string;
  arrowIcon?: string;
  removeIcon?: string;
  addIcon?: string;
  button?: string;
  buttonGroup?: string;
  removeButton?: string;
  removeButtonSize?: string;
  switchRow?: string;
  switchGroup?: string;
  switchLabel?: string;
  switchRadio?: string;
  switchControl?: string;
  rightAlign?: string;
  transition?: string;
  collapsed?: string;
  treeContainer?: string;
  tree?: string;
  row?: string;
  connector?: string;
  rule?: string;
  ruleSet?: string;
  invalidRuleSet?: string;
  emptyWarning?: string;
  fieldControl?: string;
  fieldControlSize?: string;
  entityControl?: string;
  entityControlSize?: string;
  operatorControl?: string;
  operatorControlSize?: string;
  inputControl?: string;
  inputControlSize?: string;
  dragHandle?: string;
  draggableRule?: string;
  dropTargetSpacer?: string;
}

export interface QueryBuilderConfig {
  fields: FieldMap;
  entities?: EntityMap;
  allowEmptyRulesets?: boolean;
  getOperators?: (fieldName: string, field: Field) => string[];
  getInputType?: (field: string, operator: string) => string;
  getOptions?: (field: string) => Option[];
  addRuleSet?: (parent: RuleSet) => void;
  addRule?: (parent: RuleSet) => void;
  removeRuleSet?: (ruleset: RuleSet, parent: RuleSet) => void;
  removeRule?: (rule: Rule, parent: RuleSet) => void;
  coerceValueForOperator?: (operator: string, value: QueryValue, rule: Rule) => QueryValue;
  calculateFieldChangeValue?: (currentField: Field,
                               nextField: Field,
                               currentValue: QueryValue) => QueryValue;
}

export interface QueryBuilderButtonLabels {
  addRule: string;
  addRuleset: string;
  removeRuleset: string;
}

export interface QueryBuilderSwitchLabels {
  and: string;
  or: string;
}

export interface QueryBuilderTranslations {
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

export interface SwitchGroupContext {
  onChange: (conditionValue: string) => void;
  labels: QueryBuilderSwitchLabels;
  getLabel: (key: keyof QueryBuilderSwitchLabels) => string;
  getDisabledState: () => boolean;
  $implicit: RuleSet;
}

export interface EmptyWarningContext {
  getDisabledState: () => boolean;
  message: string;
  $implicit: RuleSet;
}

export interface ArrowIconContext {
  getDisabledState: () => boolean;
  $implicit: RuleSet;
}

export interface EntityContext {
  onChange: (entityValue: string, rule: Rule) => void;
  getDisabledState: () => boolean;
  entities: Entity[];
  $implicit: Rule;
}

export interface FieldContext {
  onChange: (fieldValue: string, rule: Rule) => void;
  getFields: (entityName: string) => void;
  getDisabledState: () => boolean;
  dragDropEnabled: boolean;
  dragHandleClass: string;
  dragHandleAriaLabel: string;
  fields: Field[];
  $implicit: Rule;
}

export interface OperatorContext {
  onChange: () => void;
  labels: Record<string, string>;
  getLabel: (operator: string) => string;
  getDisabledState: () => boolean;
  operators: string[];
  $implicit: Rule;
}

export interface InputContext {
  onChange: () => void;
  getDisabledState: () => boolean;
  options: Option[];
  field: Field;
  $implicit: Rule;
}

export interface ButtonGroupContext {
  addRule: () => void;
  addRuleSet?: () => void;
  removeRuleSet?: () => void;
  labels: QueryBuilderButtonLabels;
  getLabel: (key: keyof QueryBuilderButtonLabels) => string;
  getDisabledState: () => boolean;
  $implicit: RuleSet;
}

export interface RemoveButtonContext {
  removeRule: (rule: Rule) => void;
  getDisabledState: () => boolean;
  $implicit: Rule;
}
