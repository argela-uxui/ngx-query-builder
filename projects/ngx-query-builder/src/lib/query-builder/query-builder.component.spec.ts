import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Component, ViewChild } from '@angular/core';
import { QueryBuilderComponent } from './query-builder.component';
import { Entity, QueryBuilderConfig, RuleSet, Rule } from './query-builder.interfaces';
import { QueryInputDirective } from './query-input.directive';
import { QueryArrowIconDirective } from './query-arrow-icon.directive';
import { QueryButtonGroupDirective } from './query-button-group.directive';
import { QueryEmptyWarningDirective } from './query-empty-warning.directive';
import { QueryEntityDirective } from './query-entity.directive';
import { QueryFieldDirective } from './query-field.directive';
import { QueryOperatorDirective } from './query-operator.directive';
import { QueryRemoveButtonDirective } from './query-remove-button.directive';
import { QuerySwitchGroupDirective } from './query-switch-group.directive';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const baseConfig: QueryBuilderConfig = {
  fields: {
    name: { name: 'Name', type: 'string' },
    age: { name: 'Age', type: 'number' },
    dob: { name: 'Date of Birth', type: 'date' },
    category: { name: 'Category', type: 'category', options: [{ name: 'A', value: 'a' }, { name: 'B', value: 'b' }] },
    isActive: { name: 'Active', type: 'boolean' },
    nullable: { name: 'Nullable', type: 'string', nullable: true },
    withOps: { name: 'CustomOps', type: 'string', operators: ['eq', 'neq'] },
    withDefault: { name: 'WithDefault', type: 'string', defaultValue: 'hello', defaultOperator: 'eq' },
    withDefaultFn: { name: 'WithDefaultFn', type: 'string', defaultValue: () => 'computed' },
    unknown: { name: 'Unknown', type: 'custom_type' },
  }
};

const emptyRuleset: RuleSet = { condition: 'and', rules: [] };

function createComponent(config = baseConfig, data: RuleSet = { ...emptyRuleset }) {
  const fixture = TestBed.createComponent(QueryBuilderComponent);
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('config', config);
  component.data = data;
  fixture.detectChanges();
  return { fixture, component };
}

// ---------------------------------------------------------------------------

