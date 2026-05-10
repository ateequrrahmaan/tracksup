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
  return CURRENCIES.find(c => c.code === code)?.symbol || "$";
};

export const formatCurrency = (amount: number, code?: string) => {
  const symbol = getCurrencySymbol(code);
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
