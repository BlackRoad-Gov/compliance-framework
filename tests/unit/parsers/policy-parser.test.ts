import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyParser } from '../../../src/parsers/policy-parser.js';

describe('PolicyParser', () => {
  let parser: PolicyParser;

  beforeEach(() => {
    parser = new PolicyParser();
  });

  describe('parsePolicy', () => {
    it('should parse a valid policy object', () => {
      const input = {
        id: 'policy-1',
        name: 'Security Policy',
        version: '2.0.0',
        description: 'Security compliance rules',
        rules: [
          {
            id: 'rule-1',
            name: 'Password Length',
            description: 'Password must be at least 8 characters',
            severity: 'high',
            category: 'authentication',
            enabled: true,
            conditions: [
              { field: 'password.length', operator: 'greaterThan', value: 7 },
            ],
          },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      };

      const policy = parser.parsePolicy(input);

      expect(policy.id).toBe('policy-1');
      expect(policy.name).toBe('Security Policy');
      expect(policy.version).toBe('2.0.0');
      expect(policy.description).toBe('Security compliance rules');
      expect(policy.rules).toHaveLength(1);
      expect(policy.rules[0]!.id).toBe('rule-1');
      expect(policy.createdAt).toBeInstanceOf(Date);
      expect(policy.updatedAt).toBeInstanceOf(Date);
    });

    it('should apply default values for optional fields', () => {
      const input = {
        id: 'policy-1',
        name: 'Minimal Policy',
        rules: [],
      };

      const policy = parser.parsePolicy(input);

      expect(policy.version).toBe('1.0.0');
      expect(policy.description).toBe('');
      expect(policy.createdAt).toBeInstanceOf(Date);
      expect(policy.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for missing required fields', () => {
      expect(() => parser.parsePolicy({})).toThrow('Invalid policy format');
      expect(() => parser.parsePolicy({ id: 'test' })).toThrow('Invalid policy format');
      expect(() => parser.parsePolicy({ name: 'test' })).toThrow('Invalid policy format');
      expect(() => parser.parsePolicy({ id: 'test', name: 'test' })).toThrow('Invalid policy format');
    });

    it('should throw error for non-object input', () => {
      expect(() => parser.parsePolicy(null)).toThrow('Invalid policy format');
      expect(() => parser.parsePolicy('string')).toThrow('Invalid policy format');
      expect(() => parser.parsePolicy(123)).toThrow('Invalid policy format');
    });

    it('should parse rules with default severity', () => {
      const input = {
        id: 'policy-1',
        name: 'Test Policy',
        rules: [
          {
            id: 'rule-1',
            name: 'Rule without severity',
          },
        ],
      };

      const policy = parser.parsePolicy(input);

      expect(policy.rules[0]!.severity).toBe('medium');
    });

    it('should parse rules with enabled defaulting to true', () => {
      const input = {
        id: 'policy-1',
        name: 'Test Policy',
        rules: [
          {
            id: 'rule-1',
            name: 'Rule without enabled flag',
          },
        ],
      };

      const policy = parser.parsePolicy(input);

      expect(policy.rules[0]!.enabled).toBe(true);
    });

    it('should respect explicit enabled: false', () => {
      const input = {
        id: 'policy-1',
        name: 'Test Policy',
        rules: [
          {
            id: 'rule-1',
            name: 'Disabled rule',
            enabled: false,
          },
        ],
      };

      const policy = parser.parsePolicy(input);

      expect(policy.rules[0]!.enabled).toBe(false);
    });

    it('should validate severity values', () => {
      const input = {
        id: 'policy-1',
        name: 'Test Policy',
        rules: [
          { id: 'rule-1', name: 'Critical', severity: 'critical' },
          { id: 'rule-2', name: 'High', severity: 'high' },
          { id: 'rule-3', name: 'Medium', severity: 'medium' },
          { id: 'rule-4', name: 'Low', severity: 'low' },
          { id: 'rule-5', name: 'Invalid', severity: 'invalid' },
        ],
      };

      const policy = parser.parsePolicy(input);

      expect(policy.rules[0]!.severity).toBe('critical');
      expect(policy.rules[1]!.severity).toBe('high');
      expect(policy.rules[2]!.severity).toBe('medium');
      expect(policy.rules[3]!.severity).toBe('low');
      expect(policy.rules[4]!.severity).toBe('medium'); // Default for invalid
    });

    it('should parse conditions correctly', () => {
      const input = {
        id: 'policy-1',
        name: 'Test Policy',
        rules: [
          {
            id: 'rule-1',
            name: 'Multi-condition rule',
            conditions: [
              { field: 'status', operator: 'equals', value: 'active' },
              { field: 'count', operator: 'greaterThan', value: 10 },
              { field: 'name', operator: 'contains', value: 'test' },
            ],
          },
        ],
      };

      const policy = parser.parsePolicy(input);
      const conditions = policy.rules[0]!.conditions;

      expect(conditions).toHaveLength(3);
      expect(conditions[0]).toEqual({ field: 'status', operator: 'equals', value: 'active' });
      expect(conditions[1]).toEqual({ field: 'count', operator: 'greaterThan', value: 10 });
      expect(conditions[2]).toEqual({ field: 'name', operator: 'contains', value: 'test' });
    });

    it('should default invalid operators to equals', () => {
      const input = {
        id: 'policy-1',
        name: 'Test Policy',
        rules: [
          {
            id: 'rule-1',
            name: 'Invalid operator rule',
            conditions: [
              { field: 'status', operator: 'invalidOp', value: 'active' },
            ],
          },
        ],
      };

      const policy = parser.parsePolicy(input);

      expect(policy.rules[0]!.conditions[0]!.operator).toBe('equals');
    });
  });

  describe('parsePolicies', () => {
    it('should parse an array of policies', () => {
      const input = [
        { id: 'policy-1', name: 'Policy 1', rules: [] },
        { id: 'policy-2', name: 'Policy 2', rules: [] },
      ];

      const policies = parser.parsePolicies(input);

      expect(policies).toHaveLength(2);
      expect(policies[0]!.id).toBe('policy-1');
      expect(policies[1]!.id).toBe('policy-2');
    });

    it('should throw error for non-array input', () => {
      expect(() => parser.parsePolicies({})).toThrow('expected an array');
      expect(() => parser.parsePolicies('string')).toThrow('expected an array');
    });

    it('should include index in error message for invalid policy', () => {
      const input = [
        { id: 'policy-1', name: 'Policy 1', rules: [] },
        { invalid: 'policy' },
      ];

      expect(() => parser.parsePolicies(input)).toThrow('index 1');
    });
  });
});
