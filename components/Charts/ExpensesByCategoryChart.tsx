"use client";

import { Card } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
  "#C06C84",
  "#6C5B7B",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name: string; value?: number; percent?: number }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-title">
          {data.name}
        </p>
        <p className="custom-tooltip-expense">
          💰 {formatCurrency(data.value || 0)}
        </p>
        <p style={{ color: "#666", margin: "4px 0", fontSize: "0.9rem" }}>
          📊 {((data.percent || 0) * 100).toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

export function ExpensesByCategoryChart() {
  const { transactions } = useFinanceStore();

  const expenses = transactions.filter((t) => t.type === "expense");

  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.value;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-card h-100">
        <Card.Body className="p-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
              }}
            >
              <span style={{ fontSize: "24px" }}>📊</span>
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Despesas por Categoria</h5>
              <small className="text-muted">Distribuição de gastos</small>
            </div>
          </div>
          <div className="text-center text-muted py-5">
            <div className="mb-3" style={{ fontSize: "3rem" }}>
              📈
            </div>
            <p>Nenhuma despesa registrada</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const totalExpenses = expenses.reduce((sum, t) => sum + t.value, 0);
  const topCategory = data[0];

  return (
    <Card className="border-0 shadow-card h-100">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
            }}
          >
            <span style={{ fontSize: "24px" }}>📊</span>
          </div>
          <div>
            <h5 className="mb-0 fw-bold">Despesas por Categoria</h5>
            <small className="text-muted">Distribuição de gastos</small>
          </div>
        </div>

        <div
          className="p-3 mb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%)",
            borderRadius: "12px",
            border: "2px solid rgba(220, 53, 69, 0.2)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div
                className="text-muted mb-1"
                style={{ fontSize: "0.85rem", fontWeight: "500" }}
              >
                🏆 Maior Gasto
              </div>
              <div
                className="fw-bold"
                style={{ fontSize: "1.1rem", color: "#dc3545" }}
              >
                {topCategory.name}
              </div>
            </div>
            <div className="text-end">
              <div
                className="fw-bold text-danger"
                style={{ fontSize: "1.25rem" }}
              >
                {formatCurrency(topCategory.value)}
              </div>
              <small className="text-muted">
                {((topCategory.value / totalExpenses) * 100).toFixed(1)}% do
                total
              </small>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) =>
                `${entry.name}: ${((entry.value / totalExpenses) * 100).toFixed(
                  1
                )}%`
              }
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={CustomTooltip} />
            <Legend
              wrapperStyle={{
                fontSize: "14px",
                fontWeight: "500",
                paddingTop: "10px",
              }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>

        <div
          className="text-center mt-3 p-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(220, 53, 69, 0.05) 0%, rgba(244, 92, 67, 0.05) 100%)",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "1rem",
            color: "#dc3545",
          }}
        >
          💸 Total: {formatCurrency(totalExpenses)}
        </div>
      </Card.Body>
    </Card>
  );
}
