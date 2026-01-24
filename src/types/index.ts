/**
 * Type definitions for the Compliance Framework
 */

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  enabled: boolean;
  conditions: RuleCondition[];
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'matches';
  value: string | number | boolean | RegExp;
}

export interface CompliancePolicy {
  id: string;
  name: string;
  version: string;
  description: string;
  rules: ComplianceRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: ComplianceRule['severity'];
  message: string;
  details?: Record<string, unknown>;
}

export interface ComplianceReport {
  policyId: string;
  policyName: string;
  timestamp: Date;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    criticalFailures: number;
    highFailures: number;
    mediumFailures: number;
    lowFailures: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'validate' | 'create' | 'update' | 'delete';
  resourceType: 'policy' | 'rule' | 'report';
  resourceId: string;
  userId: string;
  details: Record<string, unknown>;
}
