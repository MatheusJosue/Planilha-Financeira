"use client";

import { useState, useEffect } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpensesByCategoryChart } from "@/components/Charts/ExpensesByCategoryChart";
import { FinancialStats } from "@/components/FinancialStats";
import { IncomeVsExpenseChart } from "@/components/Charts/IncomeVsExpenseChart";
import { RecurringVsVariableChart } from "@/components/Charts/RecurringVsVariableChart";
import { FutureProjectionChart } from "@/components/Charts/FutureProjectionChart";
import { MonthSelector } from "@/components/MonthSelector";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useFinanceStore } from "@/store/financeStore";
import { ChartWrapper } from "@/components/ChartWrapper";

// Define the type for dashboard configuration
type DashboardConfig = {
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

export default function DashboardPage() {
  const { isLoaded } = useFinanceStore();

  // Configuration state - starts as null to indicate not yet loaded
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [configLoadComplete, setConfigLoadComplete] = useState(false);

  // Load config first, before rendering the dashboard
  useEffect(() => {
    loadDashboardConfig();
  }, []);

  useEffect(() => {
    if (dashboardConfig) {
      console.log("Configuração do dashboard atualizada:", dashboardConfig);
    }
  }, [dashboardConfig]);

  const loadDashboardConfig = async () => {
    // Initialize with default config to have something to work with
    const defaultConfig = {
      balance: true,
      monthlyIncome: true,
      monthlyExpense: true,
      periodCards: true,
      charts: true, // Default to true initially
      recentTransactions: true,
      // New individual chart visibility settings
      expensesByCategory: true,
      incomeVsExpense: true,
      recurringVsVariable: true,
      futureProjection: true,
      financialStats: true,
    };

    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      let finalConfig = defaultConfig; // Start with defaults

      if (user) {
        const { data: settings } = await supabaseClient
          .from("user_settings")
          .select("dashboard_config")
          .eq("user_id", user.id)
          .single();

        if (settings?.dashboard_config) {
          // Merge database config with defaults to ensure all properties exist
          finalConfig = { ...defaultConfig, ...settings.dashboard_config };
        }
      }

      // Set the final config (either defaults or from DB)
      setDashboardConfig(finalConfig);
    } catch (error) {
      console.error("Erro ao carregar configurações do dashboard:", error);
      // On error, still set the default config to allow rendering
      setDashboardConfig(defaultConfig);
    } finally {
      setConfigLoadComplete(true); // Mark loading as complete
    }
  };

  const handleChartRemove = async (chartKey: string) => {
    if (!dashboardConfig) return; // Guard clause

    // Explicitly map to ensure all fields remain as boolean
    const updatedConfig: DashboardConfig = {
      balance: dashboardConfig.balance,
      monthlyIncome: dashboardConfig.monthlyIncome,
      monthlyExpense: dashboardConfig.monthlyExpense,
      periodCards: dashboardConfig.periodCards,
      charts: dashboardConfig.charts,
      recentTransactions: dashboardConfig.recentTransactions,
      expensesByCategory: dashboardConfig.expensesByCategory,
      incomeVsExpense: dashboardConfig.incomeVsExpense,
      recurringVsVariable: dashboardConfig.recurringVsVariable,
      futureProjection: dashboardConfig.futureProjection,
      financialStats: dashboardConfig.financialStats,
      [chartKey]: false,
    };

    setDashboardConfig(updatedConfig);

    // Save the updated configuration to Supabase
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (user) {
        const { error } = await supabaseClient.from("user_settings").upsert(
          {
            user_id: user.id,
            dashboard_config: updatedConfig,
          },
          { onConflict: "user_id" }
        );

        if (error) {
          console.error("Erro ao salvar configurações do dashboard:", error);
          // Revert the change if saving failed
          if (dashboardConfig) setDashboardConfig(dashboardConfig);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar configurações do dashboard:", error);
      // Revert the change if saving failed
      if (dashboardConfig) setDashboardConfig(dashboardConfig);
    }
  };

  // Only render after configuration is loaded to prevent flashing
  // But render as soon as config is available (no need to wait for all finance data)
  if (!configLoadComplete || !dashboardConfig) {
    return (
      <Container fluid>
        {isLoaded && <MonthSelector />}
        <DashboardSkeleton />
      </Container>
    );
  }

  return (
    <Container fluid className="animate-fade-in">
      {isLoaded && <MonthSelector />}

      <SummaryCards dashboardConfig={dashboardConfig} />

      {/* Render charts only if allowed by the loaded config */}
      {dashboardConfig.charts && (
        <Row className="g-4">
          <Col lg={8}>
            <Row className="g-4">
              <Col lg={12}>
                {dashboardConfig.recentTransactions &&
                  dashboardConfig.charts && (
                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "0.7s" }}
                  >
                    <ChartWrapper
                      title="Estatísticas Financeiras"
                      configKey="recentTransactions"
                      onRemove={handleChartRemove}
                    >
                      <FinancialStats />
                    </ChartWrapper>
                  </div>
                )}
              </Col>
              <Col lg={12}>
                {dashboardConfig.expensesByCategory &&
                  dashboardConfig.charts && (
                    <div
                      className="animate-fade-in h-100"
                      style={{ animationDelay: "0.5s" }}
                    >
                      <ChartWrapper
                        title="Despesas por Categoria"
                        configKey="expensesByCategory"
                        onRemove={handleChartRemove}
                      >
                        <ExpensesByCategoryChart />
                      </ChartWrapper>
                    </div>
                  )}
              </Col>
              {dashboardConfig.futureProjection &&
                dashboardConfig.charts && (
                  <Col lg={12}>
                    <div
                      className="animate-fade-in"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <ChartWrapper
                        title="Projeção Futura"
                        configKey="futureProjection"
                        onRemove={handleChartRemove}
                      >
                        <FutureProjectionChart />
                      </ChartWrapper>
                    </div>
                  </Col>
                )}
            </Row>
          </Col>

          <Col lg={4}>
            <Row className="g-4">
              {dashboardConfig.recurringVsVariable &&
                dashboardConfig.charts && (
                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "0.3s" }}
                  >
                    <ChartWrapper
                      title="Despesas Fixas vs Variáveis"
                      configKey="recurringVsVariable"
                      onRemove={handleChartRemove}
                    >
                      <RecurringVsVariableChart />
                    </ChartWrapper>
                  </div>
                )}

              {dashboardConfig.incomeVsExpense &&
                dashboardConfig.charts && (
                  <Col lg={12}>
                    <div
                      className="animate-fade-in h-100"
                      style={{ animationDelay: "0.6s" }}
                    >
                      <ChartWrapper
                        title="Receitas vs Despesas"
                        configKey="incomeVsExpense"
                        onRemove={handleChartRemove}
                      >
                        <IncomeVsExpenseChart />
                      </ChartWrapper>
                    </div>
                  </Col>
                )}
            </Row>
          </Col>
        </Row>
      )}
    </Container>
  );
}
