import { create } from "zustand";
import { Transaction, FinanceData, DEFAULT_CATEGORIES } from "@/types";
import { createClient } from "@/lib/supabase-client";

interface MonthData {
  transactions: Transaction[];
}

interface FinanceStore extends FinanceData {
  isLoaded: boolean;
  currentMonth: string;
  monthsData: Record<string, MonthData>;
  setCurrentMonth: (month: string) => void;
  createNewMonth: (month: string, copyFromPrevious?: boolean) => Promise<void>;
  getAvailableMonths: () => string[];
  loadFromSupabase: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  importData: (data: FinanceData) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  transactions: [],
  categories: [...DEFAULT_CATEGORIES],
  isLoaded: false,
  currentMonth: getCurrentMonth(),
  monthsData: {},

  setCurrentMonth: (month: string) => {
    set({ currentMonth: month });
    const state = get();
    const monthData = state.monthsData[month];
    if (monthData) {
      set({ transactions: monthData.transactions });
    } else {
      set({ transactions: [] });
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
          alert("Você precisa estar logado.");
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

      console.log("Loading data for user:", user.id);

      const { data: categoriesData } = await supabaseClient
        .from('categories')
        .select('name')
        .eq('user_id', user.id)
        .order('name');

      let categories: string[];
      
      if (!categoriesData || categoriesData.length === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await supabaseClient
            .from('categories')
            .insert([{ name: cat, user_id: user.id }])
            .select();
        }
        categories = [...DEFAULT_CATEGORIES];
      } else {
        categories = categoriesData.map(c => c.name);
      }

      const { data: transactionsData, error } = await supabaseClient
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      console.log("Transactions loaded:", transactionsData?.length || 0);

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

      if (transactionsData && transactionsData.length > 0) {
        transactionsData.forEach((t: { id: string; description: string; type: string; category: string; value: number; date: string }) => {
          const month = t.date.substring(0, 7);
          if (!monthsData[month]) {
            monthsData[month] = { transactions: [] };
          }
          monthsData[month].transactions.push({
            id: t.id,
            description: t.description,
            type: t.type as 'income' | 'expense',
            category: t.category,
            value: Number(t.value),
            date: t.date,
          });
        });
      }

      if (!monthsData[currentMonth]) {
        monthsData[currentMonth] = { transactions: [] };
      }

      set({
        monthsData,
        currentMonth,
        transactions: monthsData[currentMonth]?.transactions || [],
        categories,
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
      alert("Você precisa estar logado para adicionar transações.");
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
      alert("Erro ao adicionar transação. Verifique sua conexão.");
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
      alert("Erro ao atualizar transação. Verifique sua conexão.");
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
    const supabaseClient = createClient();
    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting transaction:", error);
      alert("Erro ao deletar transação. Verifique sua conexão.");
      return;
    }

    const state = get();
    const updatedTransactions = state.transactions.filter((t) => t.id !== id);

    set((state) => ({
      transactions: updatedTransactions,
      monthsData: {
        ...state.monthsData,
        [state.currentMonth]: { transactions: updatedTransactions },
      },
    }));
  },

  addCategory: async (category) => {
    const state = get();
    if (state.categories.includes(category)) {
      return;
    }

    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      alert("Você precisa estar logado para adicionar categorias.");
      return;
    }

    const { error } = await supabaseClient
      .from('categories')
      .insert([{ name: category, user_id: user.id }]);

    if (error) {
      if (error.code === '23505') {
        console.log("Category already exists");
        set((state) => ({
          categories: [...state.categories, category],
        }));
        return;
      }
      console.error("Error adding category:", error);
      alert("Erro ao adicionar categoria. Verifique sua conexão.");
      return;
    }

    set((state) => ({
      categories: [...state.categories, category],
    }));
  },

  deleteCategory: async (category) => {
    const supabaseClient = createClient();
    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('name', category);

    if (error) {
      console.error("Error deleting category:", error);
      alert("Erro ao deletar categoria. Verifique sua conexão.");
      return;
    }

    set((state) => ({
      categories: state.categories.filter((c) => c !== category),
    }));
  },

  importData: async (data) => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      alert("Você precisa estar logado para importar dados.");
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
          alert(`Erro ao importar transações: ${error.message}`);
          return;
        }
      }

      await get().loadFromSupabase();
      alert("Dados importados com sucesso!");
    } catch (error) {
      console.error("Import error:", error);
      alert("Erro ao importar dados. Verifique o console.");
    }
  },

  clearAllData: async () => {
    const supabaseClient = createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      alert("Você precisa estar logado.");
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
      alert("Erro ao limpar dados. Verifique sua conexão.");
      return;
    }

    for (const cat of DEFAULT_CATEGORIES) {
      await supabaseClient
        .from('categories')
        .insert([{ name: cat, user_id: user.id }]);
    }

    set({
      transactions: [],
      categories: [...DEFAULT_CATEGORIES],
      monthsData: {},
    });

    await get().loadFromSupabase();
  },
}));
