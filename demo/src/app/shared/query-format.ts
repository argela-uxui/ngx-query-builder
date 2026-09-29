import { Field, FieldMap, QueryBuilderConfig, Rule, RuleSet } from 'ngx-query-builder';

/** Demo-only helpers that turn a RuleSet into other query languages. */

export interface RuleSetStats {
  rules: number;
  rulesets: number;
  depth: number;
}

export function isRuleSet(item: Rule | RuleSet): item is RuleSet {
  return Array.isArray((item as RuleSet).rules);
}

/** Validate imported RuleSet JSON before passing it to the builder or converters. */
export function isValidRuleSet(value: unknown, fields: FieldMap): value is RuleSet {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if ((candidate['condition'] !== 'and' && candidate['condition'] !== 'or') || !Array.isArray(candidate['rules'])) {
    return false;
  }
  return candidate['rules'].every((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const child = item as Record<string, unknown>;
    if (Array.isArray(child['rules'])) {
      return isValidRuleSet(child, fields);
    }
    return typeof child['field'] === 'string' && child['field'] in fields;
  });
}

export function getRuleSetStats(ruleset: RuleSet, depth = 1): RuleSetStats {
  return ruleset.rules.reduce<RuleSetStats>(
    (stats, item) => {
      if (isRuleSet(item)) {
        const child = getRuleSetStats(item, depth + 1);
        return {
          rules: stats.rules + child.rules,
          rulesets: stats.rulesets + child.rulesets + 1,
          depth: Math.max(stats.depth, child.depth),
        };
      }
      return { ...stats, rules: stats.rules + 1 };
    },
    { rules: 0, rulesets: 0, depth },
  );
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 10)}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
}

function ruleToSql(rule: Rule): string {
  const column = rule.field.replace(/[^\w.]/g, '');
  const value = rule.value;
  switch (rule.operator) {
    case 'is null':
      return `${column} IS NULL`;
    case 'is not null':
      return `${column} IS NOT NULL`;
    case 'in':
    case 'not in': {
      const list = asArray(value).map(sqlLiteral).join(', ');
      return `${column} ${rule.operator === 'in' ? 'IN' : 'NOT IN'} (${list || 'NULL'})`;
    }
    case 'contains':
      return `${column} LIKE ${sqlLiteral(`%${value ?? ''}%`)}`;
    case 'like':
      return `${column} LIKE ${sqlLiteral(value)}`;
    case 'startsWith':
      return `${column} LIKE ${sqlLiteral(`${value ?? ''}%`)}`;
    case 'endsWith':
      return `${column} LIKE ${sqlLiteral(`%${value ?? ''}`)}`;
    case 'between': {
      const [from, to] = asArray(value);
      return `${column} BETWEEN ${sqlLiteral(from)} AND ${sqlLiteral(to)}`;
    }
    case undefined:
      return `${column} = ${sqlLiteral(value)}`;
    default: {
      const safeOperator = new Set(['=', '!=', '>', '>=', '<', '<=']).has(rule.operator ?? '')
        ? rule.operator
        : '=';
      return `${column} ${safeOperator} ${sqlLiteral(value)}`;
    }
  }
}

export function toSql(ruleset: RuleSet, indent = ''): string {
  if (!ruleset.rules.length) {
    return 'TRUE';
  }
  const joiner = `\n${indent}  ${ruleset.condition.toUpperCase()} `;
  const parts = ruleset.rules.map((item) =>
    isRuleSet(item) ? `(\n${indent}    ${toSql(item, `${indent}  `)}\n${indent}  )` : ruleToSql(item),
  );
  return parts.join(joiner);
}

export function toSqlStatement(ruleset: RuleSet, table = 'people'): string {
  const safeTable = table.replace(/[^\w.]/g, '') || 'people';
  return `SELECT *\nFROM ${safeTable}\nWHERE ${toSql(ruleset)};`;
}

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------

