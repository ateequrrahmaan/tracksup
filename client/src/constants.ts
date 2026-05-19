export const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
  { code: "JPY", symbol: "¥" },
  { code: "CAD", symbol: "$" },
  { code: "AUD", symbol: "$" },
];

export const getCurrencySymbol = (code?: string) => {
  if (!code) return "$";
  return CURRENCIES.find(c => c.code === code)?.symbol || "$";
};

export const formatCurrency = (amount: number, code?: string) => {
  const symbol = getCurrencySymbol(code);
  return `${symbol}${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
