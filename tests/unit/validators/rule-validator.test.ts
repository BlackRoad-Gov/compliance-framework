import { describe, it, expect, beforeEach } from 'vitest';
import { RuleValidator } from '../../../src/validators/rule-validator.js';
import type { ComplianceRule, RuleCondition } from '../../../src/types/index.js';

describe('RuleValidator', () => {
  let validator: RuleValidator;

  beforeEach(() => {
    validator = new RuleValidator();
  });

  describe('evaluateCondition', () => {
    describe('equals operator', () => {
      it('should return true when field value equals condition value', () => {
        const condition: RuleCondition = {
          field: 'status',
          operator: 'equals',
          value: 'active',
        };
        const data = { status: 'active' };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when field value does not equal condition value', () => {
        const condition: RuleCondition = {
          field: 'status',
          operator: 'equals',
          value: 'active',
        };
        const data = { status: 'inactive' };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });

      it('should handle numeric equality', () => {
        const condition: RuleCondition = {
          field: 'count',
          operator: 'equals',
          value: 10,
        };

        expect(validator.evaluateCondition(condition, { count: 10 })).toBe(true);
        expect(validator.evaluateCondition(condition, { count: 5 })).toBe(false);
      });

      it('should handle boolean equality', () => {
        const condition: RuleCondition = {
          field: 'enabled',
          operator: 'equals',
          value: true,
        };

        expect(validator.evaluateCondition(condition, { enabled: true })).toBe(true);
        expect(validator.evaluateCondition(condition, { enabled: false })).toBe(false);
      });
    });

    describe('notEquals operator', () => {
      it('should return true when field value does not equal condition value', () => {
        const condition: RuleCondition = {
          field: 'status',
          operator: 'notEquals',
          value: 'deleted',
        };
        const data = { status: 'active' };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when field value equals condition value', () => {
        const condition: RuleCondition = {
          field: 'status',
          operator: 'notEquals',
          value: 'active',
        };
        const data = { status: 'active' };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should return true when string field contains value', () => {
        const condition: RuleCondition = {
          field: 'email',
          operator: 'contains',
          value: '@company.com',
        };
        const data = { email: 'user@company.com' };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when string field does not contain value', () => {
        const condition: RuleCondition = {
          field: 'email',
          operator: 'contains',
          value: '@company.com',
        };
        const data = { email: 'user@external.com' };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });

      it('should return false for non-string fields', () => {
        const condition: RuleCondition = {
          field: 'count',
          operator: 'contains',
          value: '5',
        };
        const data = { count: 50 };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });
    });

    describe('notContains operator', () => {
      it('should return true when string field does not contain value', () => {
        const condition: RuleCondition = {
          field: 'password',
          operator: 'notContains',
          value: 'password',
        };
        const data = { password: 'secureP@ss123' };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when string field contains value', () => {
        const condition: RuleCondition = {
          field: 'password',
          operator: 'notContains',
          value: 'password',
        };
        const data = { password: 'mypassword123' };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });
    });

    describe('greaterThan operator', () => {
      it('should return true when field value is greater than condition value', () => {
        const condition: RuleCondition = {
          field: 'age',
          operator: 'greaterThan',
          value: 18,
        };
        const data = { age: 25 };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when field value is not greater than condition value', () => {
        const condition: RuleCondition = {
          field: 'age',
          operator: 'greaterThan',
          value: 18,
        };

        expect(validator.evaluateCondition(condition, { age: 18 })).toBe(false);
        expect(validator.evaluateCondition(condition, { age: 15 })).toBe(false);
      });

      it('should return false for non-numeric fields', () => {
        const condition: RuleCondition = {
          field: 'name',
          operator: 'greaterThan',
          value: 10,
        };
        const data = { name: 'John' };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });
    });

    describe('lessThan operator', () => {
      it('should return true when field value is less than condition value', () => {
        const condition: RuleCondition = {
          field: 'retries',
          operator: 'lessThan',
          value: 5,
        };
        const data = { retries: 3 };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when field value is not less than condition value', () => {
        const condition: RuleCondition = {
          field: 'retries',
          operator: 'lessThan',
          value: 5,
        };

        expect(validator.evaluateCondition(condition, { retries: 5 })).toBe(false);
        expect(validator.evaluateCondition(condition, { retries: 10 })).toBe(false);
      });
    });

    describe('matches operator', () => {
      it('should return true when field matches regex pattern', () => {
        const condition: RuleCondition = {
          field: 'email',
          operator: 'matches',
          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        };
        const data = { email: 'user@example.com' };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return false when field does not match regex pattern', () => {
        const condition: RuleCondition = {
          field: 'email',
          operator: 'matches',
          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        };
        const data = { email: 'invalid-email' };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });

      it('should return false for non-string fields', () => {
        const condition: RuleCondition = {
          field: 'count',
          operator: 'matches',
          value: /\d+/,
        };
        const data = { count: 123 };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });
    });

    describe('nested field access', () => {
      it('should access nested fields using dot notation', () => {
        const condition: RuleCondition = {
          field: 'user.profile.role',
          operator: 'equals',
          value: 'admin',
        };
        const data = {
          user: {
            profile: {
              role: 'admin',
            },
          },
        };

        expect(validator.evaluateCondition(condition, data)).toBe(true);
      });

      it('should return undefined for non-existent nested fields', () => {
        const condition: RuleCondition = {
          field: 'user.profile.role',
          operator: 'equals',
          value: 'admin',
        };
        const data = { user: {} };

        expect(validator.evaluateCondition(condition, data)).toBe(false);
      });
    });
  });

  describe('validateRule', () => {
    const createRule = (overrides: Partial<ComplianceRule> = {}): ComplianceRule => ({
      id: 'rule-1',
      name: 'Test Rule',
      description: 'A test rule',
      severity: 'high',
      category: 'security',
      enabled: true,
      conditions: [],
      ...overrides,
    });

    it('should return passed result for disabled rules', () => {
      const rule = createRule({ enabled: false });
      const data = { any: 'data' };

      const result = validator.validateRule(rule, data);

      expect(result.passed).toBe(true);
      expect(result.message).toBe('Rule is disabled');
    });

    it('should return passed when all conditions pass', () => {
      const rule = createRule({
        conditions: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'count', operator: 'greaterThan', value: 0 },
        ],
      });
      const data = { status: 'active', count: 5 };

      const result = validator.validateRule(rule, data);

      expect(result.passed).toBe(true);
      expect(result.ruleId).toBe('rule-1');
      expect(result.ruleName).toBe('Test Rule');
      expect(result.severity).toBe('high');
    });

    it('should return failed when any condition fails', () => {
      const rule = createRule({
        conditions: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'count', operator: 'greaterThan', value: 10 },
        ],
      });
      const data = { status: 'active', count: 5 };

      const result = validator.validateRule(rule, data);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should pass when rule has no conditions', () => {
      const rule = createRule({ conditions: [] });
      const data = { any: 'data' };

      const result = validator.validateRule(rule, data);

      expect(result.passed).toBe(true);
    });
  });
});