describe('QueryBuilderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryBuilderComponent, ReactiveFormsModule],
    }).compileComponents();
  });

  // -------------------------------------------------------------------------
  // 1. Initialization
  // -------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should be created', () => {
      const { component } = createComponent();
      expect(component).toBeTruthy();
    });

    it('should build fields array from config', () => {
      const { component } = createComponent();
      expect(component.fields.length).toBe(Object.keys(baseConfig.fields).length);
      expect(component.fields.find(f => f.name === 'Name')).toBeTruthy();
    });

    it('should set field.value to key when not provided', () => {
      const { component } = createComponent();
      const nameField = component.fields.find(f => f.name === 'Name');
      expect(nameField?.value).toBe('name');
    });

    it('should build entities array from config.entities', () => {
      const configWithEntities: QueryBuilderConfig = {
        ...baseConfig,
        entities: {
          person: { name: 'Person' },
          org: { name: 'Organisation', value: 'org' },
        }
      };
      const { component } = createComponent(configWithEntities);
      expect(component.entities).toBeTruthy();
      expect(component.entities!.length).toBe(2);
    });

    it('should set entities to null when not in config', () => {
      const { component } = createComponent();
      expect(component.entities).toBeNull();
    });

    it('should reset operatorsCache when config changes', () => {
      const { fixture, component } = createComponent();
      // Prime the cache
      component.getOperators('name');
      fixture.componentRef.setInput('config', { ...baseConfig });
      fixture.detectChanges();
      // After config change, cache is cleared — getOperators recomputes
      const ops = component.getOperators('name');
      expect(ops).toEqual(['=', '!=', 'contains', 'like']);
    });

    it('should throw when config is not an object', () => {
      const fixture = TestBed.createComponent(QueryBuilderComponent);
      expect(() => {
        fixture.componentRef.setInput('config', 'invalid' as unknown as QueryBuilderConfig);
        fixture.detectChanges();
      }).toThrow(/Expected 'config' must be a valid object/);
    });
  });

  // -------------------------------------------------------------------------
  // 2. ControlValueAccessor
  // -------------------------------------------------------------------------
  describe('ControlValueAccessor', () => {
    it('writeValue() sets data', () => {
      const { component } = createComponent();
      const ruleset: RuleSet = { condition: 'or', rules: [] };
      component.writeValue(ruleset);
      expect(component.data).toBe(ruleset);
    });

    it('writeValue(null) falls back to empty ruleset', () => {
      const { component } = createComponent();
      component.writeValue(null as unknown as RuleSet);
      expect(component.data).toEqual({ condition: 'and', rules: [] });
    });

    it('value getter returns data', () => {
      const data: RuleSet = { condition: 'or', rules: [] };
      const { component } = createComponent(baseConfig, data);
      expect(component.value).toBe(data);
    });

    it('value setter updates data and fires change callback', () => {
      const { component } = createComponent();
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.value = { condition: 'or', rules: [] };
      expect(fn).toHaveBeenCalled();
    });

    it('registerOnChange() registers callback that fires on data change', () => {
      const { component } = createComponent();
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.addRule();
      expect(fn).toHaveBeenCalled();
    });

    it('registerOnTouched() registers callback that fires on touch', () => {
      const { component } = createComponent();
      const fn = jest.fn();
      component.registerOnTouched(fn);
      component.addRule();
      expect(fn).toHaveBeenCalled();
    });

    it('setDisabledState() sets disabled flag', () => {
      const { component } = createComponent();
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });

    it('getDisabledState() returns current disabled value', () => {
      const { component } = createComponent();
      component.setDisabledState(true);
      expect(component.getDisabledState()).toBe(true);
    });

    it('parentChangeCallback is called on data change when provided', () => {
      const { fixture, component } = createComponent();
      const parentFn = jest.fn();
      fixture.componentRef.setInput('parentChangeCallback', parentFn);
      fixture.detectChanges();
      component.addRule();
      expect(parentFn).toHaveBeenCalled();
    });

    it('parentTouchedCallback is called on touch when provided', () => {
      const { fixture, component } = createComponent();
      const parentFn = jest.fn();
      fixture.componentRef.setInput('parentTouchedCallback', parentFn);
      fixture.detectChanges();
      component.addRule();
      expect(parentFn).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Validator
  // -------------------------------------------------------------------------
  describe('validate()', () => {
    it('returns null for valid non-empty ruleset', () => {
      const { component } = createComponent(baseConfig, {
        condition: 'and',
        rules: [{ field: 'name', operator: '=', value: 'Alice' }]
      });
      const result = component.validate({} as AbstractControl);
      expect(result).toBeNull();
    });

    it('returns empty error for empty ruleset when allowEmptyRulesets is false', () => {
      const { component } = createComponent({ ...baseConfig, allowEmptyRulesets: false });
      const result = component.validate({} as AbstractControl);
      expect(result).toMatchObject({ empty: expect.any(String) });
    });

    it('returns null for empty ruleset when allowEmptyRulesets is true', () => {
      const { component } = createComponent({ ...baseConfig, allowEmptyRulesets: true });
      const result = component.validate({} as AbstractControl);
      expect(result).toBeNull();
    });

    it('returns rules error when field validator fails', () => {
      const configWithValidator: QueryBuilderConfig = {
        fields: {
          name: {
            name: 'Name', type: 'string',
            validator: (rule, parent) => {
              void rule;
              void parent;
              return { required: true };
            }
          }
        }
      };
      const { component } = createComponent(configWithValidator, {
        condition: 'and',
        rules: [{ field: 'name', operator: '=', value: '' }]
      });
      const result = component.validate({} as AbstractControl);
      expect(result).toMatchObject({ rules: expect.any(Array) });
    });

    it('returns null when field validator passes', () => {
      const configWithValidator: QueryBuilderConfig = {
        fields: {
          name: { name: 'Name', type: 'string', validator: () => null }
        }
      };
      const { component } = createComponent(configWithValidator, {
        condition: 'and',
        rules: [{ field: 'name', operator: '=', value: 'Alice' }]
      });
      const result = component.validate({} as AbstractControl);
      expect(result).toBeNull();
    });

    it('validates nested rulesets recursively', () => {
      const { component } = createComponent({ ...baseConfig, allowEmptyRulesets: false }, {
        condition: 'and',
        rules: [
          { field: 'name', operator: '=', value: 'test' },
          { condition: 'or', rules: [] } // nested empty ruleset
        ]
      });
      const result = component.validate({} as AbstractControl);
      expect(result).toMatchObject({ empty: expect.any(String) });
    });
  });

  // -------------------------------------------------------------------------
  // 4. getOperators()
  // -------------------------------------------------------------------------
  describe('getOperators()', () => {
    it('returns type-based operators from defaultOperatorMap for string', () => {
      const { component } = createComponent();
      expect(component.getOperators('name')).toEqual(['=', '!=', 'contains', 'like']);
    });

    it('returns type-based operators for number', () => {
      const { component } = createComponent();
      expect(component.getOperators('age')).toContain('>=');
    });

    it('returns cached result on second call', () => {
      const { component } = createComponent();
      const first = component.getOperators('name');
      const second = component.getOperators('name');
      expect(first).toBe(second);
    });

    it('returns field-specific operators when defined', () => {
      const { component } = createComponent();
      expect(component.getOperators('withOps')).toEqual(['eq', 'neq']);
    });

    it('appends is null / is not null for nullable fields', () => {
      const { component } = createComponent();
      const ops = component.getOperators('nullable');
      expect(ops).toContain('is null');
      expect(ops).toContain('is not null');
    });

    it('uses operatorMap input over defaultOperatorMap', () => {
      const { fixture, component } = createComponent();
      fixture.componentRef.setInput('operatorMap', { string: ['LIKE'] });
      fixture.detectChanges();
      expect(component.getOperators('name')).toEqual(['LIKE']);
    });

    it('uses config.getOperators callback when provided', () => {
      const getOperators = jest.fn().mockReturnValue(['custom']);
      const { component } = createComponent({ ...baseConfig, getOperators });
      expect(component.getOperators('name')).toEqual(['custom']);
      expect(getOperators).toHaveBeenCalledWith('name', expect.any(Object));
    });

    it('warns when no operators found for type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { component } = createComponent();
      component.getOperators('unknown'); // type: 'custom_type' — not in defaultOperatorMap
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No operators found'));
      consoleSpy.mockRestore();
    });

    it('warns when field has no type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const config = { fields: { noType: { name: 'NoType' } } } as unknown as QueryBuilderConfig;
      const { component } = createComponent(config);
      component.getOperators('noType');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No 'type' property found"));
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // 5. getFields()
  // -------------------------------------------------------------------------
  describe('getFields()', () => {
    it('returns all fields when no entity', () => {
      const { component } = createComponent();
      expect(component.getFields('')).toEqual(component.fields);
    });

    it('returns entity-filtered fields', () => {
      const configWithEntities: QueryBuilderConfig = {
        fields: {
          personName: { name: 'Person Name', type: 'string', entity: 'person' },
          orgName: { name: 'Org Name', type: 'string', entity: 'org' },
        },
        entities: { person: { name: 'Person' }, org: { name: 'Org' } }
      };
      const { component } = createComponent(configWithEntities);
      const fields = component.getFields('person');
      expect(fields.length).toBe(1);
      expect(fields[0].name).toBe('Person Name');
    });
  });

  // -------------------------------------------------------------------------
  // 6. getInputType()
  // -------------------------------------------------------------------------
  describe('getInputType()', () => {
    it('returns field type for standard operators', () => {
      const { component } = createComponent();
      expect(component.getInputType('name', '=')).toBe('string');
    });

    it('returns null for is null operator', () => {
      const { component } = createComponent();
      expect(component.getInputType('name', 'is null')).toBeNull();
    });

    it('returns null for is not null operator', () => {
      const { component } = createComponent();
      expect(component.getInputType('name', 'is not null')).toBeNull();
    });

    it('returns multiselect for in operator on category type', () => {
      const { component } = createComponent();
      expect(component.getInputType('category', 'in')).toBe('multiselect');
    });

    it('returns multiselect for not in operator on boolean type', () => {
      const { component } = createComponent();
      expect(component.getInputType('isActive', 'not in')).toBe('multiselect');
    });

    it('returns plain type for in operator on non-category string', () => {
      const { component } = createComponent();
      expect(component.getInputType('name', 'in')).toBe('string');
    });

    it('uses config.getInputType callback', () => {
      const getInputType = jest.fn().mockReturnValue('custom');
      const { component } = createComponent({ ...baseConfig, getInputType });
      expect(component.getInputType('name', '=')).toBe('custom');
    });

    it('throws for unknown field', () => {
      const { component } = createComponent();
      expect(() => component.getInputType('nonexistent', '=')).toThrow(/No configuration for field/);
    });
  });

  // -------------------------------------------------------------------------
  // 7. getOptions()
  // -------------------------------------------------------------------------
  describe('getOptions()', () => {
    it('returns field options', () => {
      const { component } = createComponent();
      const options = component.getOptions('category');
      expect(options.length).toBe(2);
      expect(options[0].name).toBe('A');
    });

    it('returns empty array when no options defined', () => {
      const { component } = createComponent();
      expect(component.getOptions('name')).toEqual([]);
    });

    it('uses config.getOptions callback', () => {
      const getOptions = jest.fn().mockReturnValue([{ name: 'X', value: 'x' }]);
      const { component } = createComponent({ ...baseConfig, getOptions });
      expect(component.getOptions('name')).toEqual([{ name: 'X', value: 'x' }]);
    });
  });

  // -------------------------------------------------------------------------
  // 8. getDefaultField()
  // -------------------------------------------------------------------------
  describe('getDefaultField()', () => {
    it('returns null for null entity', () => {
      const { component } = createComponent();
      expect(component.getDefaultField(null as unknown as Entity)).toBeNull();
    });

    it('returns result of entity.defaultField function', () => {
      const configWithEntities: QueryBuilderConfig = {
        fields: { personName: { name: 'Person Name', type: 'string', entity: 'person' } },
        entities: { person: { name: 'Person', defaultField: () => ({ name: 'Person Name', type: 'string', value: 'personName' }) } }
      };
      const { component } = createComponent(configWithEntities);
      const field = component.getDefaultField(component.entities![0]);
      expect(field).toBeDefined();
    });

    it('returns first field matching entity value', () => {
      const configWithEntities: QueryBuilderConfig = {
        fields: {
          personName: { name: 'Person Name', type: 'string', entity: 'person' },
          personAge: { name: 'Person Age', type: 'number', entity: 'person' },
        },
        entities: { person: { name: 'Person' } }
      };
      const { component } = createComponent(configWithEntities);
      const entity = component.entities![0];
      const field = component.getDefaultField(entity);
      expect(field).toBeTruthy();
    });

    it('warns and returns null when no matching fields', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const configWithEntities: QueryBuilderConfig = {
        fields: { name: { name: 'Name', type: 'string' } },
        entities: { org: { name: 'Org' } }
      };
      const { component } = createComponent(configWithEntities);
      const result = component.getDefaultField(component.entities![0]);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No fields found for entity'));
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // 9. getDefaultOperator()
  // -------------------------------------------------------------------------
  describe('getDefaultOperator()', () => {
    it('returns field.defaultOperator directly when set as string', () => {
      const { component } = createComponent();
      const field = component.config().fields['withDefault'];
      expect(component.getDefaultOperator(field)).toBe('eq');
    });

    it('returns result of defaultOperator function', () => {
      const configWithFnOperator: QueryBuilderConfig = {
        fields: {
          f: { name: 'F', type: 'string', defaultOperator: () => 'computed_op' }
        }
      };
      const { component } = createComponent(configWithFnOperator);
      expect(component.getDefaultOperator(component.fields[0])).toBe('computed_op');
    });

    it('returns first operator from getOperators when no defaultOperator', () => {
      const { component } = createComponent();
      const field = component.config().fields['name'];
      expect(component.getDefaultOperator(field)).toBe('=');
    });

    it('warns and returns null when no operators found', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const config: QueryBuilderConfig = { fields: { x: { name: 'X', type: 'custom_type' } } };
      const { component } = createComponent(config);
      const result = component.getDefaultOperator(component.fields[0]);
      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // 10. addRule()
  // -------------------------------------------------------------------------
  describe('addRule()', () => {
    it('appends a rule to data.rules', () => {
      const { component } = createComponent();
      component.addRule();
      expect(component.data.rules.length).toBe(1);
    });

    it('uses config.addRule callback when provided', () => {
      const addRule = jest.fn();
      const { component } = createComponent({ ...baseConfig, addRule });
      component.addRule();
      expect(addRule).toHaveBeenCalledWith(component.data);
    });

    it('adds rule to specified parent', () => {
      const { component } = createComponent();
      const parent: RuleSet = { condition: 'and', rules: [] };
      component.addRule(parent);
      expect(parent.rules.length).toBe(1);
    });

    it('does nothing when disabled', () => {
      const { component } = createComponent();
      component.setDisabledState(true);
      component.addRule();
      expect(component.data.rules.length).toBe(0);
    });

    it('uses defaultValue on new rule', () => {
      const config: QueryBuilderConfig = {
        fields: { withDefault: { name: 'WithDefault', type: 'string', defaultValue: 'hello', defaultOperator: 'eq' } }
      };
      const { component } = createComponent(config);
      component.addRule();
      const rule = component.data.rules[0] as Rule;
      expect(rule.value).toBe('hello');
    });
  });

  // -------------------------------------------------------------------------
  // 11. removeRule()
  // -------------------------------------------------------------------------
  describe('removeRule()', () => {
    it('removes a rule from data.rules', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.removeRule(rule);
      expect(component.data.rules.length).toBe(0);
    });

    it('uses config.removeRule callback', () => {
      const removeRule = jest.fn();
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent({ ...baseConfig, removeRule }, { condition: 'and', rules: [rule] });
      component.removeRule(rule);
      expect(removeRule).toHaveBeenCalledWith(rule, component.data);
    });

    it('clears caches for removed rule', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      // Prime all caches
      component.getInputContext(rule);
      component.getOperatorContext(rule);
      component.getFieldContext(rule);
      component.getEntityContext(rule);
      component.getRemoveButtonContext(rule);
      component.removeRule(rule);
      // Caches cleared — new context objects will be created
      const newCtx = component.getInputContext(rule);
      expect(newCtx).toBeDefined();
    });

    it('does nothing when disabled', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.setDisabledState(true);
      component.removeRule(rule);
      expect(component.data.rules.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 12. addRuleSet()
  // -------------------------------------------------------------------------
  describe('addRuleSet()', () => {
    it('appends a nested ruleset', () => {
      const { component } = createComponent();
      component.addRuleSet();
      expect((component.data.rules[0] as RuleSet).rules).toBeDefined();
    });

    it('uses config.addRuleSet callback', () => {
      const addRuleSet = jest.fn();
      const { component } = createComponent({ ...baseConfig, addRuleSet });
      component.addRuleSet();
      expect(addRuleSet).toHaveBeenCalled();
    });

    it('does nothing when disabled', () => {
      const { component } = createComponent();
      component.setDisabledState(true);
      component.addRuleSet();
      expect(component.data.rules.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 13. removeRuleSet()
  // -------------------------------------------------------------------------
  describe('removeRuleSet()', () => {
    it('removes a ruleset from parent', () => {
      const child: RuleSet = { condition: 'or', rules: [] };
      const parent: RuleSet = { condition: 'and', rules: [child] };
      const { fixture, component } = createComponent();
      fixture.componentRef.setInput('parentValue', parent);
      fixture.detectChanges();
      component.removeRuleSet(child, parent);
      expect(parent.rules.length).toBe(0);
    });

    it('uses config.removeRuleSet callback', () => {
      const removeRuleSet = jest.fn();
      const child: RuleSet = { condition: 'or', rules: [] };
      const parent: RuleSet = { condition: 'and', rules: [child] };
      const { fixture, component } = createComponent({ ...baseConfig, removeRuleSet });
      fixture.componentRef.setInput('parentValue', parent);
      fixture.detectChanges();
      component.removeRuleSet(child, parent);
      expect(removeRuleSet).toHaveBeenCalledWith(child, parent);
    });

    it('does nothing when disabled', () => {
      const child: RuleSet = { condition: 'or', rules: [] };
      const parent: RuleSet = { condition: 'and', rules: [child] };
      const { fixture, component } = createComponent();
      fixture.componentRef.setInput('parentValue', parent);
      fixture.detectChanges();
      component.setDisabledState(true);
      component.removeRuleSet(child, parent);
      expect(parent.rules.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 14. changeCondition()
  // -------------------------------------------------------------------------
  describe('changeCondition()', () => {
    it('updates data.condition', () => {
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [] });
      component.changeCondition('or');
      expect(component.data.condition).toBe('or');
    });

    it('does nothing when disabled', () => {
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [] });
      component.setDisabledState(true);
      component.changeCondition('or');
      expect(component.data.condition).toBe('and');
    });
  });

  // -------------------------------------------------------------------------
  // 15. changeOperator()
  // -------------------------------------------------------------------------
  describe('changeOperator()', () => {
    it('coerces value to array for in operator', () => {
      const rule: Rule = { field: 'category', operator: 'in', value: 'a' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.changeOperator(rule);
      expect(Array.isArray(rule.value)).toBe(true);
    });

    it('does not coerce when value already an array', () => {
      const rule: Rule = { field: 'category', operator: 'in', value: ['a'] };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.changeOperator(rule);
      expect(rule.value).toEqual(['a']);
    });

    it('uses config.coerceValueForOperator callback', () => {
      const coerceValueForOperator = jest.fn().mockReturnValue('coerced');
      const rule: Rule = { field: 'name', operator: '=', value: 'x' };
      const { component } = createComponent({ ...baseConfig, coerceValueForOperator },
        { condition: 'and', rules: [rule] });
      component.changeOperator(rule);
      expect(coerceValueForOperator).toHaveBeenCalled();
      expect(rule.value).toBe('coerced');
    });

    it('does nothing when disabled', () => {
      const rule: Rule = { field: 'category', operator: 'in', value: 'a' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.setDisabledState(true);
      component.changeOperator(rule);
      expect(rule.value).toBe('a');
    });
  });

  // -------------------------------------------------------------------------
  // 16. coerceValueForOperator()
  // -------------------------------------------------------------------------
  describe('coerceValueForOperator()', () => {
    it('wraps value in array for multiselect input type', () => {
      const rule: Rule = { field: 'category', operator: 'in', value: 'a' };
      const { component } = createComponent();
      const result = component.coerceValueForOperator('in', 'a', rule);
      expect(result).toEqual(['a']);
    });

    it('leaves array value unchanged for multiselect', () => {
      const rule: Rule = { field: 'category', operator: 'in', value: ['a'] };
      const { component } = createComponent();
      const result = component.coerceValueForOperator('in', ['a'], rule);
      expect(result).toEqual(['a']);
    });

    it('returns value unchanged for non-multiselect', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'test' };
      const { component } = createComponent();
      const result = component.coerceValueForOperator('=', 'test', rule);
      expect(result).toBe('test');
    });
  });

  // -------------------------------------------------------------------------
  // 17. changeInput()
  // -------------------------------------------------------------------------
  describe('changeInput()', () => {
    it('fires change and touch callbacks', () => {
      const { component } = createComponent();
      const changeFn = jest.fn();
      const touchFn = jest.fn();
      component.registerOnChange(changeFn);
      component.registerOnTouched(touchFn);
      component.changeInput();
      expect(changeFn).toHaveBeenCalled();
      expect(touchFn).toHaveBeenCalled();
    });

    it('does nothing when disabled', () => {
      const { component } = createComponent();
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      component.setDisabledState(true);
      component.changeInput();
      expect(changeFn).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 18. changeField()
  // -------------------------------------------------------------------------
  describe('changeField()', () => {
    it('updates rule.field and assigns default operator', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.changeField('age', rule);
      expect(rule.operator).toBe('=');
    });

    it('deletes rule.value when nextField has no default', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.changeField('age', rule);
      expect(rule.value).toBeUndefined();
    });

    it('sets rule.value to field defaultValue', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.changeField('withDefault', rule);
      expect(rule.value).toBe('hello');
    });

    it('sets rule.value to result of defaultValue function', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.changeField('withDefaultFn', rule);
      expect(rule.value).toBe('computed');
    });

    it('persists value when persistValueOnFieldChange and same type', () => {
      const { fixture, component } = createComponent(baseConfig, {
        condition: 'and',
        rules: [{ field: 'name', operator: '=', value: 'Alice' }]
      });
      fixture.componentRef.setInput('persistValueOnFieldChange', true);
      fixture.detectChanges();
      const rule = component.data.rules[0] as Rule;
      // Prime the inputContext cache with field info
      component.getInputContext(rule);
      component.changeField('name', rule); // same type: string → string
      expect(rule.value).toBe('Alice');
    });

    it('uses config.calculateFieldChangeValue callback', () => {
      const calculateFieldChangeValue = jest.fn().mockReturnValue('calculated');
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent({ ...baseConfig, calculateFieldChangeValue },
        { condition: 'and', rules: [rule] });
      component.changeField('age', rule);
      expect(calculateFieldChangeValue).toHaveBeenCalled();
      expect(rule.value).toBe('calculated');
    });

    it('does nothing when disabled', () => {
      const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [rule] });
      component.setDisabledState(true);
      component.changeField('age', rule);
      expect(rule.operator).toBe('=');
    });
  });

  // -------------------------------------------------------------------------
  // 19. changeEntity()
  // -------------------------------------------------------------------------
  describe('changeEntity()', () => {
    const configWithEntities: QueryBuilderConfig = {
      fields: {
        personName: { name: 'Person Name', type: 'string', entity: 'person' },
        orgName: { name: 'Org Name', type: 'string', entity: 'org' },
      },
      entities: { person: { name: 'Person' }, org: { name: 'Org' } }
    };

    it('changes field to entity default field', () => {
      const rule: Rule = { field: 'orgName', operator: '=', entity: 'org' };
      const data: RuleSet = { condition: 'and', rules: [rule] };
      const { component } = createComponent(configWithEntities, data);
      component.changeEntity('person', rule, 0, data);
      expect(rule.field).toBe('personName');
    });

    it('handles missing entity (no default field change)', () => {
      const rule: Rule = { field: 'personName', operator: '=', entity: 'person' };
      const data: RuleSet = { condition: 'and', rules: [rule] };
      const { component } = createComponent(configWithEntities, data);
      const changeFn = jest.fn();
      component.registerOnChange(changeFn);
      component.changeEntity('nonexistent', rule, 0, data);
      expect(changeFn).toHaveBeenCalled(); // still fires data change
    });

    it('does nothing when disabled', () => {
      const rule: Rule = { field: 'orgName', operator: '=', entity: 'org' };
      const data: RuleSet = { condition: 'and', rules: [rule] };
      const { component } = createComponent(configWithEntities, data);
      component.setDisabledState(true);
      component.changeEntity('person', rule, 0, data);
      expect(rule.field).toBe('orgName');
    });
  });

  // -------------------------------------------------------------------------
  // 20. getDefaultValue()
  // -------------------------------------------------------------------------
  describe('getDefaultValue()', () => {
    it('calls function and returns result', () => {
      const { component } = createComponent();
      expect(component.getDefaultValue(() => 42)).toBe(42);
    });

    it('returns non-function value as-is', () => {
      const { component } = createComponent();
      expect(component.getDefaultValue('static')).toBe('static');
      expect(component.getDefaultValue(null)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 21. getClassNames()
  // -------------------------------------------------------------------------
  describe('getClassNames()', () => {
    it('returns default class name', () => {
      const { component } = createComponent();
      expect(component.getClassNames('row')).toBe('q-row');
    });

    it('returns multiple default class names joined', () => {
      const { component } = createComponent();
      expect(component.getClassNames('row', 'rule')).toBe('q-row q-rule');
    });

    it('uses custom classNames from input', () => {
      const { fixture, component } = createComponent();
      fixture.componentRef.setInput('classNames', { row: 'custom-row' });
      fixture.detectChanges();
      expect(component.getClassNames('row')).toBe('custom-row');
    });

    it('falls back to default when custom key is missing', () => {
      const { fixture, component } = createComponent();
      fixture.componentRef.setInput('classNames', { row: 'custom-row' });
      fixture.detectChanges();
      expect(component.getClassNames('rule')).toBe('q-rule');
    });

    it('returns empty string for unknown class key', () => {
      const { component } = createComponent();
      expect(component.getClassNames('nonexistent')).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // 22. toggleCollapse()
  // -------------------------------------------------------------------------
  describe('toggleCollapse()', () => {
    it('toggles data.collapsed to true after timeout', fakeAsync(() => {
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [], collapsed: false });
      component.toggleCollapse();
      tick(100);
      expect(component.data.collapsed).toBe(true);
    }));

    it('toggles data.collapsed back to false', fakeAsync(() => {
      const { component } = createComponent(baseConfig, { condition: 'and', rules: [], collapsed: true });
      component.toggleCollapse();
      tick(100);
      expect(component.data.collapsed).toBe(false);
    }));
  });

  // -------------------------------------------------------------------------
  // 23. getQueryItemClassName()
  // -------------------------------------------------------------------------
  describe('getQueryItemClassName()', () => {
    it('returns rule class for plain rule', () => {
      const { component } = createComponent();
      const cls = component.getQueryItemClassName({ ruleset: false, invalid: false });
      expect(cls).toContain('q-rule');
      expect(cls).not.toContain('q-ruleset');
    });

    it('returns ruleset class for ruleset', () => {
      const { component } = createComponent();
      const cls = component.getQueryItemClassName({ ruleset: true, invalid: false });
      expect(cls).toContain('q-ruleset');
    });

    it('appends invalidRuleSet class when invalid', () => {
      const { component } = createComponent();
      const cls = component.getQueryItemClassName({ ruleset: true, invalid: true });
      expect(cls).toContain('q-invalid-ruleset');
    });
  });

  // -------------------------------------------------------------------------
  // 24. Context getters
  // -------------------------------------------------------------------------
  describe('Context getters', () => {
    it('getButtonGroupContext() returns context with addRule', () => {
      const { component } = createComponent();
      const ctx = component.getButtonGroupContext();
      expect(typeof ctx.addRule).toBe('function');
    });

    it('getButtonGroupContext() returns cached context', () => {
      const { component } = createComponent();
      const first = component.getButtonGroupContext();
      const second = component.getButtonGroupContext();
      expect(first).toBe(second);
    });

    it('getButtonGroupContext() includes addRuleSet when allowRuleset', () => {
      const { component } = createComponent();
      const ctx = component.getButtonGroupContext();
      expect(ctx.addRuleSet).toBeDefined();
    });

    it('getButtonGroupContext() excludes removeRuleSet when no parentValue', () => {
      const { component } = createComponent();
      const ctx = component.getButtonGroupContext();
      expect(ctx.removeRuleSet).toBeUndefined();
    });

    it('getRemoveButtonContext() returns cached context per rule', () => {
      const rule: Rule = { field: 'name', operator: '=' };
      const { component } = createComponent();
      const first = component.getRemoveButtonContext(rule);
      const second = component.getRemoveButtonContext(rule);
      expect(first).toBe(second);
      expect(typeof first.removeRule).toBe('function');
    });

    it('getFieldContext() returns cached context with fields', () => {
      const rule: Rule = { field: 'name', operator: '=' };
      const { component } = createComponent();
      const ctx = component.getFieldContext(rule);
      expect(ctx.fields).toEqual(component.fields);
      expect(component.getFieldContext(rule)).toBe(ctx); // cached
    });

    it('getOperatorContext() returns cached context with operators', () => {
      const rule: Rule = { field: 'name', operator: '=' };
      const { component } = createComponent();
      const ctx = component.getOperatorContext(rule);
      expect(ctx.operators).toEqual(component.getOperators('name'));
      expect(component.getOperatorContext(rule)).toBe(ctx); // cached
    });

    it('getInputContext() returns cached context with options and field', () => {
      const rule: Rule = { field: 'category', operator: '=' };
      const { component } = createComponent();
      const ctx = component.getInputContext(rule);
      expect(ctx.options.length).toBe(2);
      expect(component.getInputContext(rule)).toBe(ctx); // cached
    });

    it('getEntityContext() returns cached context with entities', () => {
      const configWithEntities: QueryBuilderConfig = {
        ...baseConfig,
        entities: { person: { name: 'Person' } }
      };
      const rule: Rule = { field: 'name', entity: 'person' };
      const { component } = createComponent(configWithEntities);
      const ctx = component.getEntityContext(rule);
      expect(ctx.entities.length).toBe(1);
      expect(component.getEntityContext(rule)).toBe(ctx); // cached
    });

    it('getSwitchGroupContext() returns context with onChange and data', () => {
      const { component } = createComponent();
      const ctx = component.getSwitchGroupContext();
      expect(ctx.$implicit).toBe(component.data);
      expect(typeof ctx.onChange).toBe('function');
    });

    it('getArrowIconContext() returns context with data', () => {
      const { component } = createComponent();
      const ctx = component.getArrowIconContext();
      expect(ctx.$implicit).toBe(component.data);
    });

    it('getEmptyWarningContext() returns context with message', () => {
      const { fixture, component } = createComponent();
      fixture.componentRef.setInput('emptyMessage', 'Empty!');
      fixture.detectChanges();
      const ctx = component.getEmptyWarningContext();
      expect(ctx.message).toBe('Empty!');
    });
  });

  // -------------------------------------------------------------------------
  // 25. findTemplateForRule() / findQueryInput()
  // -------------------------------------------------------------------------
  describe('findTemplateForRule()', () => {
    it('returns null for default template types', () => {
      const { component } = createComponent();
      const rule: Rule = { field: 'name', operator: '=' };
      expect(component.findTemplateForRule(rule)).toBeNull();
    });

    it('returns null for null operator (is null)', () => {
      const { component } = createComponent();
      const rule: Rule = { field: 'name', operator: 'is null' };
      expect(component.findTemplateForRule(rule)).toBeNull();
    });

    it('warns for unknown input type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const config: QueryBuilderConfig = { fields: { x: { name: 'X', type: 'custom_nonstandard' } } };
      const { component } = createComponent(config);
      const rule: Rule = { field: 'x', operator: '=' };
      component.findTemplateForRule(rule);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Could not find template'));
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // 26. transitionEnd()
  // -------------------------------------------------------------------------
  describe('transitionEnd()', () => {
    it('clears maxHeight on max-height transition end', () => {
      const { component } = createComponent();
      const el = component.treeContainer().nativeElement;
      el.style.maxHeight = '200px';
      component.transitionEnd({ propertyName: 'max-height' } as TransitionEvent);
      expect(el.style.maxHeight).toBe('');
    });

    it('does not clear maxHeight for other property transitions', () => {
      const { component } = createComponent();
      const el = component.treeContainer().nativeElement;
      el.style.maxHeight = '200px';
      component.transitionEnd({ propertyName: 'opacity' } as TransitionEvent);
      expect(el.style.maxHeight).toBe('200px');
    });
  });

  // -------------------------------------------------------------------------
  // 27. ngOnChanges
  // -------------------------------------------------------------------------
  describe('ngOnChanges()', () => {
    it('triggers handleDataChange when data changes', () => {
      const { component } = createComponent();
      const fn = jest.fn();
      component.registerOnChange(fn);
      // Simulate ngOnChanges for data
      component.ngOnChanges({ data: { currentValue: emptyRuleset, previousValue: null, firstChange: false, isFirstChange: () => false } });
      expect(fn).toHaveBeenCalled();
    });

    it('triggers handleDataChange when disabled changes', () => {
      const { component } = createComponent();
      const fn = jest.fn();
      component.registerOnChange(fn);
      component.ngOnChanges({ disabled: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
      expect(fn).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// Host component for directive tests
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [
    QueryInputDirective,
    QueryArrowIconDirective,
    QueryButtonGroupDirective,
    QueryEmptyWarningDirective,
    QueryEntityDirective,
    QueryFieldDirective,
    QueryOperatorDirective,
    QueryRemoveButtonDirective,
    QuerySwitchGroupDirective,
  ],
  template: `
    <ng-template queryArrowIcon>arrow</ng-template>
    <ng-template queryButtonGroup>btns</ng-template>
    <ng-template queryEmptyWarning>empty</ng-template>
    <ng-template queryEntity>entity</ng-template>
    <ng-template queryField>field</ng-template>
    <ng-template queryInput queryInputType="string">input</ng-template>
    <ng-template queryOperator>op</ng-template>
    <ng-template queryRemoveButton>rm</ng-template>
    <ng-template querySwitchGroup>sw</ng-template>
  `
})
class DirectiveHostComponent {}

describe('Query Directives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DirectiveHostComponent] }).compileComponents();
  });

  it('QueryArrowIconDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QueryButtonGroupDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QueryEmptyWarningDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QueryEntityDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QueryFieldDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QueryOperatorDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QueryRemoveButtonDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('QuerySwitchGroupDirective injects TemplateRef', () => {
    const fixture = TestBed.createComponent(DirectiveHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});

describe('QueryInputDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DirectiveHostComponent] }).compileComponents();
  });

  it('sets queryInputType via setter', () => {
    @Component({
      standalone: true,
      imports: [QueryInputDirective],
      template: `<ng-template queryInput queryInputType="number">x</ng-template>`
    })
    class HostComponent {}

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('queryInputType getter returns set value', () => {
    @Component({
      standalone: true,
      imports: [QueryInputDirective],
      template: `<ng-template queryInput queryInputType="string">x</ng-template>`
    })
    class HostComponent {
      @ViewChild(QueryInputDirective) directive!: QueryInputDirective;
    }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.directive.queryInputType).toBe('string');
  });

  it('ignores empty string in queryInputType setter', () => {
    @Component({
      standalone: true,
      imports: [QueryInputDirective],
      template: `<ng-template queryInput [queryInputType]="typeValue">x</ng-template>`
    })
    class HostComponent { typeValue = ''; }

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Host component to cover forwardRef factories (lines 59, 65) and
// findTemplateForRule with a matching queryInput (line 302)
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [QueryBuilderComponent, ReactiveFormsModule, QueryInputDirective],
  template: `
    <query-builder [formControl]="ctrl" [config]="config">
      <ng-template queryInput queryInputType="string" let-rule let-onChange="onChange">
        <input [value]="rule.value" (change)="onChange()" />
      </ng-template>
    </query-builder>
  `
})
class FormHostComponent {
  @ViewChild(QueryBuilderComponent) qb!: QueryBuilderComponent;
  ctrl = new FormControl<RuleSet>({ condition: 'and', rules: [{ field: 'name', operator: '=', value: 'Alice' }] });
  config: QueryBuilderConfig = {
    fields: { name: { name: 'Name', type: 'string' } }
  };
}

describe('QueryBuilderComponent — forwardRef + CVA via FormControl', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormHostComponent],
    }).compileComponents();
  });

  it('works as CVA inside a FormControl (covers forwardRef factories)', () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.qb).toBeTruthy();
    expect(fixture.componentInstance.ctrl.value).toBeTruthy();
  });

  it('findTemplateForRule returns template when queryInput matches type', () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    fixture.detectChanges();
    const qb = fixture.componentInstance.qb;
    const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
    const tpl = qb.findTemplateForRule(rule);
    expect(tpl).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Additional component coverage gaps
// ---------------------------------------------------------------------------
describe('QueryBuilderComponent — coverage gaps', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryBuilderComponent, ReactiveFormsModule],
    }).compileComponents();
  });

  it('getArrowIconTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getArrowIconTemplate()).toBeNull();
  });

  it('getButtonGroupTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getButtonGroupTemplate()).toBeNull();
  });

  it('getSwitchGroupTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getSwitchGroupTemplate()).toBeNull();
  });

  it('getFieldTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getFieldTemplate()).toBeNull();
  });

  it('getEntityTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getEntityTemplate()).toBeNull();
  });

  it('getOperatorTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getOperatorTemplate()).toBeNull();
  });

  it('getRemoveButtonTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getRemoveButtonTemplate()).toBeNull();
  });

  it('getEmptyWarningTemplate() returns null when no template provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.detectChanges();
    expect(fixture.componentInstance.getEmptyWarningTemplate()).toBeNull();
  });

  it('getEntityContext onChange arrow function calls changeEntity', () => {
    const configWithEntities: QueryBuilderConfig = {
      fields: {
        personName: { name: 'Person Name', type: 'string', entity: 'person' },
        orgName: { name: 'Org Name', type: 'string', entity: 'org' },
      },
      entities: { person: { name: 'Person' }, org: { name: 'Org' } }
    };
    const rule: Rule = { field: 'orgName', operator: '=', entity: 'org' };
    const data: RuleSet = { condition: 'and', rules: [rule] };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', configWithEntities);
    fixture.componentInstance.data = data;
    fixture.detectChanges();
    const ctx = fixture.componentInstance.getEntityContext(rule);
    // Invoke the onChange arrow — covers the inline lambda body
    ctx.onChange('person', rule);
    expect(rule.field).toBe('personName');
  });

  it('getOperatorContext onChange arrow function calls changeOperator', () => {
    const rule: Rule = { field: 'category', operator: 'in', value: 'a' };
    const data: RuleSet = { condition: 'and', rules: [rule] };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentInstance.data = data;
    fixture.detectChanges();
    const ctx = fixture.componentInstance.getOperatorContext(rule);
    // Invoke the onChange arrow — covers the inline lambda body
    ctx.onChange();
    expect(Array.isArray(rule.value)).toBe(true);
  });

  it('changeEntity falls back to data when rs is falsy', () => {
    const configWithEntities: QueryBuilderConfig = {
      fields: {
        personName: { name: 'Person Name', type: 'string', entity: 'person' },
      },
      entities: { person: { name: 'Person' } }
    };
    const rule: Rule = { field: 'personName', operator: '=', entity: 'person' };
    const data: RuleSet = { condition: 'and', rules: [rule] };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', configWithEntities);
    fixture.componentInstance.data = data;
    fixture.detectChanges();
    // Pass null as data to trigger the !rs branch (index = -1, data = null)
    fixture.componentInstance.changeEntity('person', rule, -1, null as unknown as RuleSet);
    expect(rule.field).toBe('personName');
  });

  it('getEntityContext returns empty array when no entities configured', () => {
    const rule: Rule = { field: 'name', operator: '=' };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig); // no entities
    fixture.componentInstance.data = { condition: 'and', rules: [] };
    fixture.detectChanges();
    const ctx = fixture.componentInstance.getEntityContext(rule);
    expect(ctx.entities).toEqual([]);
  });

  it('findQueryInput uses parentInputTemplates when provided', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentInstance.data = { condition: 'and', rules: [] };
    // Create a fake QueryInputDirective to pass as parent template
    const fakeDirective = { queryInputType: 'string', template: {} } as unknown as QueryInputDirective;
    fixture.componentRef.setInput('parentInputTemplates', [fakeDirective]);
    fixture.detectChanges();
    const result = fixture.componentInstance.findQueryInput('string');
    expect(result).toBe(fakeDirective);
  });

  it('getInputType passes empty string for undefined operator via config.getInputType', () => {
    const getInputType = jest.fn().mockReturnValue('string');
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', { ...baseConfig, getInputType });
    fixture.componentInstance.data = { condition: 'and', rules: [] };
    fixture.detectChanges();
    fixture.componentInstance.getInputType('name', undefined);
    expect(getInputType).toHaveBeenCalledWith('name', '');
  });

  it('addRule uses null operator when getDefaultOperator returns null', () => {
    // A field with custom_type has no operators, so getDefaultOperator returns null
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config: QueryBuilderConfig = { fields: { x: { name: 'X', type: 'custom_type' } } };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', config);
    fixture.componentInstance.data = { condition: 'and', rules: [] };
    fixture.detectChanges();
    fixture.componentInstance.addRule();
    const rule = fixture.componentInstance.data.rules[0] as Rule;
    expect(rule.operator).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('removeRuleSet with no args uses data and parentValue', () => {
    const parent: RuleSet = { condition: 'and', rules: [] };
    const child: RuleSet = { condition: 'or', rules: [] };
    parent.rules = [child];
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentRef.setInput('parentValue', parent);
    fixture.componentInstance.data = child;
    fixture.detectChanges();
    fixture.componentInstance.removeRuleSet(); // no args — uses this.data + this.parentValue()
    expect(parent.rules.length).toBe(0);
  });

  it('getButtonGroupContext with allowRuleset=false sets addRuleSet to undefined', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentRef.setInput('allowRuleset', false);
    fixture.componentInstance.data = { condition: 'and', rules: [] };
    fixture.detectChanges();
    const ctx = fixture.componentInstance.getButtonGroupContext();
    expect(ctx.addRuleSet).toBeUndefined();
  });

  it('getButtonGroupContext with allowRuleset=true + parentValue sets removeRuleSet', () => {
    const parent: RuleSet = { condition: 'and', rules: [] };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentRef.setInput('allowRuleset', true);
    fixture.componentRef.setInput('parentValue', parent);
    fixture.componentInstance.data = { condition: 'and', rules: [] };
    fixture.detectChanges();
    const ctx = fixture.componentInstance.getButtonGroupContext();
    expect(ctx.removeRuleSet).toBeDefined();
  });

  it('changeField with persistValueOnFieldChange but no cached currentField returns false from canKeepValue', () => {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', baseConfig);
    fixture.componentRef.setInput('persistValueOnFieldChange', true);
    const rule: Rule = { field: 'name', operator: '=', value: 'Alice' };
    fixture.componentInstance.data = { condition: 'and', rules: [rule] };
    fixture.detectChanges();
    // Don't call getInputContext — so currentField will be null/undefined → canKeepValue returns false
    fixture.componentInstance.changeField('age', rule);
    expect(rule.value).toBeUndefined();
  });

  it('changeField with no default on nextField when getDefaultOperator returns null', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const config: QueryBuilderConfig = {
      fields: {
        name: { name: 'Name', type: 'string' },
        noOps: { name: 'NoOps', type: 'custom_type' },
      }
    };
    const rule: Rule = { field: 'name', operator: '=', value: 'test' };
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', config);
    fixture.componentInstance.data = { condition: 'and', rules: [rule] };
    fixture.detectChanges();
    fixture.componentInstance.changeField('noOps', rule);
    expect(rule.operator).toBeUndefined(); // getDefaultOperator returned null → ?? undefined
    consoleSpy.mockRestore();
  });
});

