const MAX_ECONOMY_AMOUNT = 1_000_000_000;
const MAX_BALANCE = 9_000_000_000_000;

function isValidEconomyAmount(amount) {
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_ECONOMY_AMOUNT;
}

function clampBalance(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_BALANCE, Math.floor(value)));
}

function formatCoins(amount) {
  return `${Number(amount || 0).toLocaleString()} coins`;
}

function canAfford(user, amount) {
  return isValidEconomyAmount(amount) && user.wallet >= amount;
}

module.exports = {
  MAX_ECONOMY_AMOUNT,
  MAX_BALANCE,
  isValidEconomyAmount,
  clampBalance,
  formatCoins,
  canAfford
};
