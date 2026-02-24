/**
 * Tiger Claw Scout Utility Tests
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'vitest';

// ==================== UTILITY FUNCTION TESTS ====================

describe('Date Utilities', () => {
  it('should format dates correctly', () => {
    const date = new Date('2026-02-09T12:00:00Z');
    expect(date.toISOString()).toContain('2026-02-09');
  });

  it('should calculate date differences', () => {
    const date1 = new Date('2026-02-09');
    const date2 = new Date('2026-02-01');
    const diffDays = Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(8);
  });
});

describe('Score Utilities', () => {
  it('should validate score range 0-100', () => {
    const isValidScore = (score: number) => score >= 0 && score <= 100;
    expect(isValidScore(50)).toBe(true);
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(100)).toBe(true);
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(101)).toBe(false);
  });

  it('should categorize scores correctly', () => {
    const categorizeScore = (score: number): string => {
      if (score >= 85) return 'hot';
      if (score >= 60) return 'warm';
      return 'cold';
    };
    expect(categorizeScore(90)).toBe('hot');
    expect(categorizeScore(70)).toBe('warm');
    expect(categorizeScore(40)).toBe('cold');
  });
});

describe('Status Utilities', () => {
  it('should validate lead status', () => {
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    const isValidStatus = (status: string) => validStatuses.includes(status);
    expect(isValidStatus('new')).toBe(true);
    expect(isValidStatus('contacted')).toBe(true);
    expect(isValidStatus('invalid')).toBe(false);
  });

  it('should get next status in pipeline', () => {
    const statusOrder = ['new', 'contacted', 'qualified', 'converted'];
    const getNextStatus = (current: string): string | null => {
      const idx = statusOrder.indexOf(current);
      if (idx === -1 || idx === statusOrder.length - 1) return null;
      return statusOrder[idx + 1];
    };
    expect(getNextStatus('new')).toBe('contacted');
    expect(getNextStatus('contacted')).toBe('qualified');
    expect(getNextStatus('converted')).toBe(null);
  });
});

describe('Pagination Utilities', () => {
  it('should calculate correct offset', () => {
    const calculateOffset = (page: number, limit: number) => (page - 1) * limit;
    expect(calculateOffset(1, 10)).toBe(0);
    expect(calculateOffset(2, 10)).toBe(10);
    expect(calculateOffset(3, 20)).toBe(40);
  });

  it('should calculate total pages', () => {
    const calculateTotalPages = (total: number, limit: number) => Math.ceil(total / limit);
    expect(calculateTotalPages(100, 10)).toBe(10);
    expect(calculateTotalPages(95, 10)).toBe(10);
    expect(calculateTotalPages(0, 10)).toBe(0);
  });
});

describe('Conversion Rate Utilities', () => {
  it('should calculate conversion rate correctly', () => {
    const calculateConversionRate = (converted: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((converted / total) * 100 * 10) / 10;
    };
    expect(calculateConversionRate(10, 100)).toBe(10);
    expect(calculateConversionRate(33, 100)).toBe(33);
    expect(calculateConversionRate(0, 100)).toBe(0);
    expect(calculateConversionRate(10, 0)).toBe(0);
  });
});

describe('String Utilities', () => {
  it('should truncate long strings', () => {
    const truncate = (str: string, maxLength: number): string => {
      if (str.length <= maxLength) return str;
      return str.slice(0, maxLength - 3) + '...';
    };
    expect(truncate('Hello World', 20)).toBe('Hello World');
    expect(truncate('Hello World This Is Long', 15)).toBe('Hello World ...');
  });

  it('should sanitize search queries', () => {
    const sanitizeSearch = (query: string): string => {
      return query.trim().toLowerCase().replace(/[^a-z0-9\s]/gi, '');
    };
    expect(sanitizeSearch('  Hello  ')).toBe('hello');
    expect(sanitizeSearch('Test@123!')).toBe('test123');
  });
});

describe('UUID Validation', () => {
  it('should validate UUID format', () => {
    const isValidUUID = (uuid: string): boolean => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('invalid-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

export {};
