"use client";

import { Card } from "react-bootstrap";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { FiTrendingUp, FiCalendar } from "react-icons/fi";
import { useMemo } from "react";

export function FutureProjectionChart() {
  const { recurringTransactions, transactions } = useFinanceStore();

  const projections = useMemo(() => {
    const today = new Date();
    const months = [];

    // Calcular receitas e despesas fixas mensais
    const activeRecurring = recurringTransactions.filter((rt) => rt.is_active);

    const monthlyIncome = activeRecurring
      .filter((rt) => rt.type === "income")
      .reduce((sum, rt) => sum + rt.value, 0);

    const monthlyExpenses = activeRecurring
      .filter((rt) => rt.type === "expense")
      .reduce((sum, rt) => sum + rt.value, 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    // Calcular saldo atual (mês corrente)
    const currentMonthTransactions = transactions.filter(
      (t) => !t.is_predicted
    );
    const currentIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.value, 0);
    const currentExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);
    const currentBalance = currentIncome - currentExpenses;

    // Projetar próximos 3 meses
    let accumulatedBalance = currentBalance;

    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + i);

      const monthName = futureDate.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      accumulatedBalance += monthlyBalance;

      months.push({
        month: monthName,
        income: monthlyIncome,
        expenses: monthlyExpenses,
        balance: monthlyBalance,
        accumulated: accumulatedBalance,
      });
    }

    return {
      months,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      currentBalance,
    };
  }, [recurringTransactions, transactions]);

  return (
    <Card className="shadow-card h-100">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <FiTrendingUp className="me-2" />
            Projeção Financeira
          </h5>
          <small style={{ color: "var(--text-muted)" }}>Próximos 3 meses</small>
        </div>

        <div
          className="p-3 mb-4"
          style={{
            background: "rgba(102, 126, 234, 0.05)",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
          }}
        >
          <div className="row text-center g-3">
            <div className="col-4">
              <small style={{ color: "var(--text-muted)" }}>
                Receita Mensal
              </small>
              <div className="fw-bold text-success">
                {formatCurrency(projections.monthlyIncome)}
              </div>
            </div>
            <div className="col-4">
              <small style={{ color: "var(--text-muted)" }}>
                Despesa Mensal
              </small>
              <div className="fw-bold text-danger">
                {formatCurrency(projections.monthlyExpenses)}
              </div>
            </div>
            <div className="col-4">
              <small style={{ color: "var(--text-muted)" }}>Saldo Mensal</small>
              <div
                className={`fw-bold ${
                  projections.monthlyBalance >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {formatCurrency(projections.monthlyBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Projeções */}
        <div className="d-flex flex-column gap-3">
          {projections.months.map((month, index) => (
            <div
              key={index}
              className="p-3"
              style={{
                background: "var(--card-bg)",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <FiCalendar
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span
                    className="fw-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {month.month}
                  </span>
                </div>
                <div className="text-end">
                  <div
                    className={`fw-bold ${
                      month.accumulated >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatCurrency(month.accumulated)}
                  </div>
                  <small style={{ color: "var(--text-muted)" }}>
                    saldo acumulado
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projections.months.length === 0 && (
          <div className="text-center py-4">
            <p style={{ color: "var(--text-muted)" }}>
              Configure transações recorrentes para ver projeções
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
