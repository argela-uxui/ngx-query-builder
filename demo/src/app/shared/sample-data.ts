import { Field, QueryBuilderConfig, QueryBuilderTranslations, RuleSet } from 'ngx-query-builder';

// ---------------------------------------------------------------------------
// Reusable field definitions for the playground and examples.
// NOTE: the query builder writes `field.value` onto these objects, so every
// config gets its own copies via the factory functions below.
// ---------------------------------------------------------------------------

function createPeopleFields(withEntities: boolean): Record<string, Field> {
  const physical = withEntities ? { entity: 'physical' } : {};
  const nonphysical = withEntities ? { entity: 'nonphysical' } : {};
  return {
    age: { name: 'Age', type: 'number', ...physical },
    gender: {
      name: 'Gender',
      type: 'category',
      options: [
        { name: 'Male', value: 'm' },
        { name: 'Female', value: 'f' },
      ],
      ...physical,
    },
    name: { name: 'Name', type: 'string', ...nonphysical },
    notes: { name: 'Notes', type: 'textarea', operators: ['=', '!='], ...nonphysical },
    educated: { name: 'College Degree?', type: 'boolean', ...nonphysical },
    birthday: {
      name: 'Birthday',
      type: 'date',
      operators: ['=', '<=', '>'],
      defaultValue: () => new Date(),
      ...nonphysical,
    },
    meetingTime: { name: 'Meeting Time', type: 'time', ...nonphysical },
    tags: {
      name: 'Tags',
      type: 'multiselect',
      operators: ['in', 'not in'],
      options: [
        { name: 'Angular', value: 'angular' },
        { name: 'TypeScript', value: 'typescript' },
        { name: 'RxJS', value: 'rxjs' },
        { name: 'Node.js', value: 'nodejs' },
      ],
      ...nonphysical,
    },
    school: { name: 'School', type: 'string', nullable: true, ...nonphysical },
    occupation: {
      name: 'Occupation',
      type: 'category',
      options: [
        { name: 'Student', value: 'student' },
        { name: 'Teacher', value: 'teacher' },
        { name: 'Unemployed', value: 'unemployed' },
        { name: 'Scientist', value: 'scientist' },
      ],
      ...nonphysical,
    },
  };
}

export function createPeopleConfig(): QueryBuilderConfig {
  return { fields: createPeopleFields(false) };
}

export function createPeopleEntityConfig(): QueryBuilderConfig {
  return {
    entities: {
      physical: { name: 'Physical Attributes' },
      nonphysical: { name: 'Nonphysical Attributes' },
    },
    fields: createPeopleFields(true),
  };
}

/** Initial playground query — the E2E suite relies on exactly these 10 top-level items. */
export function createPlaygroundQuery(): RuleSet {
  return {
    condition: 'and',
    rules: [
      { field: 'age', operator: '<=', value: 30, entity: 'physical' },
      { field: 'name', operator: '=', value: 'Alice', entity: 'nonphysical' },
      { field: 'birthday', operator: '=', value: '2000-01-01', entity: 'nonphysical' },
      { field: 'meetingTime', operator: '=', value: '09:00', entity: 'nonphysical' },
      { field: 'gender', operator: '=', value: 'm', entity: 'physical' },
      { field: 'educated', operator: '=', value: true, entity: 'nonphysical' },
      { field: 'tags', operator: 'in', value: ['angular', 'typescript'], entity: 'nonphysical' },
      { field: 'school', operator: 'is null', entity: 'nonphysical' },
      { field: 'notes', operator: '=', value: '', entity: 'nonphysical' },
      {
        condition: 'or',
        rules: [{ field: 'occupation', operator: 'in', entity: 'nonphysical' }],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const baseOperatorLabels: Record<string, string> = {
  '=': '=',
  '!=': '!=',
  '>': '>',
  '>=': '>=',
  '<': '<',
  '<=': '<=',
};

export const ENGLISH_TRANSLATIONS: QueryBuilderTranslations = {
  addRule: 'Rule',
  addRuleset: 'Ruleset',
  removeRule: 'Remove rule',
  removeRuleset: 'Remove ruleset',
  and: 'AND',
  or: 'OR',
  collapseRuleset: 'Collapse ruleset',
  expandRuleset: 'Expand ruleset',
  emptyRuleset: 'A ruleset cannot be empty. Please add a rule or remove it all together.',
  operatorLabels: {
    ...baseOperatorLabels,
    contains: 'contains',
    like: 'like',
    in: 'in',
    'not in': 'not in',
    'is null': 'is null',
    'is not null': 'is not null',
    eq: 'eq',
    neq: 'neq',
  },
};

export const TURKISH_TRANSLATIONS: QueryBuilderTranslations = {
  addRule: 'Kural',
  addRuleset: 'Kural Grubu',
  removeRule: 'Kurali kaldir',
  removeRuleset: 'Kural grubunu kaldir',
  and: 'VE',
  or: 'VEYA',
  collapseRuleset: 'Kural grubunu daralt',
  expandRuleset: 'Kural grubunu genislet',
  emptyRuleset: 'Kural grubu bos olamaz. Lutfen bir kural ekleyin veya tamamen kaldirin.',
  operatorLabels: {
    ...baseOperatorLabels,
    contains: 'icerir',
    like: 'benzer',
    in: 'icinde',
    'not in': 'icinde degil',
    'is null': 'null',
    'is not null': 'null degil',
    eq: 'esit',
    neq: 'esit degil',
  },
};

export const GERMAN_TRANSLATIONS: QueryBuilderTranslations = {
  addRule: 'Regel',
  addRuleset: 'Regelgruppe',
  removeRule: 'Regel entfernen',
  removeRuleset: 'Regelgruppe entfernen',
  and: 'UND',
  or: 'ODER',
  collapseRuleset: 'Regelgruppe einklappen',
  expandRuleset: 'Regelgruppe ausklappen',
  emptyRuleset: 'Eine Regelgruppe darf nicht leer sein. Bitte eine Regel hinzufügen oder die Gruppe entfernen.',
  operatorLabels: {
    ...baseOperatorLabels,
    contains: 'enthält',
    like: 'ähnlich',
    in: 'in',
    'not in': 'nicht in',
    'is null': 'ist leer',
    'is not null': 'ist nicht leer',
    eq: 'gleich',
    neq: 'ungleich',
  },
};

export function cloneRuleSet(ruleset: RuleSet): RuleSet {
  return structuredClone(ruleset);
}
