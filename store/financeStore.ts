import { create } from "zustand";
import { Transaction, FinanceData, DEFAULT_CATEGORIES } from "@/types";

interface MonthData {
  transactions: Transaction[];
}

interface FinanceStore extends FinanceData {
  isLoaded: boolean;
  currentMonth: string;
  monthsData: Record<string, MonthData>;
  setCurrentMonth: (month: string) => void;
  createNewMonth: (month: string, copyFromPrevious?: boolean) => void;
  getAvailableMonths: () => string[];
  loadFromLocal: () => void;
  saveToLocal: () => void;
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  importData: (data: FinanceData) => void;
  clearAllData: () => void;
}

const STORAGE_KEY = "planilha-financeira-data";

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

  createNewMonth: (month: string, copyFromPrevious = false) => {
    const state = get();
    
    if (state.monthsData[month]) {
      get().setCurrentMonth(month);
      return;
    }

    let newTransactions: Transaction[] = [];

    if (copyFromPrevious) {
      const months = Object.keys(state.monthsData).sort();
      const previousMonth = months[months.length - 1];
      
      if (previousMonth && state.monthsData[previousMonth]) {
        const prevTransactions = state.monthsData[previousMonth].transactions;
        newTransactions = prevTransactions.map((t) => ({
          ...t,
          id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: t.date.replace(/^\d{4}-\d{2}/, month),
        }));
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

    get().saveToLocal();
  },

  loadFromLocal: () => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const currentMonth = getCurrentMonth();
        
        if (data.transactions && !data.monthsData) {
          const monthsData: Record<string, MonthData> = {};
          
          data.transactions.forEach((t: Transaction) => {
            const month = t.date.substring(0, 7);
            if (!monthsData[month]) {
              monthsData[month] = { transactions: [] };
            }
            monthsData[month].transactions.push(t);
          });

          set({
            monthsData,
            currentMonth,
            transactions: monthsData[currentMonth]?.transactions || [],
            categories: data.categories || [...DEFAULT_CATEGORIES],
            isLoaded: true,
          });
        } else {
          set({
            monthsData: data.monthsData || {},
            currentMonth: data.currentMonth || currentMonth,
            transactions: data.monthsData?.[data.currentMonth || currentMonth]?.transactions || [],
            categories: data.categories || [...DEFAULT_CATEGORIES],
            isLoaded: true,
          });
        }
      } else {
        const currentMonth = getCurrentMonth();
        set({ 
          isLoaded: true,
          currentMonth,
          monthsData: {
            [currentMonth]: { transactions: [] }
          }
        });
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      set({ isLoaded: true });
    }
  },

  saveToLocal: () => {
    if (typeof window === "undefined") return;
    
    try {
      const state = get();
      const dataToSave = {
        monthsData: state.monthsData,
        currentMonth: state.currentMonth,
        categories: state.categories,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  },

  addTransaction: (transaction) => {
    const state = get();
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedTransactions = [...state.transactions, newTransaction];

    set((state) => ({
      transactions: updatedTransactions,
      monthsData: {
        ...state.monthsData,
        [state.currentMonth]: { transactions: updatedTransactions },
      },
    }));
    
    get().saveToLocal();
  },

  updateTransaction: (id, updates) => {
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
    
    get().saveToLocal();
  },

  deleteTransaction: (id) => {
    const state = get();
    const updatedTransactions = state.transactions.filter((t) => t.id !== id);

    set((state) => ({
      transactions: updatedTransactions,
      monthsData: {
        ...state.monthsData,
        [state.currentMonth]: { transactions: updatedTransactions },
      },
    }));
    
    get().saveToLocal();
  },

  addCategory: (category) => {
    set((state) => {
      if (state.categories.includes(category)) {
        return state;
      }
      return {
        categories: [...state.categories, category],
      };
    });
    
    get().saveToLocal();
  },

  deleteCategory: (category) => {
    set((state) => ({
      categories: state.categories.filter((c) => c !== category),
    }));
    
    get().saveToLocal();
  },

  importData: (data) => {
    set({
      transactions: data.transactions || [],
      categories: data.categories || [...DEFAULT_CATEGORIES],
    });
    
    get().saveToLocal();
  },

  clearAllData: () => {
    set({
      transactions: [],
      categories: [...DEFAULT_CATEGORIES],
    });
    
    get().saveToLocal();
  },
}));
