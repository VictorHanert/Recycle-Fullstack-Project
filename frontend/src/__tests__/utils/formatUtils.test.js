import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime, formatCondition } from '../../utils/formatUtils';

describe('formatUtils', () => {
  describe('formatRelativeTime', () => {
    let originalDate;

    beforeEach(() => {
      // Mock current date to 2024-01-15 12:00:00 UTC
      originalDate = Date;
      const mockDate = new Date('2024-01-15T12:00:00Z');
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return mockDate;
          }
          return new originalDate(...args);
        }
        static now() {
          return mockDate.getTime();
        }
      };
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should return empty string for null/undefined', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
      expect(formatRelativeTime('')).toBe('');
    });

    it('should return "Just now" for timestamps < 1 minute ago', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatRelativeTime(thirtySecondsAgo.toISOString())).toBe('Just now');
    });

    it('should format minutes correctly (BVA: 1-59 minutes)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      
      // 1 minute ago (singular)
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');
      
      // 30 minutes ago (plural)
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      expect(formatRelativeTime(thirtyMinutesAgo.toISOString())).toBe('30 minutes ago');
      
      // 59 minutes ago
      const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000);
      expect(formatRelativeTime(fiftyNineMinutesAgo.toISOString())).toBe('59 minutes ago');
    });

    it('should format hours correctly (BVA: 1-23 hours)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      
      // 1 hour ago (singular)
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo.toISOString())).toBe('1 hour ago');
      
      // 12 hours ago (plural)
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      expect(formatRelativeTime(twelveHoursAgo.toISOString())).toBe('12 hours ago');
      
      // 23 hours ago
      const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
      expect(formatRelativeTime(twentyThreeHoursAgo.toISOString())).toBe('23 hours ago');
    });

    it('should format days correctly (BVA: 1-6 days)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      
      // 1 day ago (singular)
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo.toISOString())).toBe('1 day ago');
      
      // 3 days ago (plural)
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3 days ago');
      
      // 6 days ago
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(sixDaysAgo.toISOString())).toBe('6 days ago');
    });

    it('should format weeks correctly (BVA: 1-3 weeks)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      
      // 1 week ago (singular)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneWeekAgo.toISOString())).toBe('1 week ago');
      
      // 2 weeks ago (plural)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoWeeksAgo.toISOString())).toBe('2 weeks ago');
    });

    it('should format months correctly (BVA: 1-11 months)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      
      // 1 month ago (singular)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneMonthAgo.toISOString())).toBe('1 month ago');
      
      // 6 months ago (plural)
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(sixMonthsAgo.toISOString())).toBe('6 months ago');
    });

    it('should format years correctly (BVA: 1+ years)', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      
      // 1 year ago (singular)
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneYearAgo.toISOString())).toBe('1 year ago');
      
      // 2 years ago (plural)
      const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoYearsAgo.toISOString())).toBe('2 years ago');
    });

    it('should handle UTC timestamps with Z suffix', () => {
      const timestamp = '2024-01-15T11:30:00Z';
      expect(formatRelativeTime(timestamp)).toBe('30 minutes ago');
    });

    it('should handle UTC timestamps without Z suffix', () => {
      const timestamp = '2024-01-15T11:30:00';
      expect(formatRelativeTime(timestamp)).toBe('30 minutes ago');
    });
  });

  describe('formatCondition', () => {
    it('should return "Not specified" for null/undefined/empty', () => {
      expect(formatCondition(null)).toBe('Not specified');
      expect(formatCondition(undefined)).toBe('Not specified');
      expect(formatCondition('')).toBe('Not specified');
    });

    it('should format valid condition values correctly', () => {
      expect(formatCondition('new')).toBe('New');
      expect(formatCondition('like_new')).toBe('Like New');
      expect(formatCondition('good')).toBe('Good');
      expect(formatCondition('fair')).toBe('Fair');
      expect(formatCondition('used')).toBe('Used');
    });

    it('should capitalize unknown conditions', () => {
      expect(formatCondition('excellent')).toBe('Excellent');
      expect(formatCondition('broken')).toBe('Broken');
      expect(formatCondition('custom_condition')).toBe('Custom Condition');
    });

    it('should handle uppercase/mixed case input', () => {
      // Uppercase doesn't match conditionMap, so returns as-is (uppercase)
      expect(formatCondition('NEW')).toBe('NEW');
      // Mixed case doesn't match, returns capitalized version
      expect(formatCondition('Good')).toBe('Good');
      // LIKE_NEW doesn't match (needs lowercase), gets transformed
      expect(formatCondition('LIKE_NEW')).toBe('LIKE NEW');
    });
  });
});
