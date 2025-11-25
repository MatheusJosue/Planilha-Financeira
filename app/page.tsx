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

export default function DashboardPage() {
  const { isLoaded } = useFinanceStore();
  const [dashboardConfig, setDashboardConfig] = useState({
    balance: true,
    monthlyIncome: true,
    monthlyExpense: true,
    periodCards: true,
    charts: true,
    recentTransactions: true,
  });

  useEffect(() => {
    loadDashboardConfig();
  }, []);

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
    } catch (error) {
      console.error("Erro ao carregar configurações do dashboard:", error);
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
                    <div
                      className="animate-fade-in"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <RecurringVsVariableChart />
                    </div>
                  </Col>
                  {dashboardConfig.recentTransactions && (
                    <Col lg={12}>
                      <div
                        className="animate-fade-in"
                        style={{ animationDelay: "0.7s" }}
                      >
                        <FinancialStats />
                      </div>
                    </Col>
                  )}
                  <Col lg={12}>
                    <div
                      className="animate-fade-in"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <FutureProjectionChart />
                    </div>
                  </Col>
                </Row>
              </Col>

              <Col lg={4}>
                <Row className="g-4">
                  <Col lg={12}>
                    <div
                      className="animate-fade-in h-100"
                      style={{ animationDelay: "0.5s" }}
                    >
                      <ExpensesByCategoryChart />
                    </div>
                  </Col>
                  <Col lg={12}>
                    <div
                      className="animate-fade-in h-100"
                      style={{ animationDelay: "0.6s" }}
                    >
                      <IncomeVsExpenseChart />
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  );
}
