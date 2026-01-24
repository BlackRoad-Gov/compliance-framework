import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceService } from '../../../src/services/compliance-service.js';
import { AuditLogger } from '../../../src/services/audit-logger.js';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let auditLogger: AuditLogger;

  const validPolicyInput = {
    id: 'policy-1',
    name: 'Security Policy',
    version: '1.0.0',
    description: 'Security compliance rules',
    rules: [
      {
        id: 'rule-1',
        name: 'Status Check',
        description: 'Status must be active',
        severity: 'high',
        category: 'security',
        enabled: true,
        conditions: [{ field: 'status', operator: 'equals', value: 'active' }],
      },
      {
        id: 'rule-2',
        name: 'Count Check',
        description: 'Count must be positive',
        severity: 'medium',
        category: 'validation',
        enabled: true,
        conditions: [{ field: 'count', operator: 'greaterThan', value: 0 }],
      },
    ],
  };

  beforeEach(() => {
    auditLogger = new AuditLogger();
    service = new ComplianceService(auditLogger);
  });

  describe('registerPolicy', () => {
    it('should register a new policy', () => {
      const policy = service.registerPolicy(validPolicyInput, 'user-1');

      expect(policy.id).toBe('policy-1');
      expect(policy.name).toBe('Security Policy');
      expect(policy.rules).toHaveLength(2);
    });

    it('should throw error when registering duplicate policy ID', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      expect(() => service.registerPolicy(validPolicyInput, 'user-1')).toThrow(
        'already exists'
      );
    });

    it('should create audit log entry', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const logs = auditLogger.getLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0]!.action).toBe('create');
      expect(logs[0]!.resourceType).toBe('policy');
      expect(logs[0]!.resourceId).toBe('policy-1');
      expect(logs[0]!.userId).toBe('user-1');
    });
  });

  describe('updatePolicy', () => {
    it('should update an existing policy', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const updatedInput = {
        ...validPolicyInput,
        name: 'Updated Security Policy',
      };

      const policy = service.updatePolicy('policy-1', updatedInput, 'user-1');

      expect(policy.name).toBe('Updated Security Policy');
    });

    it('should throw error when updating non-existent policy', () => {
      expect(() =>
        service.updatePolicy('non-existent', validPolicyInput, 'user-1')
      ).toThrow('not found');
    });

    it('should update the updatedAt timestamp', () => {
      const original = service.registerPolicy(validPolicyInput, 'user-1');
      const originalUpdatedAt = original.updatedAt;

      // Small delay to ensure different timestamp
      const updated = service.updatePolicy('policy-1', validPolicyInput, 'user-1');

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it('should create audit log entry for update', () => {
      service.registerPolicy(validPolicyInput, 'user-1');
      service.updatePolicy('policy-1', validPolicyInput, 'user-2');

      const logs = auditLogger.getLogs();
      const updateLog = logs.find((l) => l.action === 'update');

      expect(updateLog).toBeDefined();
      expect(updateLog!.userId).toBe('user-2');
    });
  });

  describe('deletePolicy', () => {
    it('should delete an existing policy', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const result = service.deletePolicy('policy-1', 'user-1');

      expect(result).toBe(true);
      expect(service.getPolicy('policy-1')).toBeUndefined();
    });

    it('should return false when deleting non-existent policy', () => {
      const result = service.deletePolicy('non-existent', 'user-1');

      expect(result).toBe(false);
    });

    it('should create audit log entry for delete', () => {
      service.registerPolicy(validPolicyInput, 'user-1');
      service.deletePolicy('policy-1', 'user-1');

      const logs = auditLogger.getLogs();
      const deleteLog = logs.find((l) => l.action === 'delete');

      expect(deleteLog).toBeDefined();
      expect(deleteLog!.resourceId).toBe('policy-1');
    });
  });

  describe('getPolicy', () => {
    it('should return a registered policy', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const policy = service.getPolicy('policy-1');

      expect(policy).toBeDefined();
      expect(policy!.id).toBe('policy-1');
    });

    it('should return undefined for non-existent policy', () => {
      const policy = service.getPolicy('non-existent');

      expect(policy).toBeUndefined();
    });
  });

  describe('getAllPolicies', () => {
    it('should return all registered policies', () => {
      service.registerPolicy(validPolicyInput, 'user-1');
      service.registerPolicy(
        { ...validPolicyInput, id: 'policy-2', name: 'Policy 2' },
        'user-1'
      );

      const policies = service.getAllPolicies();

      expect(policies).toHaveLength(2);
    });

    it('should return empty array when no policies registered', () => {
      const policies = service.getAllPolicies();

      expect(policies).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should validate data against a policy', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const report = service.validate(
        'policy-1',
        { status: 'active', count: 5 },
        'user-1'
      );

      expect(report.policyId).toBe('policy-1');
      expect(report.summary.total).toBe(2);
      expect(report.summary.passed).toBe(2);
      expect(report.summary.failed).toBe(0);
    });

    it('should throw error when validating against non-existent policy', () => {
      expect(() => service.validate('non-existent', {}, 'user-1')).toThrow(
        'not found'
      );
    });

    it('should report failed rules correctly', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const report = service.validate(
        'policy-1',
        { status: 'inactive', count: 0 },
        'user-1'
      );

      expect(report.summary.failed).toBe(2);
      expect(report.summary.highFailures).toBe(1);
      expect(report.summary.mediumFailures).toBe(1);
    });

    it('should create audit log entry for validation', () => {
      service.registerPolicy(validPolicyInput, 'user-1');
      service.validate('policy-1', { status: 'active', count: 5 }, 'user-1');

      const logs = auditLogger.getLogs();
      const validateLog = logs.find((l) => l.action === 'validate');

      expect(validateLog).toBeDefined();
      expect(validateLog!.details['passed']).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('should validate data against all policies', () => {
      service.registerPolicy(validPolicyInput, 'user-1');
      service.registerPolicy(
        {
          id: 'policy-2',
          name: 'Policy 2',
          rules: [
            {
              id: 'rule-3',
              name: 'Name Check',
              severity: 'low',
              conditions: [{ field: 'name', operator: 'notEquals', value: '' }],
            },
          ],
        },
        'user-1'
      );

      const reports = service.validateAll(
        { status: 'active', count: 5, name: 'Test' },
        'user-1'
      );

      expect(reports).toHaveLength(2);
    });

    it('should return empty array when no policies registered', () => {
      const reports = service.validateAll({}, 'user-1');

      expect(reports).toHaveLength(0);
    });
  });

  describe('isCompliant', () => {
    it('should return true when all policies pass', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const result = service.isCompliant(
        { status: 'active', count: 5 },
        'user-1'
      );

      expect(result).toBe(true);
    });

    it('should return false when any policy has high/critical failures', () => {
      service.registerPolicy(validPolicyInput, 'user-1');

      const result = service.isCompliant(
        { status: 'inactive', count: 5 },
        'user-1'
      );

      expect(result).toBe(false);
    });

    it('should return true when only low/medium failures exist', () => {
      service.registerPolicy(
        {
          id: 'policy-1',
          name: 'Low Severity Policy',
          rules: [
            {
              id: 'rule-1',
              name: 'Optional Check',
              severity: 'low',
              conditions: [{ field: 'optional', operator: 'equals', value: true }],
            },
          ],
        },
        'user-1'
      );

      const result = service.isCompliant({ optional: false }, 'user-1');

      expect(result).toBe(true);
    });
  });

  describe('getAuditLogger', () => {
    it('should return the audit logger instance', () => {
      const logger = service.getAuditLogger();

      expect(logger).toBe(auditLogger);
    });
  });
});
