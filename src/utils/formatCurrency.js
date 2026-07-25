/**
 * Formats a numeric value into Ghanaian Cedi (GH₵) currency representation.
 * @param {number} amount
 * @returns {string} e.g. "GH₵ 129.00"
 */
export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `GH₵ ${value.toFixed(2)}`;
}
