import { describe, it, expect } from 'vitest';
import { currencyUtils } from '../../utils/currencyUtils';

const { getCurrencySymbol, formatPrice, getCurrencyDisplayName } = currencyUtils;

describe('currencyUtils', () => {
  describe('getCurrencySymbol', () => {
    it('should return correct symbols for supported currencies', () => {
      expect(getCurrencySymbol('DKK')).toBe('kr.');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('SEK')).toBe('kr.');
      expect(getCurrencySymbol('NOK')).toBe('kr.');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('JPY')).toBe('JPY');
      expect(getCurrencySymbol('CAD')).toBe('CAD');
      expect(getCurrencySymbol('AUD')).toBe('AUD');
    });

    it('should handle null/undefined/empty gracefully', () => {
      expect(getCurrencySymbol(null)).toBe(null);
      expect(getCurrencySymbol(undefined)).toBe(undefined);
      expect(getCurrencySymbol('')).toBe('');
    });

    it('should be case-sensitive', () => {
      expect(getCurrencySymbol('usd')).toBe('usd');
      expect(getCurrencySymbol('eur')).toBe('eur');
    });
  });

  describe('formatPrice', () => {
    it('should format prices with correct currency symbols', () => {
      expect(formatPrice(100, 'DKK')).toBe('100 kr.');
      expect(formatPrice(50.5, 'EUR')).toBe('50.5 €');
      expect(formatPrice(1234.56, 'USD')).toBe('1234.56 $');
      expect(formatPrice(999.99, 'GBP')).toBe('999.99 £');
    });

    it('should handle integer and decimal amounts', () => {
      expect(formatPrice(1000, 'USD')).toBe('1000 $');
      expect(formatPrice(10.5, 'EUR')).toBe('10.5 €');
      expect(formatPrice(999, 'DKK')).toBe('999 kr.');
    });

    it('should handle zero and negative amounts', () => {
      expect(formatPrice(0, 'USD')).toBe('0 $');
      expect(formatPrice(-50, 'EUR')).toBe('-50 €');
    });

    it('should handle very large amounts', () => {
      expect(formatPrice(9999999.99, 'USD')).toBe('9999999.99 $');
      expect(formatPrice(1000000, 'EUR')).toBe('1000000 €');
    });

    it('should handle unknown currencies', () => {
      expect(formatPrice(100, 'JPY')).toBe('100 JPY');
    });

    it('should handle edge cases', () => {
      expect(formatPrice(0.01, 'USD')).toBe('0.01 $');
      expect(formatPrice(0.99, 'EUR')).toBe('0.99 €');
    });
  });

  describe('getCurrencyDisplayName', () => {
    it('should return full names for supported currencies', () => {
      expect(getCurrencyDisplayName('DKK')).toBe('DKK (kr.)');
      expect(getCurrencyDisplayName('EUR')).toBe('EUR (€)');
      expect(getCurrencyDisplayName('USD')).toBe('USD ($)');
      expect(getCurrencyDisplayName('GBP')).toBe('GBP (£)');
      expect(getCurrencyDisplayName('SEK')).toBe('SEK (kr.)');
      expect(getCurrencyDisplayName('NOK')).toBe('NOK (kr.)');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencyDisplayName('JPY')).toBe('JPY');
      expect(getCurrencyDisplayName('CAD')).toBe('CAD');
    });

    it('should handle null/undefined/empty gracefully', () => {
      expect(getCurrencyDisplayName(null)).toBe(null);
      expect(getCurrencyDisplayName(undefined)).toBe(undefined);
      expect(getCurrencyDisplayName('')).toBe('');
    });
  });

  describe('currency consistency', () => {
    it('should have matching currencies across all functions', () => {
      const currencies = ['DKK', 'EUR', 'USD', 'GBP', 'SEK', 'NOK'];
      
      currencies.forEach(currency => {
        // All should return non-code values (i.e., they're supported)
        expect(getCurrencySymbol(currency)).not.toBe(currency);
        expect(getCurrencyDisplayName(currency)).not.toBe(currency);
        
        // formatPrice should work for all
        const formatted = formatPrice(100, currency);
        expect(formatted).toContain('100');
      });
    });
  });
});
