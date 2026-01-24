import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogger } from '../../../src/services/audit-logger.js';

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger();
  });

  describe('log', () => {
    it('should create a log entry with all required fields', () => {
      const entry = logger.log('create', 'policy', 'policy-1', 'user-1', { extra: 'data' });

      expect(entry.id).toMatch(/^audit_\d+_[a-z0-9]+$/);
      expect(entry.action).toBe('create');
      expect(entry.resourceType).toBe('policy');
      expect(entry.resourceId).toBe('policy-1');
      expect(entry.userId).toBe('user-1');
      expect(entry.details).toEqual({ extra: 'data' });
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should default details to empty object', () => {
      const entry = logger.log('validate', 'policy', 'policy-1', 'user-1');

      expect(entry.details).toEqual({});
    });

    it('should store logs internally', () => {
      logger.log('create', 'policy', 'policy-1', 'user-1');
      logger.log('update', 'policy', 'policy-1', 'user-1');
      logger.log('delete', 'policy', 'policy-1', 'user-1');

      const logs = logger.getLogs();

      expect(logs).toHaveLength(3);
    });

    it('should generate unique IDs for each entry', () => {
      const entry1 = logger.log('create', 'policy', 'p1', 'u1');
      const entry2 = logger.log('create', 'policy', 'p2', 'u1');

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return all logs when no date range specified', () => {
      logger.log('create', 'policy', 'p1', 'u1');
      logger.log('update', 'policy', 'p1', 'u1');

      const logs = logger.getLogs();

      expect(logs).toHaveLength(2);
    });

    it('should filter logs by start date', () => {
      vi.setSystemTime(new Date('2024-01-01'));
      logger.log('create', 'policy', 'p1', 'u1');

      vi.setSystemTime(new Date('2024-01-15'));
      logger.log('update', 'policy', 'p1', 'u1');

      vi.setSystemTime(new Date('2024-01-20'));
      logger.log('delete', 'policy', 'p1', 'u1');

      const logs = logger.getLogs(new Date('2024-01-10'));

      expect(logs).toHaveLength(2);
    });

    it('should filter logs by end date', () => {
      vi.setSystemTime(new Date('2024-01-01'));
      logger.log('create', 'policy', 'p1', 'u1');

      vi.setSystemTime(new Date('2024-01-15'));
      logger.log('update', 'policy', 'p1', 'u1');

      vi.setSystemTime(new Date('2024-01-20'));
      logger.log('delete', 'policy', 'p1', 'u1');

      const logs = logger.getLogs(undefined, new Date('2024-01-16'));

      expect(logs).toHaveLength(2);
    });

    it('should filter logs by date range', () => {
      vi.setSystemTime(new Date('2024-01-01'));
      logger.log('create', 'policy', 'p1', 'u1');

      vi.setSystemTime(new Date('2024-01-15'));
      logger.log('update', 'policy', 'p1', 'u1');

      vi.setSystemTime(new Date('2024-01-20'));
      logger.log('delete', 'policy', 'p1', 'u1');

      const logs = logger.getLogs(new Date('2024-01-10'), new Date('2024-01-16'));

      expect(logs).toHaveLength(1);
    });
  });

  describe('getLogsForResource', () => {
    it('should return logs for a specific resource', () => {
      logger.log('create', 'policy', 'p1', 'u1');
      logger.log('update', 'policy', 'p1', 'u1');
      logger.log('create', 'policy', 'p2', 'u1');
      logger.log('create', 'rule', 'r1', 'u1');

      const logs = logger.getLogsForResource('policy', 'p1');

      expect(logs).toHaveLength(2);
      expect(logs.every((l) => l.resourceId === 'p1')).toBe(true);
    });

    it('should return empty array when no matching logs', () => {
      logger.log('create', 'policy', 'p1', 'u1');

      const logs = logger.getLogsForResource('rule', 'r1');

      expect(logs).toHaveLength(0);
    });
  });

  describe('getLogsForUser', () => {
    it('should return logs for a specific user', () => {
      logger.log('create', 'policy', 'p1', 'user-1');
      logger.log('update', 'policy', 'p1', 'user-2');
      logger.log('delete', 'policy', 'p1', 'user-1');

      const logs = logger.getLogsForUser('user-1');

      expect(logs).toHaveLength(2);
      expect(logs.every((l) => l.userId === 'user-1')).toBe(true);
    });
  });

  describe('getActionCounts', () => {
    it('should return counts by action type', () => {
      logger.log('create', 'policy', 'p1', 'u1');
      logger.log('create', 'policy', 'p2', 'u1');
      logger.log('update', 'policy', 'p1', 'u1');
      logger.log('validate', 'policy', 'p1', 'u1');
      logger.log('validate', 'policy', 'p1', 'u1');
      logger.log('validate', 'policy', 'p1', 'u1');

      const counts = logger.getActionCounts();

      expect(counts.create).toBe(2);
      expect(counts.update).toBe(1);
      expect(counts.delete).toBe(0);
      expect(counts.validate).toBe(3);
    });

    it('should return zero counts when no logs', () => {
      const counts = logger.getActionCounts();

      expect(counts.create).toBe(0);
      expect(counts.update).toBe(0);
      expect(counts.delete).toBe(0);
      expect(counts.validate).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all logs', () => {
      logger.log('create', 'policy', 'p1', 'u1');
      logger.log('update', 'policy', 'p1', 'u1');

      logger.clear();

      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('export', () => {
    it('should export logs as JSON string', () => {
      logger.log('create', 'policy', 'p1', 'u1', { test: true });

      const exported = logger.export();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].action).toBe('create');
      expect(parsed[0].details.test).toBe(true);
    });
  });

  describe('log trimming', () => {
    it('should trim logs when exceeding max size', () => {
      const smallLogger = new AuditLogger(3);

      smallLogger.log('create', 'policy', 'p1', 'u1');
      smallLogger.log('create', 'policy', 'p2', 'u1');
      smallLogger.log('create', 'policy', 'p3', 'u1');
      smallLogger.log('create', 'policy', 'p4', 'u1');
      smallLogger.log('create', 'policy', 'p5', 'u1');

      const logs = smallLogger.getLogs();

      expect(logs).toHaveLength(3);
      expect(logs[0]!.resourceId).toBe('p3'); // Oldest kept
      expect(logs[2]!.resourceId).toBe('p5'); // Newest
    });
  });
});
