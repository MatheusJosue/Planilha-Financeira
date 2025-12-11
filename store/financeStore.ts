import { create } from "zustand";
import { Transaction, FinanceData, DEFAULT_CATEGORIES, RecurringTransaction } from "@/types";
import { createClient } from "@/lib/supabase-client";
import { showError, showSuccess, showErrorToast, showSuccessToast } from "@/lib/sweetalert";

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
  setCurrentMonth: (month: string) => void;
  createNewMonth: (month: string, copyFromPrevious?: boolean) => Promise<void>;
  getAvailableMonths: () => string[];
  toggleShowMonthPicker: (show: boolean) => void;
  loadFromSupabase: () => Promise<void>;
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
  currentMonth: getCurrentMonth(),
  monthsData: {},
  recurringTransactions: [],
  excludedPredictedIds: loadExcludedIds(),
  showMonthPicker: false,

  setCurrentMonth: (month: string) => {
    const state = get();
    const monthData = state.monthsData[month];

    saveCurrentMonth(month); // Salvar no localStorage

    if (monthData) {
      set({
        currentMonth: month,
        transactions: monthData.transactions
      });
    } else {
      set({
        currentMonth: month,
        transactions: []
      });
    }
  },

  getAvailableMonths: () => {
    const state = get();
    return Object.keys(state.monthsData).sort().reverse();
  },

  createNewMonth: async (month: string, copyFromPrevious = false) => {
    const state = get();

    if (state.monthsData[month]) {
      get().setCurrentMonth(month);
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

    set((state) => ({
      monthsData: {
        ...state.monthsData,
        [month]: { transactions: newTransactions },
      },
      currentMonth: month,
      transactions: newTransactions,
    }));
  },

  toggleShowMonthPicker: (show: boolean) => {
    set({ showMonthPicker: show });
  },

  loadFromSupabase: async () => {
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

      const { data: transactionsData, error } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

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


      const predictedTransactions = get().generatePredictedTransactions(12);

      if (transactionsData && transactionsData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transactionsData.forEach((t: any) => {
          const month = t.date.substring(0, 7);
          if (!monthsData[month]) {
            monthsData[month] = { transactions: [] };
          }

          // Processar valor corretamente
          let numValue: number;
          if (typeof t.value === 'string') {
            const cleanValue = t.value.replace(/\./g, '').replace(',', '.');
            numValue = parseFloat(cleanValue) || 0;
          } else {
            numValue = Number(t.value) || 0;
          }

          monthsData[month].transactions.push({
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
          });
        });
      }

      // Filtrar transações previstas que foram excluídas antes de adicionar
      const excludedIds = get().excludedPredictedIds;

      predictedTransactions.forEach((t) => {
        // Pular se foi excluída pelo usuário
        if (excludedIds.includes(t.id)) {
          return;
        }

        const month = t.date.substring(0, 7);
        if (!monthsData[month]) {
          monthsData[month] = { transactions: [] };
        }

        // Check if a real transaction already exists for this predicted transaction
        const hasRealTransaction = monthsData[month].transactions.some(existing => {
          // Must not be predicted
          if (existing.is_predicted) return false;

          // If no recurring_id, it's not from recurring transactions, so don't filter
          if (!t.recurring_id) return false;

          // Must have the same recurring_id
          if (existing.recurring_id !== t.recurring_id) return false;

          // Must be in the same month
          if (existing.date.substring(0, 7) !== t.date.substring(0, 7)) return false;

          // For installments, also check the installment number
          if (t.current_installment && t.total_installments) {
            return existing.current_installment === t.current_installment &&
                   existing.total_installments === t.total_installments;
          }

          // For regular recurring transactions, matching recurring_id and same month is enough
          return true;
        });

        // Also check if the same predicted transaction already exists in the month data
        const hasPredictedTransaction = monthsData[month].transactions.some(existing => {
          // Only compare with predicted transactions
          if (!existing.is_predicted) return false;

          // Check if it's the same predicted transaction by ID
          return existing.id === t.id;
        });

        if (!hasRealTransaction && !hasPredictedTransaction) {
          monthsData[month].transactions.push(t);
        }
      });

      if (!monthsData[currentMonth]) {
        monthsData[currentMonth] = { transactions: [] };
      }

      // Restaurar o mês salvo se existir
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
    const state = get();
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

    if (data) {
      const newTransaction: Transaction = {
        id: data.id,
        description: data.description,
        type: data.type as 'income' | 'expense',
        category: data.category,
        value: Number(data.value),
        date: data.date,
      };

      const updatedTransactions = [...state.transactions, newTransaction];

      set((state) => ({
        transactions: updatedTransactions,
        monthsData: {
          ...state.monthsData,
          [state.currentMonth]: { transactions: updatedTransactions },
        },
      }));
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
      await get().loadFromSupabase();
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

      await get().loadFromSupabase();
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

    await get().loadFromSupabase();
  },

  addRecurringTransaction: async (recurring: Omit<RecurringTransaction, "id" | "user_id" | "created_at">) => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      showError("Você precisa estar logado.");
      return;
    }

    const { data, error } = await supabaseClient
      .from('recurring_transactions')
      .insert([{ ...recurring, user_id: user.id }])
      .select()
      .single();

    if (error) {
      showError("Erro ao criar transação recorrente");
      console.error(error);
      return;
    }

    set((state) => ({
      recurringTransactions: [...state.recurringTransactions, data],
    }));

    // Reload data to generate predicted transactions
    await get().loadFromSupabase();

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
    await get().loadFromSupabase();

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
    await get().loadFromSupabase();

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
      if (!recurring.is_active) {
        return;
      }

      const startDate = new Date(recurring.start_date);

      for (let i = 0; i <= monthsAhead; i++) {
        const targetDate = new Date(today.getFullYear(), today.getMonth() + i, recurring.day_of_month);

        if (targetDate < startDate) continue;
        if (recurring.end_date && targetDate > new Date(recurring.end_date)) continue;

        if (recurring.recurrence_type === 'installment' && recurring.total_installments) {
          const monthsSinceStart = (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
                                   (targetDate.getMonth() - startDate.getMonth());
          if (monthsSinceStart >= recurring.total_installments) continue;
        }

        const month = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        const dateStr = `${month}-${String(targetDate.getDate()).padStart(2, '0')}`;

        // Calculate current installment number for installment type
        const currentInstallment = recurring.recurrence_type === 'installment'
          ? (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
            (targetDate.getMonth() - startDate.getMonth()) + 1
          : undefined;

        const predictedTransaction = {
          id: `predicted-${recurring.id}-${month}`,
          description: recurring.recurrence_type === 'installment'
            ? `${recurring.description} (${currentInstallment}/${recurring.total_installments})`
            : recurring.description,
          type: recurring.type as 'income' | 'expense',
          category: recurring.category,
          value: typeof recurring.value === 'string' ? parseFloat(recurring.value) : Number(recurring.value),
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
    return predicted.filter(predicted => !excludedIds.includes(predicted.id));
  },
}));

