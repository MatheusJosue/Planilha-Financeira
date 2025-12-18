import { create } from "zustand";
import { Transaction, FinanceData, DEFAULT_CATEGORIES, RecurringTransaction } from "@/types";
import { createClient } from "@/lib/supabase-client";
import { showError, showSuccess, showErrorToast, showSuccessToast } from "@/lib/sweetalert";
import { getMonthsToLoad } from "@/utils/dashboardConfigHelper";

interface MonthData {
  transactions: Transaction[];
}

interface FinanceStore extends FinanceData {
  isLoaded: boolean;
  currentMonth: string;
  monthsData: Record<string, MonthData>;
  recurringTransactions: RecurringTransaction[];
  categoryLimits: Record<string, { maxPercentage?: number; maxValue?: number }>;
  hiddenDefaultCategories: string[];
  excludedPredictedIds: string[];
  showMonthPicker: boolean;
  setCurrentMonth: (month: string) => Promise<void>;
  createNewMonth: (month: string, copyFromPrevious?: boolean) => Promise<void>;
  getAvailableMonths: () => string[];
  toggleShowMonthPicker: (show: boolean) => void;
  loadFromSupabase: (monthsToLoad?: number) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  convertPredictedToReal: (predictedTransaction: Transaction, edits?: Partial<Transaction>) => Promise<void>;
  setTransactions: (transactions: Transaction[]) => void;
  updatePaymentStatus: (id: string, is_paid: boolean) => void;
  addCategory: (name: string, maxPercentage?: number, maxValue?: number) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  importData: (data: FinanceData) => Promise<void>;
  clearAllData: () => Promise<void>;
  addRecurringTransaction: (recurring: Omit<RecurringTransaction, "id" | "user_id" | "created_at">) => Promise<void>;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  loadRecurringTransactions: () => Promise<void>;
  generatePredictedTransactions: (monthsAhead?: number) => Transaction[];
}

const getCurrentMonth = () => {
  // Sempre retorna o mês atual para SSR
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Carregar mês salvo do localStorage (apenas no cliente)
const loadSavedMonth = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('currentMonth');
  } catch {
    return null;
  }
};

// Salvar mês atual no localStorage
const saveCurrentMonth = (month: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('currentMonth', month);
  } catch (error) {
    console.error('Error saving current month:', error);
  }
};

// Carregar meses vazios do localStorage
const loadEmptyMonths = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('emptyMonths');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Salvar meses vazios no localStorage
const saveEmptyMonths = (months: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('emptyMonths', JSON.stringify(months));
  } catch (error) {
    console.error('Error saving empty months:', error);
  }
};

