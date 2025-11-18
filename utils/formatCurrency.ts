export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".");
  return parseFloat(cleanValue) || 0;
};
