export type TransactionType = "income" | "expense";

export type RecurrenceType = 
  | "fixed"
  | "installment"
  | "variable";

export interface Transaction {
  id: string;
  description: string;
  type: TransactionType;
  category: string;
  value: number;
  date: string;
  recurring_id?: string;
  is_predicted?: boolean;
  is_paid?: boolean;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  type: TransactionType;
  category: string;
  value: number;
  recurrence_type: RecurrenceType;
  start_date: string;
  end_date?: string;
  total_installments?: number;
  current_installment?: number;
  day_of_month: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
}

export interface Category {
  name: string;
  maxPercentage?: number;
  maxValue?: number;
}

export interface Category {
  name: string;
  maxPercentage?: number;
  maxValue?: number;
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

export interface Category {
  id?: string;
  name: string;
  user_id: string;
  max_percentage: number | null;
  max_value: number | null;
  created_at?: string;
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