// Carregar exclusões do localStorage
const loadExcludedIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('excludedPredictedIds');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Salvar exclusões no localStorage
const saveExcludedIds = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('excludedPredictedIds', JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving excluded IDs:', error);
  }
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  categories: [...DEFAULT_CATEGORIES],
  categoryLimits: {},
  hiddenDefaultCategories: [],
  isLoaded: false,
  currentMonth: loadSavedMonth() || getCurrentMonth(),
  monthsData: {},
  recurringTransactions: [],
  excludedPredictedIds: loadExcludedIds(),
  showMonthPicker: false,

  setCurrentMonth: async (month: string) => {
    const state = get();
    saveCurrentMonth(month); // Salvar no localStorage

    const monthData = state.monthsData[month];

    if (monthData) {
      // Regenerate predicted transactions for this month
      const realTransactions = monthData.transactions.filter(t => !t.is_predicted);
      const predictedTransactions = get().generatePredictedTransactions(12);
      const excludedIds = get().excludedPredictedIds;

      const transactions = [...realTransactions];

      predictedTransactions.forEach((t) => {
        if (excludedIds.includes(t.id)) return;

        const tMonth = t.date.substring(0, 7);
        if (tMonth !== month) return;

        const hasRealTransaction = transactions.some(existing => {
          if (existing.is_predicted) return false;
          if (!existing.recurring_id || existing.recurring_id !== t.recurring_id) return false;
          if (t.current_installment && t.total_installments) {
            return existing.current_installment === t.current_installment &&
                   existing.total_installments === t.total_installments;
          }
          return true;
        });

        const hasPredicted = transactions.some(existing => existing.id === t.id);

        if (!hasRealTransaction && !hasPredicted) {
          transactions.push(t);
        }
      });

      set(state => ({
        currentMonth: month,
        transactions,
        monthsData: {
          ...state.monthsData,
          [month]: { transactions }
        }
      }));
    } else {
      // Month data not loaded yet, load it from database
      set({
        currentMonth: month,
        transactions: []
      });

      // Load the month's transactions from database
      const supabaseClient = createClient();
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) return;

      try {
        const { data: transactionsData, error } = await supabaseClient
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', month)
          .order('date', { ascending: false });

        if (error) {
          console.error("Error loading month data:", error);
          return;
        }

        const transactions: Transaction[] = [];

        if (transactionsData && transactionsData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transactionsData.forEach((t: any) => {
            let numValue: number;
            if (typeof t.value === 'string') {
              const cleanValue = t.value.replace(/\./g, '').replace(',', '.');
              numValue = parseFloat(cleanValue) || 0;
            } else {
              numValue = Number(t.value) || 0;
            }

            const transaction: Transaction = {
              id: t.id,
              description: t.description,
              type: t.type as 'income' | 'expense',
              category: t.category,
              value: numValue,
              date: t.date,
              recurring_id: t.recurring_id,
              is_predicted: false,
              current_installment: t.current_installment,
              total_installments: t.total_installments,
            };

            transactions.push(transaction);
          });
        }

        // Add predicted transactions for this month
        const predictedTransactions = get().generatePredictedTransactions(12);
        const excludedIds = get().excludedPredictedIds;

        predictedTransactions.forEach((t) => {
          if (excludedIds.includes(t.id)) return;

          const tMonth = t.date.substring(0, 7);
          if (tMonth !== month) return;

          const hasRealTransaction = transactions.some(existing => {
            if (existing.is_predicted) return false;
            if (!existing.recurring_id || existing.recurring_id !== t.recurring_id) return false;
            if (t.current_installment && t.total_installments) {
              return existing.current_installment === t.current_installment &&
                     existing.total_installments === t.total_installments;
            }
            return true;
          });

          const hasPredicted = transactions.some(existing => existing.id === t.id);

          if (!hasRealTransaction && !hasPredicted) {
            transactions.push(t);
          }
        });

        // Update monthsData and transactions
        set(state => ({
          monthsData: {
            ...state.monthsData,
            [month]: { transactions }
          },
          transactions: state.currentMonth === month ? transactions : state.transactions
        }));
      } catch (error) {
        console.error("Error loading month data:", error);
      }
    }
  },

  getAvailableMonths: () => {
    const state = get();
    return Object.keys(state.monthsData).sort().reverse();
  },

  createNewMonth: async (month: string, copyFromPrevious = false) => {
    const state = get();

    if (state.monthsData[month]) {
      await get().setCurrentMonth(month);
      return;
    }

    const newTransactions: Transaction[] = [];

    if (copyFromPrevious) {
      const months = Object.keys(state.monthsData).sort();
      const previousMonth = months[months.length - 1];

      if (previousMonth && state.monthsData[previousMonth]) {
        const prevTransactions = state.monthsData[previousMonth].transactions;

        const supabaseClient = createClient();
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
          showError("Você precisa estar logado.");
          return;
        }

        for (const t of prevTransactions) {
          const newTransaction = {
            description: t.description,
            type: t.type,
            category: t.category,
            value: t.value,
            date: t.date.replace(/^\d{4}-\d{2}/, month),
            month: month,
            user_id: user.id,
          };

          const { data, error } = await supabaseClient
            .from('transactions')
            .insert([newTransaction])
            .select()
            .single();

          if (!error && data) {
            newTransactions.push({
              id: data.id,
              description: data.description,
              type: data.type as 'income' | 'expense',
              category: data.category,
              value: Number(data.value),
              date: data.date,
            });
          }
        }
      }
    }

    // If no transactions were created, save this as an empty month to localStorage
    if (newTransactions.length === 0) {
      const emptyMonths = loadEmptyMonths();
      if (!emptyMonths.includes(month)) {
        saveEmptyMonths([...emptyMonths, month]);
      }
    }

    set((state) => {
      const updatedMonthsData = {
        ...state.monthsData,
        [month]: { transactions: newTransactions },
      };
      console.log('Month created. New monthsData keys:', Object.keys(updatedMonthsData));
      return {
        monthsData: updatedMonthsData,
        currentMonth: month,
        transactions: newTransactions,
      };
    });
  },

  toggleShowMonthPicker: (show: boolean) => {
    set({ showMonthPicker: show });
  },

  loadFromSupabase: async (monthsToLoad: number = 1) => {
    if (typeof window === "undefined") return;

    try {
      const supabaseClient = createClient();
      const { data: { user } } = await supabaseClient.auth.getUser();

      if (!user) {
        set({
          isLoaded: true,
          categories: [...DEFAULT_CATEGORIES],
        });
        return;
      }

      const { data: userCategoriesData } = await supabaseClient
        .from('categories')
        .select('name, max_percentage, max_value')
        .eq('user_id', user.id)
        .order('name');

      const { data: hiddenCategoriesData } = await supabaseClient
        .from('hidden_categories')
        .select('category_name')
        .eq('user_id', user.id);

      const hiddenDefaultCategories = hiddenCategoriesData?.map(h => h.category_name) || [];

      const userCustomCategories = userCategoriesData?.map(c => c.name) || [];
      const categoryLimits: Record<string, { maxPercentage?: number; maxValue?: number }> = {};

      userCategoriesData?.forEach(c => {
        if (c.max_percentage !== null || c.max_value !== null) {
          categoryLimits[c.name] = {
            maxPercentage: c.max_percentage ?? undefined,
            maxValue: c.max_value ?? undefined,
          };
        }
      });

      const visibleDefaultCategories = DEFAULT_CATEGORIES.filter(
        cat => !hiddenDefaultCategories.includes(cat)
      );
      const categoriesSet = new Set([...visibleDefaultCategories, ...userCustomCategories]);
      const categories = Array.from(categoriesSet).sort();

      // Optimize query based on how many months we need to load
      let transactionsQuery = supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      // Usar o mês selecionado pelo usuário (do store) ao invés da data atual do sistema
      const selectedMonth = get().currentMonth || getCurrentMonth();
      const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);

      if (monthsToLoad === 1) {
        // Load only current month for better performance
        transactionsQuery = transactionsQuery.eq('month', selectedMonth);
        console.log("[loadFromSupabase] Mês sendo consultado:", selectedMonth);
      } else if (monthsToLoad > 1) {
        // Load specified number of months (selected month + previous months)
        const monthsToQuery: string[] = [];

        for (let i = 0; i < monthsToLoad; i++) {
          const targetDate = new Date(selectedYear, selectedMonthNum - 1 - i, 1);
          const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
          monthsToQuery.push(monthKey);
        }

        transactionsQuery = transactionsQuery.in('month', monthsToQuery);
        console.log("[loadFromSupabase] Meses sendo consultados:", monthsToQuery);
      }

      const { data: transactionsData, error } = await transactionsQuery
        .order('date', { ascending: false });

      console.log("[loadFromSupabase] Transações carregadas:", transactionsData?.length || 0);
      console.log("[loadFromSupabase] Transações:", transactionsData);

      if (error) {
        console.error("Error loading from Supabase:", error);
        set({
          isLoaded: true,
          categories: [...DEFAULT_CATEGORIES],
          currentMonth: getCurrentMonth(),
          monthsData: {
            [getCurrentMonth()]: { transactions: [] }
          }
        });
        return;
      }

      const monthsData: Record<string, MonthData> = {};
      const currentMonth = getCurrentMonth();

      await get().loadRecurringTransactions();

      const allTransactions: Transaction[] = [];

      if (transactionsData && transactionsData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactionsData.forEach((t: any) => {
          const month = t.date.substring(0, 7);
          if (!monthsData[month]) {
            monthsData[month] = { transactions: [] };
          }

          let numValue: number;
          if (typeof t.value === 'string') {
            const cleanValue = t.value.replace(/\./g, '').replace(',', '.');
            numValue = parseFloat(cleanValue) || 0;
          } else {
            numValue = Number(t.value) || 0;
          }

          const transaction: Transaction = {
            id: t.id,
            description: t.description,
            type: t.type as 'income' | 'expense',
            category: t.category,
            value: numValue,
            date: t.date,
            recurring_id: t.recurring_id,
            is_predicted: false,
            current_installment: t.current_installment,
            total_installments: t.total_installments,
          };

          monthsData[month].transactions.push(transaction);
          allTransactions.push(transaction);
        });
      }

      set({ transactions: allTransactions });

      const predictedTransactions = get().generatePredictedTransactions(12);

      const excludedIds = get().excludedPredictedIds;

      predictedTransactions.forEach((t) => {
        if (excludedIds.includes(t.id)) {
          return;
        }

        const month = t.date.substring(0, 7);
        if (!monthsData[month]) {
          monthsData[month] = { transactions: [] };
        }

        const hasRealTransaction = monthsData[month].transactions.some(existing => {
          if (existing.is_predicted) return false;
          if (!t.recurring_id) return false;
          if (existing.recurring_id !== t.recurring_id) return false;
          if (existing.date.substring(0, 7) !== t.date.substring(0, 7)) return false;

          if (t.current_installment && t.total_installments) {
            return existing.current_installment === t.current_installment &&
                   existing.total_installments === t.total_installments;
          }

          return true;
        });

        const hasPredictedTransaction = monthsData[month].transactions.some(existing => {
          if (!existing.is_predicted) return false;
          return existing.id === t.id;
        });

        if (!hasRealTransaction && !hasPredictedTransaction) {
          monthsData[month].transactions.push(t);
        }
      });

      if (!monthsData[currentMonth]) {
        monthsData[currentMonth] = { transactions: [] };
      }

      // Restore empty months from localStorage
      const emptyMonths = loadEmptyMonths();
      emptyMonths.forEach(month => {
        if (!monthsData[month]) {
          monthsData[month] = { transactions: [] };
        }
      });

      const savedMonth = loadSavedMonth();
      const monthToUse = savedMonth && monthsData[savedMonth] ? savedMonth : currentMonth;

      set({
        monthsData,
        currentMonth: monthToUse,
        transactions: monthsData[monthToUse]?.transactions || [],
        categories,
        categoryLimits,
        hiddenDefaultCategories,
        isLoaded: true,
      });
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
      set({
        isLoaded: true,
        categories: [...DEFAULT_CATEGORIES],
      });
    }
  },

  addTransaction: async (transaction) => {
    const month = transaction.date.substring(0, 7);

    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado para adicionar transações.");
      return;
    }

    const { data, error } = await supabaseClient
      .from('transactions')
      .insert([{
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        value: transaction.value,
        date: transaction.date,
        month: month,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding transaction:", error);
      showError("Erro ao adicionar transação. Verifique sua conexão.");
      return;
    }

    console.log("[addTransaction] Dados salvos no Supabase:", data);
    console.log("[addTransaction] Mês da transação:", month);

    if (data) {
      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        type: data.type as 'income' | 'expense',
        category: data.category,
        value: Number(data.value),
        date: data.date,
        is_predicted: false,
      };

      // Remove month from empty months list if it now has transactions
      const emptyMonths = loadEmptyMonths();
      if (emptyMonths.includes(month)) {
        saveEmptyMonths(emptyMonths.filter(m => m !== month));
      }

      // Update the correct month's data based on transaction date
      set((state) => {
        const targetMonthData = state.monthsData[month] || { transactions: [] };
        // Filter out any existing transaction with same ID to avoid duplicates, then add new
        const existingTransactions = targetMonthData.transactions.filter(t => t.id !== newTransaction.id);
        const updatedTargetTransactions = [...existingTransactions, newTransaction];

        // Always update transactions array for current month
        const isCurrentMonth = month === state.currentMonth;
        let updatedTransactions = state.transactions;
        if (isCurrentMonth) {
          // Filter out any existing with same ID, then add new
          updatedTransactions = [...state.transactions.filter(t => t.id !== newTransaction.id), newTransaction];
        }

        // Create new monthsData object to ensure React detects the change
        const newMonthsData = { ...state.monthsData };
        newMonthsData[month] = { transactions: [...updatedTargetTransactions] };

        return {
          transactions: updatedTransactions,
          monthsData: newMonthsData,
        };
      });
    }
  },

  updateTransaction: async (id, updates) => {
    const supabaseClient = createClient();
    const { error } = await supabaseClient
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error("Error updating transaction:", error);
      showError("Erro ao atualizar transação. Verifique sua conexão.");
      return;
    }

    const state = get();
    const updatedTransactions = state.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );

    set((state) => ({
      transactions: updatedTransactions,
      monthsData: {
        ...state.monthsData,
        [state.currentMonth]: { transactions: updatedTransactions },
      },
    }));
  },

  deleteTransaction: async (id) => {
    const state = get();
    const transaction = state.transactions.find((t) => t.id === id);

    // Se for uma transação prevista, apenas adicionar à lista de exclusões
    if (transaction?.is_predicted) {
      const newExcludedIds = [...state.excludedPredictedIds, id];
      saveExcludedIds(newExcludedIds); // Persistir no localStorage

      set(() => ({
        excludedPredictedIds: newExcludedIds,
      }));

      // Remover da lista atual também
      const updatedTransactions = state.transactions.filter((t) => t.id !== id);
      set((state) => ({
        transactions: updatedTransactions,
        monthsData: {
          ...state.monthsData,
          [state.currentMonth]: { transactions: updatedTransactions },
        },
      }));

      showSuccessToast("Transação prevista removida");
      return;
    }

    // Se for uma transação real, deletar do banco
    const supabaseClient = createClient();
    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting transaction:", error);
      showError("Erro ao deletar transação. Verifique sua conexão.");
      return;
    }

    const updatedTransactions = state.transactions.filter((t) => t.id !== id);

    set((state) => ({
      transactions: updatedTransactions,
      monthsData: {
        ...state.monthsData,
        [state.currentMonth]: { transactions: updatedTransactions },
      },
    }));

    showSuccessToast("Transação deletada com sucesso!");
  },

  convertPredictedToReal: async (predictedTransaction, edits = {}) => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    // Save current month before reload
    const currentMonthBeforeReload = get().currentMonth;

    const month = (edits.date || predictedTransaction.date).substring(0, 7);

    const transactionData = {
      description: edits.description || predictedTransaction.description,
      type: edits.type || predictedTransaction.type,
      category: edits.category || predictedTransaction.category,
      value: edits.value !== undefined ? edits.value : predictedTransaction.value,
      date: edits.date || predictedTransaction.date,
      month: month,
      user_id: user.id,
      recurring_id: predictedTransaction.recurring_id || null,
      current_installment: predictedTransaction.current_installment || null,
      total_installments: predictedTransaction.total_installments || null,
    };

    console.log("Converting predicted to real:", transactionData);

    const { data, error } = await supabaseClient
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      console.error("Error converting predicted to real:", error);
      showErrorToast("Erro ao criar transação");
      return;
    }

    if (data) {
      console.log("Transaction created:", data);
      showSuccessToast("Transação criada com sucesso!");
      const monthsToLoad = await getMonthsToLoad();
      await get().loadFromSupabase(monthsToLoad);
      // Restore the month after reload
      set({ currentMonth: currentMonthBeforeReload });
    }
  },

  setTransactions: (transactions) => {
    set({ transactions });
  },

  updatePaymentStatus: (id: string, is_paid: boolean) => {
    const state = get();
    const updatedTransactions = state.transactions.map((t) =>
      t.id === id ? { ...t, is_paid } : t
    );
    set({ transactions: updatedTransactions });
  },

  addCategory: async (category, maxPercentage?, maxValue?) => {
    const state = get();

    if (state.categories.includes(category)) {
      showError("Esta categoria já existe.");
      return;
    }

    if (DEFAULT_CATEGORIES.includes(category)) {
      showError("Esta é uma categoria padrão do sistema.");
      return;
    }

    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado para adicionar categorias.");
      return;
    }

    const { error } = await supabaseClient
      .from('categories')
            .insert([{
        name: category,
        user_id: user.id,
        max_percentage: maxPercentage ?? null,
        max_value: maxValue ?? null
      }]);

    if (error) {
      if (error.code === '23505') {
        const newCategoryLimits = { ...state.categoryLimits };
        if (maxPercentage !== undefined || maxValue !== undefined) {
          newCategoryLimits[category] = {
            maxPercentage,
            maxValue,
          };
        }
        set((state) => ({
          categories: [...state.categories, category].sort(),
          categoryLimits: newCategoryLimits,
        }));
        return;
      }
      console.error("Error adding category:", error);
      showError("Erro ao adicionar categoria. Verifique sua conexão.");
      return;
    }

    const newCategoryLimits = { ...state.categoryLimits };
    if (maxPercentage !== undefined || maxValue !== undefined) {
      newCategoryLimits[category] = {
        maxPercentage,
        maxValue,
      };
    }

    set((state) => ({
      categories: [...state.categories, category].sort(),
      categoryLimits: newCategoryLimits,
    }));

    showSuccess("Categoria adicionada com sucesso!");
  },

  deleteCategory: async (category) => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    if (DEFAULT_CATEGORIES.includes(category)) {
      const { error } = await supabaseClient
        .from('hidden_categories')
        .insert([{ category_name: category, user_id: user.id }]);

      if (error) {
        if (error.code === '23505') {
          return;
        }
        console.error("Error hiding category:", error);
        showError("Erro ao ocultar categoria. Verifique sua conexão.");
        return;
      }

      set((state) => ({
        categories: state.categories.filter((c) => c !== category),
        hiddenDefaultCategories: [...state.hiddenDefaultCategories, category],
      }));

      showSuccess("Categoria ocultada com sucesso!");
      return;
    }

    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('name', category)
      .eq('user_id', user.id);

    if (error) {
      console.error("Error deleting category:", error);
      showError("Erro ao deletar categoria. Verifique sua conexão.");
      return;
    }

    set((state) => {
      const newCategoryLimits = { ...state.categoryLimits };
      delete newCategoryLimits[category];

      return {
        categories: state.categories.filter((c) => c !== category),
        categoryLimits: newCategoryLimits,
      };
    });

    showSuccess("Categoria deletada com sucesso!");
  },

  importData: async (data) => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado para importar dados.");
      return;
    }

    try {
      if (data.categories && data.categories.length > 0) {
        for (const cat of data.categories) {
          const { error } = await supabaseClient
            .from('categories')
            .insert([{ name: cat, user_id: user.id }])
            .select();

          if (error && error.code !== '23505') {
            console.error("Error importing category:", error);
          }
        }
      }

      if (data.transactions && data.transactions.length > 0) {
        const transactionsToInsert = data.transactions.map(t => ({
          description: t.description,
          type: t.type,
          category: t.category,
          value: t.value,
          date: t.date,
          month: t.date.substring(0, 7),
          user_id: user.id,
        }));

        const { error } = await supabaseClient
          .from('transactions')
          .insert(transactionsToInsert);

        if (error) {
          console.error("Error importing transactions:", error);
          showError(`Erro ao importar transações: ${error.message}`);
          return;
        }
      }

      const monthsToLoad = await getMonthsToLoad();
      await get().loadFromSupabase(monthsToLoad);
      showSuccess("Dados importados com sucesso!");
    } catch (error) {
      console.error("Import error:", error);
      showError("Erro ao importar dados. Verifique o console.");
    }
  },

  clearAllData: async () => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    const { error: transactionsError } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('user_id', user.id);

    const { error: categoriesError } = await supabaseClient
      .from('categories')
      .delete()
      .eq('user_id', user.id);

    if (transactionsError || categoriesError) {
      console.error("Error clearing data:", transactionsError || categoriesError);
      showError("Erro ao limpar dados. Verifique sua conexão.");
      return;
    }

    for (const cat of DEFAULT_CATEGORIES) {
      const { error } = await supabaseClient
        .from('categories')
        .insert([{ name: cat, user_id: user.id }]);

      if (error && error.code !== '23505') {
        console.error("Error inserting category:", error);
      }
    }

    set({
      transactions: [],
      categories: [...DEFAULT_CATEGORIES],
      monthsData: {},
    });

    const monthsToLoad = await getMonthsToLoad();
    await get().loadFromSupabase(monthsToLoad);
  },

  addRecurringTransaction: async (recurring: Omit<RecurringTransaction, "id" | "user_id" | "created_at">) => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    console.log('DEBUG: About to add recurring transaction:', { ...recurring, user_id: user.id });

    const { data, error } = await supabaseClient
      .from('recurring_transactions')
      .insert([{ ...recurring, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error("Error adding recurring transaction:", error);
      showError("Erro ao criar transação recorrente");
      return;
    }

    set((state) => {
      const newState = {
        recurringTransactions: [...state.recurringTransactions, data],
      };
      return newState;
    });

    // Reload data to generate predicted transactions
    const monthsToLoad = await getMonthsToLoad();
    await get().loadFromSupabase(monthsToLoad);

    showSuccess("Transação recorrente criada!");
  },

  updateRecurringTransaction: async (id: string, updates: Partial<RecurringTransaction>) => {
    const supabaseClient = createClient();

    const { error } = await supabaseClient
      .from('recurring_transactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      showError("Erro ao atualizar transação recorrente");
      console.error(error);
      return;
    }

    set((state) => ({
      recurringTransactions: state.recurringTransactions.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));

    // Reload data to update predicted transactions
    const monthsToLoad = await getMonthsToLoad();
    await get().loadFromSupabase(monthsToLoad);

    showSuccess("Transação recorrente atualizada!");
  },

  deleteRecurringTransaction: async (id: string) => {
    const supabaseClient = createClient();

    // First, delete all transactions that reference this recurring transaction
    const { error: transactionsError } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('recurring_id', id);

    if (transactionsError) {
      console.error("Error deleting related transactions:", transactionsError);
      showErrorToast("Erro ao deletar transações relacionadas");
      return;
    }

    // Then delete the recurring transaction
    const { error } = await supabaseClient
      .from('recurring_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      showErrorToast("Erro ao deletar transação recorrente");
      console.error(error);
      return;
    }

    set((state) => ({
      recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
    }));

    // Reload data to update UI
    const monthsToLoad = await getMonthsToLoad();
    await get().loadFromSupabase(monthsToLoad);

    showSuccessToast("Transação recorrente deletada!");
  },

  loadRecurringTransactions: async () => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return;
    }

    const { data, error } = await supabaseClient
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error("Error loading recurring transactions:", error);
      return;
    }

    // Garantir que valores sejam números
    const processedData = (data || []).map(t => {
      let numValue: number;

      if (typeof t.value === 'string') {
        // Se for string, remover pontos de milhar e trocar vírgula por ponto
        const cleanValue = t.value.replace(/\./g, '').replace(',', '.');
        numValue = parseFloat(cleanValue) || 0;
      } else {
        numValue = Number(t.value) || 0;
      }

      return {
        ...t,
        value: numValue,
      };
    });

    set({ recurringTransactions: processedData });
  },

  generatePredictedTransactions: (monthsAhead: number = 12): Transaction[] => {
    const state = get();
    const predicted: Transaction[] = [];
    const today = new Date();

    state.recurringTransactions.forEach((recurring) => {
      if (!recurring.is_active) return;

      const startDate = new Date(recurring.start_date);
      const endDate = recurring.end_date ? new Date(recurring.end_date) : null;

      // Calculate how many months back from today we need to go to reach start_date
      const startYear = startDate.getFullYear();
      const startMonthNum = startDate.getMonth();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();

      const monthsFromStartToToday = (todayYear - startYear) * 12 + (todayMonth - startMonthNum);
      const monthsToGenerate = monthsFromStartToToday + monthsAhead + 1; // +1 to include current month

      for (let i = 0; i < monthsToGenerate; i++) {
        const targetDate = new Date(startYear, startMonthNum + i, recurring.day_of_month);
        const month = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

        // Skip if before start date
        if (targetDate < startDate) continue;

        // Skip if after end date
        if (endDate && targetDate > endDate) continue;

        const dateStr = `${month}-${String(targetDate.getDate()).padStart(2, '0')}`;

        const currentInstallment = recurring.recurrence_type === 'installment'
          ? i + 1
          : undefined;

        // Skip if installment exceeds total
        if (recurring.recurrence_type === 'installment' &&
            currentInstallment &&
            recurring.total_installments &&
            currentInstallment > recurring.total_installments) {
          continue;
        }

        let calculatedValue = typeof recurring.value === 'string' ? parseFloat(recurring.value) : Number(recurring.value);

        if (recurring.recurrence_type === 'variable_by_income') {
          let incomeValue = 0;

          if (recurring.selected_income_id) {
            // Use specific selected income transaction
            const selectedIncome = state.transactions.find(
              t => t.id === recurring.selected_income_id && t.date.startsWith(month)
            );
            incomeValue = selectedIncome ? selectedIncome.value : 0;
          } else {
            // Use total income (sum of all income transactions for the month)
            incomeValue = state.transactions
              .filter(t =>
                t.type === 'income' &&
                t.date.startsWith(month)
              )
              .reduce((sum, t) => sum + t.value, 0);
          }

          calculatedValue = (incomeValue * recurring.value) / 100;
        }

        const predictedTransaction = {
          id: `predicted-${recurring.id}-${month}`,
          description: recurring.recurrence_type === 'installment'
            ? `${recurring.description} (${currentInstallment}/${recurring.total_installments})`
            : recurring.description,
          type: recurring.type as 'income' | 'expense',
          category: recurring.category,
          value: calculatedValue,
          date: dateStr,
          recurring_id: recurring.id,
          is_predicted: true,
          current_installment: currentInstallment,
          total_installments: recurring.total_installments,
        };

        predicted.push(predictedTransaction);
      }
    });

    // Filtrar as transações que foram excluídas pelo usuário
    const excludedIds = state.excludedPredictedIds;
    const filteredPredicted = predicted.filter(predicted => !excludedIds.includes(predicted.id));

    return filteredPredicted;
  },
}));

