"use client";

import { Card } from "react-bootstrap";
import {
  LineChart,
  Line,
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

export function BalanceOverTimeChart() {
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

  const sortedData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [month, data]) => {
      const prevBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
      const balance = prevBalance + data.income - data.expense;
      acc.push({
        month: month.substring(5) + "/" + month.substring(0, 4),
        balance,
      });
      return acc;
    }, [] as Array<{ month: string; balance: number }>);

  if (sortedData.length === 0) {
    return (
      <Card className="border-0 shadow-card h-100">
        <Card.Body className="p-4">
          <Card.Title className="fw-bold mb-4">📈 Evolução do Saldo</Card.Title>
          <div className="text-center text-muted py-5">
            <div className="mb-3" style={{ fontSize: "3rem" }}>
              💹
            </div>
            <p>Nenhuma transação registrada</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-card h-100">
      <Card.Body className="p-4">
        <Card.Title className="fw-bold mb-4">📈 Evolução do Saldo</Card.Title>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#8884d8"
              strokeWidth={2}
              name="Saldo"
              dot={{ fill: "#8884d8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
}
