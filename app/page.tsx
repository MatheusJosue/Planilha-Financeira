"use client";

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

  return (
    <Container fluid className="animate-fade-in">
      {isLoaded && <MonthSelector />}

      {!isLoaded ? (
        <DashboardSkeleton />
      ) : (
        <>
          <SummaryCards />

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
                <Col lg={12}>
                  <div
                    className="animate-fade-in"
                    style={{ animationDelay: "0.7s" }}
                  >
                    <FinancialStats />
                  </div>
                </Col>
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
        </>
      )}
    </Container>
  );
}
