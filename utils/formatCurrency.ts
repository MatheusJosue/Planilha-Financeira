export const formatCurrency = (value: number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(0);
  }
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
};

export const parseCurrency = (value: string): number => {
  // Remove tudo exceto dígitos, vírgula e ponto
  let cleanValue = value.trim().replace(/[^\d,.-]/g, "");
  
  // Detectar o formato: se tem vírgula E ponto, determinar qual é decimal
  const hasComma = cleanValue.includes(',');
  const hasDot = cleanValue.includes('.');
  
  if (hasComma && hasDot) {
    // Se tem ambos, o último é o separador decimal
    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Vírgula é decimal, remover pontos
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // Ponto é decimal, remover vírgulas
      cleanValue = cleanValue.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Só tem vírgula - assumir que é separador decimal
    cleanValue = cleanValue.replace(',', '.');
  }
  // Se só tem ponto ou nenhum, já está correto
  
  return parseFloat(cleanValue) || 0;
};

export const formatCurrencyInput = (value: string): string => {
  const numericValue = parseCurrency(value);
  if (numericValue === 0 && value !== "0") return value;
  return numericValue.toFixed(2).replace(".", ",");
};
