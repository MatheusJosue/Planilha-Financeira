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

export default function DashboardPage() {
  const { isLoaded } = useFinanceStore();
  const [dashboardConfig, setDashboardConfig] = useState({
    balance: true,
    monthlyIncome: true,
    monthlyExpense: true,
    periodCards: true,
    charts: true,
    recentTransactions: true,
    // New individual chart visibility settings
    expensesByCategory: true,
    incomeVsExpense: true,
    recurringVsVariable: true,
    futureProjection: true,
    financialStats: true,
  });

  useEffect(() => {
    loadDashboardConfig();
  }, []);

  useEffect(() => {
    console.log("Configuração do dashboard atualizada:", dashboardConfig);
  }, [dashboardConfig]);

  const loadDashboardConfig = async () => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data: settings } = await supabaseClient
        .from("user_settings")
        .select("dashboard_config")
        .eq("user_id", user.id)
        .single();

      if (settings?.dashboard_config) {
        setDashboardConfig(settings.dashboard_config);
      }
      console.log(
        "Carregando configurações do dashboard:",
        settings?.dashboard_config
      );
    } catch (error) {
      console.error("Erro ao carregar configurações do dashboard:", error);
    }
  };

  const handleChartRemove = async (chartKey: string) => {
    const updatedConfig = {
      ...dashboardConfig,
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
          setDashboardConfig(dashboardConfig);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar configurações do dashboard:", error);
      // Revert the change if saving failed
      setDashboardConfig(dashboardConfig);
    }
  };

  return (
    <Container fluid className="animate-fade-in">
      {isLoaded && <MonthSelector />}

      {!isLoaded ? (
        <DashboardSkeleton />
      ) : (
        <>
          <SummaryCards dashboardConfig={dashboardConfig} />

          {dashboardConfig.charts && (
            <Row className="g-4">
              <Col lg={8}>
                <Row className="g-4">
                  <Col lg={12}>
                    {dashboardConfig.expensesByCategory &&
                      dashboardConfig.charts && (
                        <Col lg={12}>
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
                        </Col>
                      )}
                  </Col>
                  {dashboardConfig.recentTransactions &&
                    dashboardConfig.financialStats &&
                    dashboardConfig.charts && (
                      <Col lg={12}>
                        <div
                          className="animate-fade-in"
                          style={{ animationDelay: "0.7s" }}
                        >
                          <ChartWrapper
                            title="Estatísticas Financeiras"
                            configKey="financialStats"
                            onRemove={handleChartRemove}
                          >
                            <FinancialStats />
                          </ChartWrapper>
                        </div>
                      </Col>
                    )}
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
        </>
      )}
    </Container>
  );
}