type MongoFilter = Record<string, unknown>;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ruleToMongo(rule: Rule): MongoFilter {
  const value = rule.value;
  const text = String(value ?? '');
  const ops: Record<string, () => unknown> = {
    '=': () => value,
    '!=': () => ({ $ne: value }),
    '>': () => ({ $gt: value }),
    '>=': () => ({ $gte: value }),
    '<': () => ({ $lt: value }),
    '<=': () => ({ $lte: value }),
    in: () => ({ $in: asArray(value) }),
    'not in': () => ({ $nin: asArray(value) }),
    contains: () => ({ $regex: escapeRegex(text), $options: 'i' }),
    like: () => ({ $regex: `^${escapeRegex(text).replace(/%/g, '.*').replace(/_/g, '.')}$`, $options: 'i' }),
    startsWith: () => ({ $regex: `^${escapeRegex(text)}`, $options: 'i' }),
    endsWith: () => ({ $regex: `${escapeRegex(text)}$`, $options: 'i' }),
    between: () => {
      const [from, to] = asArray(value);
      return { $gte: from, $lte: to };
    },
    'is null': () => null,
    'is not null': () => ({ $ne: null }),
  };
  const build = ops[rule.operator ?? '='] ?? (() => ({ [`$${rule.operator}`]: value }));
  return { [rule.field]: build() };
}

export function toMongo(ruleset: RuleSet): MongoFilter {
  const key = ruleset.condition === 'or' ? '$or' : '$and';
  return {
    [key]: ruleset.rules.map((item) => (isRuleSet(item) ? toMongo(item) : ruleToMongo(item))),
  };
}

// ---------------------------------------------------------------------------
// Human readable text
// ---------------------------------------------------------------------------

const OPERATOR_WORDS: Record<string, string> = {
  '=': 'is',
  '!=': 'is not',
  '>': 'is greater than',
  '>=': 'is at least',
  '<': 'is less than',
  '<=': 'is at most',
  in: 'is any of',
  'not in': 'is none of',
  contains: 'contains',
  like: 'matches',
  startsWith: 'starts with',
  endsWith: 'ends with',
  between: 'is between',
  'is null': 'is empty',
  'is not null': 'is not empty',
};

function describeValue(value: unknown, field: Field | undefined): string {
  const nameOf = (v: unknown): string => {
    const option = field?.options?.find((o) => o.value === v);
    if (option) {
      return option.name;
    }
    if (v instanceof Date) {
      return v.toISOString().slice(0, 10);
    }
    if (typeof v === 'boolean') {
      return v ? 'yes' : 'no';
    }
    return v === undefined || v === null || v === '' ? '∅' : `"${String(v)}"`;
  };
  if (Array.isArray(value)) {
    return value.length ? `[${value.map(nameOf).join(', ')}]` : '[]';
  }
  return nameOf(value);
}

function ruleToText(rule: Rule, config: QueryBuilderConfig): string {
  const field = config.fields[rule.field];
  const label = field?.name ?? rule.field;
  const words = OPERATOR_WORDS[rule.operator ?? '='] ?? rule.operator ?? 'is';
  if (rule.operator === 'is null' || rule.operator === 'is not null') {
    return `${label} ${words}`;
  }
  if (rule.operator === 'between' && Array.isArray(rule.value)) {
    return `${label} ${words} ${describeValue(rule.value[0], field)} and ${describeValue(rule.value[1], field)}`;
  }
  return `${label} ${words} ${describeValue(rule.value, field)}`;
}

export function toReadableText(ruleset: RuleSet, config: QueryBuilderConfig, indent = ''): string {
  if (!ruleset.rules.length) {
    return `${indent}(empty group — matches everything)`;
  }
  const lines = ruleset.rules.map((item, index) => {
    const prefix = index === 0 ? '' : `${ruleset.condition.toUpperCase()} `;
    if (isRuleSet(item)) {
      return `${indent}${prefix}(\n${toReadableText(item, config, `${indent}  `)}\n${indent})`;
    }
    return `${indent}${prefix}${ruleToText(item, config)}`;
  });
  return lines.join('\n');
}
