import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceService } from '../../src/services/compliance-service.js';
import { AuditLogger } from '../../src/services/audit-logger.js';

/**
 * Integration tests for complete compliance workflows
 */
describe('Compliance Workflow Integration', () => {
  let service: ComplianceService;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    service = new ComplianceService(auditLogger);
  });

  describe('Complete compliance check workflow', () => {
    it('should validate a user record against security policies', () => {
      // Register security policy
      service.registerPolicy(
        {
          id: 'security-policy',
          name: 'User Security Policy',
          version: '1.0.0',
          rules: [
            {
              id: 'password-length',
              name: 'Password Length',
              description: 'Password must be at least 8 characters',
              severity: 'critical',
              category: 'authentication',
              conditions: [
                { field: 'passwordLength', operator: 'greaterThan', value: 7 },
              ],
            },
            {
              id: 'mfa-enabled',
              name: 'MFA Enabled',
              description: 'Multi-factor authentication must be enabled',
              severity: 'high',
              category: 'authentication',
              conditions: [{ field: 'mfaEnabled', operator: 'equals', value: true }],
            },
            {
              id: 'account-locked',
              name: 'Account Not Locked',
              description: 'Account must not be locked',
              severity: 'medium',
              category: 'access',
              conditions: [{ field: 'locked', operator: 'equals', value: false }],
            },
          ],
        },
        'admin'
      );

      // Test compliant user
      const compliantUser = {
        id: 'user-1',
        email: 'user@company.com',
        passwordLength: 12,
        mfaEnabled: true,
        locked: false,
      };

      const compliantReport = service.validate('security-policy', compliantUser, 'admin');
      expect(compliantReport.summary.passed).toBe(3);
      expect(compliantReport.summary.failed).toBe(0);
      expect(service.isCompliant(compliantUser, 'admin')).toBe(true);

      // Test non-compliant user
      const nonCompliantUser = {
        id: 'user-2',
        email: 'weak@company.com',
        passwordLength: 5,
        mfaEnabled: false,
        locked: false,
      };

      const nonCompliantReport = service.validate('security-policy', nonCompliantUser, 'admin');
      expect(nonCompliantReport.summary.failed).toBe(2);
      expect(nonCompliantReport.summary.criticalFailures).toBe(1);
      expect(nonCompliantReport.summary.highFailures).toBe(1);
      expect(service.isCompliant(nonCompliantUser, 'admin')).toBe(false);
    });

    it('should track all compliance operations in audit log', () => {
      // Register policy
      service.registerPolicy(
        {
          id: 'audit-test-policy',
          name: 'Audit Test Policy',
          rules: [
            {
              id: 'rule-1',
              name: 'Test Rule',
              severity: 'low',
              conditions: [{ field: 'value', operator: 'equals', value: true }],
            },
          ],
        },
        'admin-1'
      );

      // Perform validations
      service.validate('audit-test-policy', { value: true }, 'user-1');
      service.validate('audit-test-policy', { value: false }, 'user-2');

      // Update policy
      service.updatePolicy(
        'audit-test-policy',
        {
          id: 'audit-test-policy',
          name: 'Updated Policy',
          rules: [],
        },
        'admin-2'
      );

      // Delete policy
      service.deletePolicy('audit-test-policy', 'admin-1');

      // Verify audit trail
      const logs = auditLogger.getLogs();
      expect(logs).toHaveLength(5);

      const actionCounts = auditLogger.getActionCounts();
      expect(actionCounts.create).toBe(1);
      expect(actionCounts.validate).toBe(2);
      expect(actionCounts.update).toBe(1);
      expect(actionCounts.delete).toBe(1);

      // Verify we can find logs by user
      const admin1Logs = auditLogger.getLogsForUser('admin-1');
      expect(admin1Logs).toHaveLength(2); // create + delete
    });

    it('should handle multiple policies with different severities', () => {
      // Register multiple policies
      service.registerPolicy(
        {
          id: 'critical-policy',
          name: 'Critical Security Policy',
          rules: [
            {
              id: 'critical-rule',
              name: 'Critical Check',
              severity: 'critical',
              conditions: [{ field: 'criticalField', operator: 'equals', value: 'valid' }],
            },
          ],
        },
        'admin'
      );

      service.registerPolicy(
        {
          id: 'optional-policy',
          name: 'Optional Best Practices',
          rules: [
            {
              id: 'optional-rule',
              name: 'Best Practice Check',
              severity: 'low',
              conditions: [{ field: 'optionalField', operator: 'equals', value: true }],
            },
          ],
        },
        'admin'
      );

      // Data that passes critical but fails optional
      const data = {
        criticalField: 'valid',
        optionalField: false,
      };

      // Should still be compliant (only low severity failure)
      expect(service.isCompliant(data, 'user')).toBe(true);

      const reports = service.validateAll(data, 'user');
      expect(reports).toHaveLength(2);

      const criticalReport = reports.find((r) => r.policyId === 'critical-policy');
      const optionalReport = reports.find((r) => r.policyId === 'optional-policy');

      expect(criticalReport!.summary.passed).toBe(1);
      expect(optionalReport!.summary.failed).toBe(1);
    });
  });

  describe('Policy lifecycle management', () => {
    it('should manage policy versions through updates', () => {
      // Create initial policy
      const initial = service.registerPolicy(
        {
          id: 'versioned-policy',
          name: 'Versioned Policy',
          version: '1.0.0',
          rules: [
            {
              id: 'rule-v1',
              name: 'Version 1 Rule',
              severity: 'medium',
              conditions: [{ field: 'v1Field', operator: 'equals', value: true }],
            },
          ],
        },
        'admin'
      );

      expect(initial.version).toBe('1.0.0');
      expect(initial.rules).toHaveLength(1);

      // Update with new version
      const updated = service.updatePolicy(
        'versioned-policy',
        {
          id: 'versioned-policy',
          name: 'Versioned Policy',
          version: '2.0.0',
          rules: [
            {
              id: 'rule-v1',
              name: 'Version 1 Rule (Updated)',
              severity: 'high',
              conditions: [{ field: 'v1Field', operator: 'equals', value: true }],
            },
            {
              id: 'rule-v2',
              name: 'Version 2 Rule',
              severity: 'medium',
              conditions: [{ field: 'v2Field', operator: 'equals', value: true }],
            },
          ],
        },
        'admin'
      );

      expect(updated.version).toBe('2.0.0');
      expect(updated.rules).toHaveLength(2);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(initial.createdAt.getTime());
    });
  });
});
