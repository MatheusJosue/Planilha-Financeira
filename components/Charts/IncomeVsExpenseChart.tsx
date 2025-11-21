"use client";

import { Card } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { getMonthYearKey } from "@/utils/formatDate";

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: { month: string }; value?: number }>;
}) => {
  if (active && payload && payload.length) {
    const positiveBalance = (payload[0]?.value || 0) > (payload[1]?.value || 0);
    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-title">
          {payload[0]?.payload.month}
        </p>
        <p className="custom-tooltip-income">
          💚 Receitas: {formatCurrency(payload[0]?.value || 0)}
        </p>
        <p className="custom-tooltip-expense">
          ❤️ Despesas: {formatCurrency(payload[1]?.value || 0)}
        </p>
        <p
          className="mt-2 pt-2 border-top"
          style={{
            fontWeight: "600",
            color: positiveBalance ? "#28a745" : "#dc3545",
          }}
        >
          {positiveBalance ? "📈 Saldo positivo" : "📉 Saldo negativo"}
          :{" "}
          {formatCurrency(
            Math.abs((payload[0]?.value || 0) - (payload[1]?.value || 0))
          )}
        </p>
      </div>
    );
  }
  return null;
};

export function IncomeVsExpenseChart() {
  const { transactions } = useFinanceStore();

  const monthlyData: Record<string, { income: number; expense: number }> = {};

  transactions.forEach((t) => {
    const monthKey = getMonthYearKey(t.date);
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    if (t.type === "income") {
      monthlyData[monthKey].income += t.value;
    } else {
      monthlyData[monthKey].expense += t.value;
    }
  });

  const data = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month: month.substring(5) + "/" + month.substring(0, 4),
      Receitas: values.income,
      Despesas: values.expense,
    }));

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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <span style={{ fontSize: "24px" }}>📊</span>
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Receitas vs Despesas</h5>
              <small className="text-muted">Comparativo mensal</small>
            </div>
          </div>
          <div className="text-center text-muted py-5">
            <div className="mb-3" style={{ fontSize: "3rem" }}>
              💰
            </div>
            <p>Nenhuma transação registrada</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const totalIncome = data.reduce((sum, item) => sum + item.Receitas, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.Despesas, 0);

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
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <span style={{ fontSize: "24px" }}>📊</span>
          </div>
          <div>
            <h5 className="mb-0 fw-bold">Receitas vs Despesas</h5>
            <small className="text-muted">Comparativo mensal</small>
          </div>
        </div>

        <div className="d-flex gap-3 mb-4">
          <div
            className="flex-fill p-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(40, 167, 69, 0.05) 100%)",
              borderRadius: "12px",
              border: "2px solid rgba(40, 167, 69, 0.2)",
            }}
          >
            <div
              className="text-muted mb-1"
              style={{ fontSize: "0.85rem", fontWeight: "500" }}
            >
              💚 Total Receitas
            </div>
            <div
              className="fw-bold text-success"
              style={{ fontSize: "1.25rem" }}
            >
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div
            className="flex-fill p-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%)",
              borderRadius: "12px",
              border: "2px solid rgba(220, 53, 69, 0.2)",
            }}
          >
            <div
              className="text-muted mb-1"
              style={{ fontSize: "0.85rem", fontWeight: "500" }}
            >
              ❤️ Total Despesas
            </div>
            <div
              className="fw-bold text-danger"
              style={{ fontSize: "1.25rem" }}
            >
              {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={8}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#28a745" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#28a745" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc3545" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#dc3545" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              tick={{ fill: "#666", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <Tooltip
              content={CustomTooltip}
              cursor={{ fill: "rgba(102, 126, 234, 0.05)" }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
                fontWeight: "500",
              }}
              iconType="circle"
            />
            <Bar
              dataKey="Receitas"
              fill="url(#colorIncome)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="Despesas"
              fill="url(#colorExpense)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
