"use client";

import { Card } from "react-bootstrap";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { FiRepeat, FiShoppingCart } from "react-icons/fi";
import { useMemo } from "react";

export function RecurringVsVariableChart() {
  const { transactions } = useFinanceStore();

  const stats = useMemo(() => {
    // Separar transações do mês atual (despesas)
    const expenses = transactions.filter((t) => t.type === "expense");

    // Transações fixas: que vieram de recorrentes (têm recurring_id) OU são previstas (is_predicted)
    const recurringExpenses = expenses.filter(
      (t) => t.recurring_id || t.is_predicted
    );

    // Transações variáveis: sem recurring_id E não previstas
    const variableExpenses = expenses.filter(
      (t) => !t.recurring_id && !t.is_predicted
    );

    const recurringTotal = recurringExpenses.reduce(
      (sum, t) => sum + t.value,
      0
    );
    const variableTotal = variableExpenses.reduce((sum, t) => sum + t.value, 0);
    const total = recurringTotal + variableTotal;

    const recurringPercentage = total > 0 ? (recurringTotal / total) * 100 : 0;
    const variablePercentage = total > 0 ? (variableTotal / total) * 100 : 0;

    return {
      recurringTotal,
      variableTotal,
      total,
      recurringPercentage,
      variablePercentage,
      recurringCount: recurringExpenses.length,
      variableCount: variableExpenses.length,
    };
  }, [transactions]);

  return (
    <Card className="shadow-card h-100">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h5 className="mb-0 fw-bold d-flex align-items-center">
            <FiRepeat className="me-2" />
            Despesas Fixas vs Variáveis
          </h5>
        </div>

        <div className="mb-4">
          {/* Barra de progresso */}
          <div
            className="position-relative"
            style={{
              height: "60px",
              borderRadius: "12px",
              overflow: "hidden",
              background: "var(--border-color)",
            }}
          >
            {stats.recurringPercentage > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${stats.recurringPercentage}%`,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                {stats.recurringPercentage > 15 &&
                  `${stats.recurringPercentage.toFixed(0)}%`}
              </div>
            )}
            {stats.variablePercentage > 0 && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  height: "100%",
                  width: `${stats.variablePercentage}%`,
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                {stats.variablePercentage > 15 &&
                  `${stats.variablePercentage.toFixed(0)}%`}
              </div>
            )}
          </div>
        </div>

        <div className="row g-3">
          {/* Despesas Fixas */}
          <div className="col-6">
            <div
              className="p-3"
              style={{
                background: "rgba(102, 126, 234, 0.1)",
                borderRadius: "12px",
                border: "2px solid rgba(102, 126, 234, 0.3)",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <FiRepeat size={20} style={{ color: "#667eea" }} />
                <span
                  className="fw-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Despesas Fixas
                </span>
              </div>
              <div className="text-center">
                <h3 className="mb-1 fw-bold" style={{ color: "#667eea" }}>
                  {formatCurrency(stats.recurringTotal)}
                </h3>
                <small style={{ color: "var(--text-muted)" }}>
                  {stats.recurringCount} transação(ões)
                </small>
              </div>
            </div>
          </div>

          {/* Despesas Variáveis */}
          <div className="col-6">
            <div
              className="p-3"
              style={{
                background: "rgba(245, 87, 108, 0.1)",
                borderRadius: "12px",
                border: "2px solid rgba(245, 87, 108, 0.3)",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <FiShoppingCart size={20} style={{ color: "#f5576c" }} />
                <span
                  className="fw-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Despesas Variáveis
                </span>
              </div>
              <div className="text-center">
                <h3 className="mb-1 fw-bold" style={{ color: "#f5576c" }}>
                  {formatCurrency(stats.variableTotal)}
                </h3>
                <small style={{ color: "var(--text-muted)" }}>
                  {stats.variableCount} transação(ões)
                </small>
              </div>
            </div>
          </div>
        </div>

        {stats.total === 0 && (
          <div className="text-center py-4">
            <p style={{ color: "var(--text-muted)" }}>
              Nenhuma despesa registrada neste mês
            </p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
