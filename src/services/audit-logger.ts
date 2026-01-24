import type { AuditLogEntry } from '../types/index.js';

/**
 * Handles audit logging for compliance operations
 */
export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private readonly maxLogSize: number;

  constructor(maxLogSize: number = 10000) {
    this.maxLogSize = maxLogSize;
  }

  /**
   * Log a compliance action
   */
  log(
    action: AuditLogEntry['action'],
    resourceType: AuditLogEntry['resourceType'],
    resourceId: string,
    userId: string,
    details: Record<string, unknown> = {}
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      resourceType,
      resourceId,
      userId,
      details,
    };

    this.logs.push(entry);
    this.trimLogs();

    return entry;
  }

  /**
   * Get all logs within a time range
   */
  getLogs(startDate?: Date, endDate?: Date): AuditLogEntry[] {
    let filtered = [...this.logs];

    if (startDate) {
      filtered = filtered.filter((log) => log.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((log) => log.timestamp <= endDate);
    }

    return filtered;
  }

  /**
   * Get logs for a specific resource
   */
  getLogsForResource(resourceType: AuditLogEntry['resourceType'], resourceId: string): AuditLogEntry[] {
    return this.logs.filter(
      (log) => log.resourceType === resourceType && log.resourceId === resourceId
    );
  }

  /**
   * Get logs for a specific user
   */
  getLogsForUser(userId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  /**
   * Get the count of logs by action type
   */
  getActionCounts(): Record<AuditLogEntry['action'], number> {
    const counts: Record<AuditLogEntry['action'], number> = {
      validate: 0,
      create: 0,
      update: 0,
      delete: 0,
    };

    for (const log of this.logs) {
      counts[log.action]++;
    }

    return counts;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Generate a unique ID for log entries
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Trim logs if they exceed the max size
   */
  private trimLogs(): void {
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }
}
