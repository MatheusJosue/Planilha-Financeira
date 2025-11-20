export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  const cleanValue = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  return parseFloat(cleanValue) || 0;
};

export const formatCurrencyInput = (value: string): string => {
  const numericValue = parseCurrency(value);
  if (numericValue === 0 && value !== "0") return value;
  return numericValue.toFixed(2).replace(".", ",");
};
