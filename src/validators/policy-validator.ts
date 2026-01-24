import type { CompliancePolicy, ComplianceReport, ValidationResult } from '../types/index.js';
import { RuleValidator } from './rule-validator.js';

/**
 * Validates data against compliance policies
 */
export class PolicyValidator {
  private ruleValidator: RuleValidator;

  constructor() {
    this.ruleValidator = new RuleValidator();
  }

  /**
   * Validate data against all rules in a policy
   */
  validatePolicy(policy: CompliancePolicy, data: Record<string, unknown>): ComplianceReport {
    const results: ValidationResult[] = policy.rules.map((rule) =>
      this.ruleValidator.validateRule(rule, data)
    );

    const summary = this.calculateSummary(results);

    return {
      policyId: policy.id,
      policyName: policy.name,
      timestamp: new Date(),
      results,
      summary,
    };
  }

  /**
   * Check if a policy validation passed (no critical or high severity failures)
   */
  isPolicyPassing(report: ComplianceReport): boolean {
    return report.summary.criticalFailures === 0 && report.summary.highFailures === 0;
  }

  /**
   * Get all failed rules from a report
   */
  getFailedRules(report: ComplianceReport): ValidationResult[] {
    return report.results.filter((result) => !result.passed);
  }

  /**
   * Calculate summary statistics from validation results
   */
  private calculateSummary(results: ValidationResult[]): ComplianceReport['summary'] {
    const failed = results.filter((r) => !r.passed);

    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: failed.length,
      criticalFailures: failed.filter((r) => r.severity === 'critical').length,
      highFailures: failed.filter((r) => r.severity === 'high').length,
      mediumFailures: failed.filter((r) => r.severity === 'medium').length,
      lowFailures: failed.filter((r) => r.severity === 'low').length,
    };
  }
}
