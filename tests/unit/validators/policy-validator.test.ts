import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyValidator } from '../../../src/validators/policy-validator.js';
import type { CompliancePolicy, ComplianceReport } from '../../../src/types/index.js';

describe('PolicyValidator', () => {
  let validator: PolicyValidator;

  const createPolicy = (overrides: Partial<CompliancePolicy> = {}): CompliancePolicy => ({
    id: 'policy-1',
    name: 'Test Policy',
    version: '1.0.0',
    description: 'A test policy',
    rules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    validator = new PolicyValidator();
  });

  describe('validatePolicy', () => {
    it('should validate data against all rules in a policy', () => {
      const policy = createPolicy({
        rules: [
          {
            id: 'rule-1',
            name: 'Status Check',
            description: 'Ensure status is active',
            severity: 'high',
            category: 'general',
            enabled: true,
            conditions: [{ field: 'status', operator: 'equals', value: 'active' }],
          },
          {
            id: 'rule-2',
            name: 'Count Check',
            description: 'Ensure count is positive',
            severity: 'medium',
            category: 'general',
            enabled: true,
            conditions: [{ field: 'count', operator: 'greaterThan', value: 0 }],
          },
        ],
      });

      const data = { status: 'active', count: 5 };
      const report = validator.validatePolicy(policy, data);

      expect(report.policyId).toBe('policy-1');
      expect(report.policyName).toBe('Test Policy');
      expect(report.results).toHaveLength(2);
      expect(report.results.every((r) => r.passed)).toBe(true);
    });

    it('should return correct summary statistics', () => {
      const policy = createPolicy({
        rules: [
          {
            id: 'rule-1',
            name: 'Rule 1',
            description: '',
            severity: 'critical',
            category: 'security',
            enabled: true,
            conditions: [{ field: 'a', operator: 'equals', value: 1 }],
          },
          {
            id: 'rule-2',
            name: 'Rule 2',
            description: '',
            severity: 'high',
            category: 'security',
            enabled: true,
            conditions: [{ field: 'b', operator: 'equals', value: 2 }],
          },
          {
            id: 'rule-3',
            name: 'Rule 3',
            description: '',
            severity: 'medium',
            category: 'general',
            enabled: true,
            conditions: [{ field: 'c', operator: 'equals', value: 3 }],
          },
          {
            id: 'rule-4',
            name: 'Rule 4',
            description: '',
            severity: 'low',
            category: 'general',
            enabled: true,
            conditions: [{ field: 'd', operator: 'equals', value: 4 }],
          },
        ],
      });

      const data = { a: 1, b: 0, c: 0, d: 4 }; // rule-1 and rule-4 pass
      const report = validator.validatePolicy(policy, data);

      expect(report.summary.total).toBe(4);
      expect(report.summary.passed).toBe(2);
      expect(report.summary.failed).toBe(2);
      expect(report.summary.criticalFailures).toBe(0);
      expect(report.summary.highFailures).toBe(1);
      expect(report.summary.mediumFailures).toBe(1);
      expect(report.summary.lowFailures).toBe(0);
    });

    it('should include timestamp in report', () => {
      const policy = createPolicy();
      const before = new Date();

      const report = validator.validatePolicy(policy, {});

      const after = new Date();
      expect(report.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(report.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should handle empty policy with no rules', () => {
      const policy = createPolicy({ rules: [] });
      const report = validator.validatePolicy(policy, {});

      expect(report.results).toHaveLength(0);
      expect(report.summary.total).toBe(0);
      expect(report.summary.passed).toBe(0);
      expect(report.summary.failed).toBe(0);
    });
  });

  describe('isPolicyPassing', () => {
    it('should return true when no critical or high failures', () => {
      const report: ComplianceReport = {
        policyId: 'policy-1',
        policyName: 'Test',
        timestamp: new Date(),
        results: [],
        summary: {
          total: 5,
          passed: 3,
          failed: 2,
          criticalFailures: 0,
          highFailures: 0,
          mediumFailures: 1,
          lowFailures: 1,
        },
      };

      expect(validator.isPolicyPassing(report)).toBe(true);
    });

    it('should return false when there are critical failures', () => {
      const report: ComplianceReport = {
        policyId: 'policy-1',
        policyName: 'Test',
        timestamp: new Date(),
        results: [],
        summary: {
          total: 5,
          passed: 4,
          failed: 1,
          criticalFailures: 1,
          highFailures: 0,
          mediumFailures: 0,
          lowFailures: 0,
        },
      };

      expect(validator.isPolicyPassing(report)).toBe(false);
    });

    it('should return false when there are high severity failures', () => {
      const report: ComplianceReport = {
        policyId: 'policy-1',
        policyName: 'Test',
        timestamp: new Date(),
        results: [],
        summary: {
          total: 5,
          passed: 4,
          failed: 1,
          criticalFailures: 0,
          highFailures: 1,
          mediumFailures: 0,
          lowFailures: 0,
        },
      };

      expect(validator.isPolicyPassing(report)).toBe(false);
    });
  });

  describe('getFailedRules', () => {
    it('should return only failed validation results', () => {
      const report: ComplianceReport = {
        policyId: 'policy-1',
        policyName: 'Test',
        timestamp: new Date(),
        results: [
          { ruleId: 'rule-1', ruleName: 'Rule 1', passed: true, severity: 'high', message: 'Passed' },
          { ruleId: 'rule-2', ruleName: 'Rule 2', passed: false, severity: 'high', message: 'Failed' },
          { ruleId: 'rule-3', ruleName: 'Rule 3', passed: true, severity: 'medium', message: 'Passed' },
          { ruleId: 'rule-4', ruleName: 'Rule 4', passed: false, severity: 'low', message: 'Failed' },
        ],
        summary: {
          total: 4,
          passed: 2,
          failed: 2,
          criticalFailures: 0,
          highFailures: 1,
          mediumFailures: 0,
          lowFailures: 1,
        },
      };

      const failed = validator.getFailedRules(report);

      expect(failed).toHaveLength(2);
      expect(failed.map((r) => r.ruleId)).toEqual(['rule-2', 'rule-4']);
    });

    it('should return empty array when all rules pass', () => {
      const report: ComplianceReport = {
        policyId: 'policy-1',
        policyName: 'Test',
        timestamp: new Date(),
        results: [
          { ruleId: 'rule-1', ruleName: 'Rule 1', passed: true, severity: 'high', message: 'Passed' },
        ],
        summary: {
          total: 1,
          passed: 1,
          failed: 0,
          criticalFailures: 0,
          highFailures: 0,
          mediumFailures: 0,
          lowFailures: 0,
        },
      };

      const failed = validator.getFailedRules(report);

      expect(failed).toHaveLength(0);
    });
  });
});
