import { currencyUtils } from "../utils/currencyUtils";

function PriceHistoryDisplay({ 
  product, 
  className = "", 
  oldPriceClassName = "line-through",
  discountClassName = "text-green-600 font-medium text-sm"
}) {
  if (!product?.price_changes || product.price_changes.length === 0) {
    return null;
  }

  // Sort price changes by date (newest first)
  const sortedChanges = [...product.price_changes].sort(
    (a, b) => new Date(b.changed_at) - new Date(a.changed_at)
  );

  // Find the highest price that's higher than current price
  const higherPrices = sortedChanges.filter(change =>
    Number(change.amount) > Number(product.price_amount)
  );

  if (higherPrices.length === 0) {
    return null;
  }

  // Get the highest price among the higher prices
  // If there are multiple with the same highest amount, pick the most recent
  const highestAmount = Math.max(...higherPrices.map(p => Number(p.amount)));
  const highestPriceEntries = higherPrices.filter(p => Number(p.amount) === highestAmount);
  const highestPrice = highestPriceEntries.sort((a, b) =>
    new Date(b.changed_at) - new Date(a.changed_at)
  )[0];

  const currentPrice = Number(product.price_amount);
  const oldPrice = Number(highestPrice.amount);
  const discountPercent = Math.round(((oldPrice - currentPrice) / oldPrice) * 100);

  return (
    <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
      <span className={oldPriceClassName}>
        {Number(highestPrice.amount) % 1 === 0
          ? Number(highestPrice.amount)
          : Number(highestPrice.amount).toFixed(2)
        } {currencyUtils.getCurrencySymbol(highestPrice.currency)}
      </span>
      <div className="flex items-center gap-1">
        <span className={discountClassName}>↓ {discountPercent}%</span>
      </div>
    </div>
  );
}

export default PriceHistoryDisplay;