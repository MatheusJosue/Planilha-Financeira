"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { useFinanceStore } from "@/store/financeStore";
import { showSuccess, showError } from "@/lib/sweetalert";

interface UserSettingsContextType {
  periodSeparationEnabled: boolean;
  period1End: number;
  period2Start: number;
  dashboardCards: {
    balance: boolean;
    monthlyIncome: boolean;
    monthlyExpense: boolean;
    periodCards: boolean;
    charts: boolean;
    recentTransactions: boolean;
    expensesByCategory: boolean;
    incomeVsExpense: boolean;
    recurringVsVariable: boolean;
    futureProjection: boolean;
    financialStats: boolean;
  };
  setPeriodSeparationEnabled: (value: boolean) => void;
  setPeriod1End: (value: number) => void;
  setPeriod2Start: (value: number) => void;
  setDashboardCards: (value: any) => void;
  loadUserSettings: () => Promise<void>;
  saveUserSettings: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);
  const [dashboardCards, setDashboardCards] = useState({
    balance: true,
    monthlyIncome: true,
    monthlyExpense: true,
    periodCards: true,
    charts: true,
    recentTransactions: true,
    // Individual chart settings
    expensesByCategory: true,
    incomeVsExpense: true,
    recurringVsVariable: true,
    futureProjection: true,
    financialStats: true,
  });

  const loadUserSettings = async () => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data: settings, error } = await supabaseClient
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar configurações:", error);
        return;
      }

      if (settings) {
        setPeriodSeparationEnabled(settings.period_separation_enabled || false);
        setPeriod1End(settings.period_1_end || 15);
        setPeriod2Start(settings.period_2_start || 16);

        if (settings.dashboard_config) {
          setDashboardCards(settings.dashboard_config);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveUserSettings = useCallback(async () => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showError("Você precisa estar logado para salvar configurações.");
        return;
      }

      const settingsData = {
        user_id: user.id,
        period_separation_enabled: periodSeparationEnabled,
        period_1_end: period1End,
        period_2_start: period2Start,
        dashboard_config: dashboardCards,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseClient
        .from("user_settings")
        .upsert(settingsData, { onConflict: "user_id" });

      if (error) {
        console.error("Erro ao salvar configurações:", error);
        showError("Erro ao salvar configurações.");
        return;
      }

      showSuccess("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      showError("Erro ao salvar configurações.");
    }
  }, [periodSeparationEnabled, period1End, period2Start, dashboardCards]);

  useEffect(() => {
    loadUserSettings();
  }, []);

  return (
    <UserSettingsContext.Provider
      value={{
        periodSeparationEnabled,
        period1End,
        period2Start,
        dashboardCards,
        setPeriodSeparationEnabled,
        setPeriod1End,
        setPeriod2Start,
        setDashboardCards,
        loadUserSettings,
        saveUserSettings,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error("useUserSettings must be used within a UserSettingsProvider");
  }
  return context;
};