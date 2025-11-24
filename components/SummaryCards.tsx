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

export function SummaryCards() {
  const { recurringTransactions, currentMonth, monthsData } = useFinanceStore();

  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("periodSeparationEnabled");
      const saved1 = localStorage.getItem("paymentPeriod1End");
      const saved2 = localStorage.getItem("paymentPeriod2Start");
      if (savedEnabled) setPeriodSeparationEnabled(savedEnabled === "true");
      if (saved1) setPeriod1End(parseInt(saved1));
      if (saved2) setPeriod2Start(parseInt(saved2));
    }
  }, []);

  const monthData = monthsData[currentMonth];
  const currentTransactions = monthData?.transactions || [];
  const activeRecurring = recurringTransactions.filter((t) => t.is_active);

  const normalTransactions = currentTransactions.filter((t) => !t.is_predicted);
  const totalIncome = normalTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = normalTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const recurringIncome = activeRecurring
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const recurringExpense = activeRecurring
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const totalIncomeWithRecurring = totalIncome + recurringIncome;
  const totalExpenseWithRecurring = totalExpense + recurringExpense;
  const balance = totalIncomeWithRecurring - totalExpenseWithRecurring;

  const expenseTransactionsPeriod1 = normalTransactions.filter((t) => {
    if (t.type !== "expense") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day <= period1End;
  });
  const expenseTransactionsPeriod2 = normalTransactions.filter((t) => {
    if (t.type !== "expense") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day >= period2Start;
  });
  const expenseRecurringPeriod1 = activeRecurring.filter(
    (t) => t.type === "expense" && t.day_of_month <= period1End
  );
  const expenseRecurringPeriod2 = activeRecurring.filter(
    (t) => t.type === "expense" && t.day_of_month >= period2Start
  );

  const totalExpensePeriod1 =
    expenseTransactionsPeriod1.reduce((sum, t) => sum + t.value, 0) +
    expenseRecurringPeriod1.reduce((sum, t) => sum + t.value, 0);
  const totalExpensePeriod2 =
    expenseTransactionsPeriod2.reduce((sum, t) => sum + t.value, 0) +
    expenseRecurringPeriod2.reduce((sum, t) => sum + t.value, 0);

  const incomeTransactionsPeriod1 = normalTransactions.filter((t) => {
    if (t.type !== "income") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day <= period1End;
  });
  const incomeTransactionsPeriod2 = normalTransactions.filter((t) => {
    if (t.type !== "income") return false;
    const day = parseInt(t.date.split("-")[2], 10);
    return day >= period2Start;
  });
  const incomeRecurringPeriod1 = activeRecurring.filter(
    (t) => t.type === "income" && t.day_of_month <= period1End
  );
  const incomeRecurringPeriod2 = activeRecurring.filter(
    (t) => t.type === "income" && t.day_of_month >= period2Start
  );

  const totalIncomePeriod1 =
    incomeTransactionsPeriod1.reduce((sum, t) => sum + t.value, 0) +
    incomeRecurringPeriod1.reduce((sum, t) => sum + t.value, 0);
  const totalIncomePeriod2 =
    incomeTransactionsPeriod2.reduce((sum, t) => sum + t.value, 0) +
    incomeRecurringPeriod2.reduce((sum, t) => sum + t.value, 0);

  return (
    <>
      <Row className="g-4 mb-4">
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
                    {
                      normalTransactions.filter((t) => t.type === "income")
                        .length
                    }{" "}
                    pontuais +{" "}
                    {activeRecurring.filter((t) => t.type === "income").length}{" "}
                    recorrentes
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
                    {
                      normalTransactions.filter((t) => t.type === "expense")
                        .length
                    }{" "}
                    pontuais +{" "}
                    {activeRecurring.filter((t) => t.type === "expense").length}{" "}
                    recorrentes
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
