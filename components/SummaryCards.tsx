"use client";

import { Card, Row, Col } from "react-bootstrap";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
} from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { useEffect, useState } from "react";

interface SummaryCardsProps {
  dashboardConfig?: {
    balance?: boolean;
    monthlyIncome?: boolean;
    monthlyExpense?: boolean;
    periodCards?: boolean;
    charts?: boolean;
    recentTransactions?: boolean;
  };
}

export function SummaryCards({ dashboardConfig }: SummaryCardsProps) {
  const { recurringTransactions, currentMonth, monthsData } = useFinanceStore();

  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
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
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settings) {
        setPeriodSeparationEnabled(settings.period_separation_enabled || false);
        setPeriod1End(settings.period_1_end || 15);
        setPeriod2Start(settings.period_2_start || 16);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const monthData = monthsData[currentMonth];
  const currentTransactions = monthData?.transactions || [];

  // Separar transações confirmadas e previstas
  const confirmedTransactions = currentTransactions.filter(
    (t) => !t.is_predicted
  );
  const predictedTransactions = currentTransactions.filter(
    (t) => t.is_predicted
  );

  // Calcular totais de transações confirmadas
  const totalIncome = confirmedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = confirmedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  // Calcular totais de transações previstas (não confirmadas)
  const predictedIncome = predictedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const predictedExpense = predictedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  // Totais incluindo previstas
  const totalIncomeWithRecurring = totalIncome + predictedIncome;
  const totalExpenseWithRecurring = totalExpense + predictedExpense;
  const balance = totalIncomeWithRecurring - totalExpenseWithRecurring;

  const expenseTransactionsPeriod1 = currentTransactions.filter((t) => {
    if (t.type !== "expense") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day <= period1End;
  });
  const expenseTransactionsPeriod2 = currentTransactions.filter((t) => {
    if (t.type !== "expense") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day >= period2Start;
  });

  const totalExpensePeriod1 = expenseTransactionsPeriod1.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalExpensePeriod2 = expenseTransactionsPeriod2.reduce(
    (sum, t) => sum + t.value,
    0
  );

  const incomeTransactionsPeriod1 = currentTransactions.filter((t) => {
    if (t.type !== "income") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day <= period1End;
  });
  const incomeTransactionsPeriod2 = currentTransactions.filter((t) => {
    if (t.type !== "income") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day >= period2Start;
  });

  const totalIncomePeriod1 = incomeTransactionsPeriod1.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalIncomePeriod2 = incomeTransactionsPeriod2.reduce(
    (sum, t) => sum + t.value,
    0
  );

  return (
    <>
      <Row id="summary-cards-container" className="g-4 mb-4">
        {(dashboardConfig?.monthlyIncome ?? true) && (
          <Col md={4}>
            <Card
              className="border-0 shadow-card h-100 animate-fade-in"
              style={{
                background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-white mb-1 small opacity-75 fw-semibold">
                      RECEITAS TOTAIS
                    </p>
                    <h2 className="mb-0 text-white fw-bold">
                      {formatCurrency(totalIncomeWithRecurring)}
                    </h2>
                    <small className="text-white opacity-75">
                      Confirmadas: {formatCurrency(totalIncome)}
                    </small>
                    <br />
                    <small className="text-white opacity-75">
                      Previstas: {formatCurrency(predictedIncome)}
                    </small>
                  </div>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "70px",
                      height: "70px",
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <FiTrendingUp size={32} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {(dashboardConfig?.monthlyExpense ?? true) && (
          <Col md={4}>
            <Card
              className="border-0 shadow-card h-100 animate-fade-in"
              style={{
                background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                animationDelay: "0.1s",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-white mb-1 small opacity-75 fw-semibold">
                      DESPESAS TOTAIS
                    </p>
                    <h2 className="mb-0 text-white fw-bold">
                      {formatCurrency(totalExpenseWithRecurring)}
                    </h2>
                    <small className="text-white opacity-75">
                      Confirmadas: {formatCurrency(totalExpense)}
                    </small>
                    <br />
                    <small className="text-white opacity-75">
                      Previstas: {formatCurrency(predictedExpense)}
                    </small>
                  </div>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "70px",
                      height: "70px",
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <FiTrendingDown size={32} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {(dashboardConfig?.balance ?? true) && (
          <Col md={4}>
            <Card
              className="border-0 shadow-card h-100 animate-fade-in"
              style={{
                background:
                  balance >= 0
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                animationDelay: "0.2s",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-white mb-1 small opacity-75 fw-semibold">
                      SALDO DO MÊS
                    </p>
                    <h2 className="mb-0 text-white fw-bold">
                      {formatCurrency(balance)}
                    </h2>
                    <small className="text-white opacity-75">
                      {balance >= 0 ? "Positivo ✓" : "Negativo ⚠"}
                    </small>
                  </div>
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "70px",
                      height: "70px",
                      background: "rgba(255, 255, 255, 0.2)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <FiDollarSign size={32} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Cards de Períodos - apenas se ativado */}
      {periodSeparationEnabled && (
        <Row className="g-4 mb-4">
          <Col md={6}>
            <Card className="border-0 shadow-card h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "50px",
                      height: "50px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <FiCalendar size={24} className="text-white" />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">
                      1º Período (dias 1 a {period1End})
                    </h6>
                    <small className="text-muted">Início do mês</small>
                  </div>
                </div>
                <Row className="g-3">
                  <Col xs={6}>
                    <div
                      className="p-3"
                      style={{
                        background: "rgba(40, 167, 69, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <small className="text-success fw-semibold d-block mb-1">
                        Receitas
                      </small>
                      <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                        {formatCurrency(totalIncomePeriod1)}
                      </div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div
                      className="p-3"
                      style={{
                        background: "rgba(220, 53, 69, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <small className="text-danger fw-semibold d-block mb-1">
                        Despesas
                      </small>
                      <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                        {formatCurrency(totalExpensePeriod1)}
                      </div>
                    </div>
                  </Col>
                </Row>
                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-semibold">
                      Saldo do Período
                    </span>
                    <span
                      className={`fw-bold ${
                        totalIncomePeriod1 - totalExpensePeriod1 >= 0
                          ? "text-success"
                          : "text-danger"
                      }`}
                      style={{ fontSize: "1.1rem" }}
                    >
                      {formatCurrency(totalIncomePeriod1 - totalExpensePeriod1)}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="border-0 shadow-card h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "50px",
                      height: "50px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <FiCalendar size={24} className="text-white" />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">
                      2º Período (dia {period2Start} em diante)
                    </h6>
                    <small className="text-muted">Final do mês</small>
                  </div>
                </div>
                <Row className="g-3">
                  <Col xs={6}>
                    <div
                      className="p-3"
                      style={{
                        background: "rgba(40, 167, 69, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <small className="text-success fw-semibold d-block mb-1">
                        Receitas
                      </small>
                      <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                        {formatCurrency(totalIncomePeriod2)}
                      </div>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div
                      className="p-3"
                      style={{
                        background: "rgba(220, 53, 69, 0.1)",
                        borderRadius: "8px",
                      }}
                    >
                      <small className="text-danger fw-semibold d-block mb-1">
                        Despesas
                      </small>
                      <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                        {formatCurrency(totalExpensePeriod2)}
                      </div>
                    </div>
                  </Col>
                </Row>
                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-semibold">
                      Saldo do Período
                    </span>
                    <span
                      className={`fw-bold ${
                        totalIncomePeriod2 - totalExpensePeriod2 >= 0
                          ? "text-success"
                          : "text-danger"
                      }`}
                      style={{ fontSize: "1.1rem" }}
                    >
                      {formatCurrency(totalIncomePeriod2 - totalExpensePeriod2)}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}
