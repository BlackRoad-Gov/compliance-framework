import type { ComplianceRule, RuleCondition, ValidationResult } from '../types/index.js';

/**
 * Validates data against compliance rules
 */
export class RuleValidator {
  /**
   * Evaluate a single condition against a data object
   */
  evaluateCondition(condition: RuleCondition, data: Record<string, unknown>): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'contains':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          return fieldValue.includes(condition.value);
        }
        return false;
      case 'notContains':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          return !fieldValue.includes(condition.value);
        }
        return true;
      case 'greaterThan':
        if (typeof fieldValue === 'number' && typeof condition.value === 'number') {
          return fieldValue > condition.value;
        }
        return false;
      case 'lessThan':
        if (typeof fieldValue === 'number' && typeof condition.value === 'number') {
          return fieldValue < condition.value;
        }
        return false;
      case 'matches':
        if (typeof fieldValue === 'string' && condition.value instanceof RegExp) {
          return condition.value.test(fieldValue);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Validate data against a compliance rule
   */
  validateRule(rule: ComplianceRule, data: Record<string, unknown>): ValidationResult {
    if (!rule.enabled) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: true,
        severity: rule.severity,
        message: 'Rule is disabled',
      };
    }

    const allConditionsPassed = rule.conditions.every((condition) =>
      this.evaluateCondition(condition, data)
    );

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed: allConditionsPassed,
      severity: rule.severity,
      message: allConditionsPassed
        ? `Rule "${rule.name}" passed`
        : `Rule "${rule.name}" failed: ${rule.description}`,
    };
  }

  /**
   * Get a nested field value from an object using dot notation
   */
  private getFieldValue(data: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = data;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}
