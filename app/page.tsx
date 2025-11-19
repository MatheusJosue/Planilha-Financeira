"use client";

import { Row, Col } from "react-bootstrap";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpensesByCategoryChart } from "@/components/Charts/ExpensesByCategoryChart";
import { FinancialStats } from "@/components/FinancialStats";
import { IncomeVsExpenseChart } from "@/components/Charts/IncomeVsExpenseChart";
import { MonthSelector } from "@/components/MonthSelector";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useFinanceStore } from "@/store/financeStore";

export default function DashboardPage() {
  const { isLoaded } = useFinanceStore();

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="display-5 fw-bold gradient-text mb-2">
          Dashboard Financeiro
        </h1>
        <p className="text-muted">Acompanhe suas finanças em tempo real</p>
      </div>

      {isLoaded && <MonthSelector />}

      {!isLoaded ? (
        <DashboardSkeleton />
      ) : (
        <>
          <SummaryCards />

          <Row className="g-4">
            <Col lg={6}>
              <div
                className="animate-fade-in h-100"
                style={{ animationDelay: "0.3s" }}
              >
                <ExpensesByCategoryChart />
              </div>
            </Col>
            <Col lg={6}>
              <div
                className="animate-fade-in h-100"
                style={{ animationDelay: "0.4s" }}
              >
                <IncomeVsExpenseChart />
              </div>
            </Col>
            <Col lg={12}>
              <div
                className="animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <FinancialStats />
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
