// Currency utilities
export const currencyUtils = {
  // Map currency codes to their display symbols
  getCurrencySymbol: (currencyCode) => {
    const symbolMap = {
      'DKK': 'kr.',
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'SEK': 'kr.',
      'NOK': 'kr.'
    };
    return symbolMap[currencyCode] || currencyCode;
  },

  // Format price with currency symbol
  formatPrice: (amount, currencyCode) => {
    const symbol = currencyUtils.getCurrencySymbol(currencyCode);
    return `${amount} ${symbol}`;
  },

  // Get currency display name
  getCurrencyDisplayName: (currencyCode) => {
    const nameMap = {
      'DKK': 'DKK (kr.)',
      'EUR': 'EUR (€)',
      'USD': 'USD ($)',
      'GBP': 'GBP (£)',
      'SEK': 'SEK (kr.)',
      'NOK': 'NOK (kr.)'
    };
    return nameMap[currencyCode] || currencyCode;
  }
};
