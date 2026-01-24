import type { CompliancePolicy, ComplianceRule, RuleCondition } from '../types/index.js';

/**
 * Parses policy definitions from various formats
 */
export class PolicyParser {
  /**
   * Parse a policy from a JSON object
   */
  parsePolicy(input: unknown): CompliancePolicy {
    if (!this.isValidPolicyInput(input)) {
      throw new Error('Invalid policy format: missing required fields');
    }

    const policy = input as Record<string, unknown>;

    return {
      id: String(policy['id']),
      name: String(policy['name']),
      version: String(policy['version'] ?? '1.0.0'),
      description: String(policy['description'] ?? ''),
      rules: this.parseRules(policy['rules']),
      createdAt: this.parseDate(policy['createdAt']) ?? new Date(),
      updatedAt: this.parseDate(policy['updatedAt']) ?? new Date(),
    };
  }

  /**
   * Parse multiple policies from an array
   */
  parsePolicies(input: unknown): CompliancePolicy[] {
    if (!Array.isArray(input)) {
      throw new Error('Invalid input: expected an array of policies');
    }

    return input.map((item, index) => {
      try {
        return this.parsePolicy(item);
      } catch (error) {
        throw new Error(`Failed to parse policy at index ${index}: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Validate that input has required policy fields
   */
  private isValidPolicyInput(input: unknown): boolean {
    if (typeof input !== 'object' || input === null) {
      return false;
    }

    const obj = input as Record<string, unknown>;
    return (
      typeof obj['id'] === 'string' &&
      typeof obj['name'] === 'string' &&
      Array.isArray(obj['rules'])
    );
  }

  /**
   * Parse rules array from input
   */
  private parseRules(input: unknown): ComplianceRule[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input.map((item, index) => this.parseRule(item, index));
  }

  /**
   * Parse a single rule from input
   */
  private parseRule(input: unknown, index: number): ComplianceRule {
    if (typeof input !== 'object' || input === null) {
      throw new Error(`Invalid rule at index ${index}: expected an object`);
    }

    const rule = input as Record<string, unknown>;

    if (typeof rule['id'] !== 'string' || typeof rule['name'] !== 'string') {
      throw new Error(`Invalid rule at index ${index}: missing id or name`);
    }

    return {
      id: rule['id'],
      name: rule['name'],
      description: String(rule['description'] ?? ''),
      severity: this.parseSeverity(rule['severity']),
      category: String(rule['category'] ?? 'general'),
      enabled: rule['enabled'] !== false,
      conditions: this.parseConditions(rule['conditions']),
    };
  }

  /**
   * Parse severity level with validation
   */
  private parseSeverity(input: unknown): ComplianceRule['severity'] {
    const validSeverities = ['critical', 'high', 'medium', 'low'] as const;
    if (typeof input === 'string' && validSeverities.includes(input as typeof validSeverities[number])) {
      return input as ComplianceRule['severity'];
    }
    return 'medium';
  }

  /**
   * Parse conditions array from input
   */
  private parseConditions(input: unknown): RuleCondition[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .filter((item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null
      )
      .map((item) => this.parseCondition(item));
  }

  /**
   * Parse a single condition from input
   */
  private parseCondition(input: Record<string, unknown>): RuleCondition {
    const validOperators = ['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'matches'] as const;

    const operator = validOperators.includes(input['operator'] as typeof validOperators[number])
      ? (input['operator'] as RuleCondition['operator'])
      : 'equals';

    return {
      field: String(input['field'] ?? ''),
      operator,
      value: input['value'] as RuleCondition['value'],
    };
  }

  /**
   * Parse a date from various input formats
   */
  private parseDate(input: unknown): Date | null {
    if (input instanceof Date) {
      return input;
    }
    if (typeof input === 'string' || typeof input === 'number') {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }
}
