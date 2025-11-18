export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  description: string;
  type: TransactionType;
  category: string;
  value: number;
  date: string;
}

export interface FinanceData {
  transactions: Transaction[];
  categories: string[];
}

export interface MonthlyBalance {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  percentage: number;
}

export const DEFAULT_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Contas",
  "Compras",
  "Assinaturas",
  "Imprevistos",
  "Investimentos",
  "Renda Extra",
  "Salário",
  "Outros",
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Alimentação": "🍽️",
  "Transporte": "🚗",
  "Moradia": "🏠",
  "Lazer": "🎮",
  "Saúde": "❤️",
  "Educação": "📚",
  "Contas": "📄",
  "Compras": "🛍️",
  "Assinaturas": "✅",
  "Imprevistos": "⚠️",
  "Investimentos": "📈",
  "Renda Extra": "💰",
  "Salário": "💼",
  "Outros": "📦",
};
