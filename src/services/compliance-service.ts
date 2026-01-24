import type { CompliancePolicy, ComplianceReport } from '../types/index.js';
import { PolicyValidator } from '../validators/policy-validator.js';
import { PolicyParser } from '../parsers/policy-parser.js';
import { AuditLogger } from './audit-logger.js';

/**
 * Main service for compliance operations
 */
export class ComplianceService {
  private policies: Map<string, CompliancePolicy> = new Map();
  private validator: PolicyValidator;
  private parser: PolicyParser;
  private auditLogger: AuditLogger;

  constructor(auditLogger?: AuditLogger) {
    this.validator = new PolicyValidator();
    this.parser = new PolicyParser();
    this.auditLogger = auditLogger ?? new AuditLogger();
  }

  /**
   * Register a new policy
   */
  registerPolicy(policyInput: unknown, userId: string): CompliancePolicy {
    const policy = this.parser.parsePolicy(policyInput);

    if (this.policies.has(policy.id)) {
      throw new Error(`Policy with ID "${policy.id}" already exists`);
    }

    this.policies.set(policy.id, policy);

    this.auditLogger.log('create', 'policy', policy.id, userId, {
      policyName: policy.name,
      ruleCount: policy.rules.length,
    });

    return policy;
  }

  /**
   * Update an existing policy
   */
  updatePolicy(policyId: string, policyInput: unknown, userId: string): CompliancePolicy {
    if (!this.policies.has(policyId)) {
      throw new Error(`Policy with ID "${policyId}" not found`);
    }

    const policy = this.parser.parsePolicy(policyInput);
    policy.id = policyId;
    policy.updatedAt = new Date();

    this.policies.set(policyId, policy);

    this.auditLogger.log('update', 'policy', policyId, userId, {
      policyName: policy.name,
      ruleCount: policy.rules.length,
    });

    return policy;
  }

  /**
   * Delete a policy
   */
  deletePolicy(policyId: string, userId: string): boolean {
    if (!this.policies.has(policyId)) {
      return false;
    }

    this.policies.delete(policyId);

    this.auditLogger.log('delete', 'policy', policyId, userId);

    return true;
  }

  /**
   * Get a policy by ID
   */
  getPolicy(policyId: string): CompliancePolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get all registered policies
   */
  getAllPolicies(): CompliancePolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Validate data against a specific policy
   */
  validate(policyId: string, data: Record<string, unknown>, userId: string): ComplianceReport {
    const policy = this.policies.get(policyId);

    if (!policy) {
      throw new Error(`Policy with ID "${policyId}" not found`);
    }

    const report = this.validator.validatePolicy(policy, data);

    this.auditLogger.log('validate', 'policy', policyId, userId, {
      passed: this.validator.isPolicyPassing(report),
      totalRules: report.summary.total,
      failedRules: report.summary.failed,
    });

    return report;
  }

  /**
   * Validate data against all registered policies
   */
  validateAll(data: Record<string, unknown>, userId: string): ComplianceReport[] {
    return this.getAllPolicies().map((policy) => this.validate(policy.id, data, userId));
  }

  /**
   * Check if data passes all policies
   */
  isCompliant(data: Record<string, unknown>, userId: string): boolean {
    const reports = this.validateAll(data, userId);
    return reports.every((report) => this.validator.isPolicyPassing(report));
  }

  /**
   * Get the audit logger instance
   */
  getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }
}
