"use client";

import { Card, Row, Col, Badge } from "react-bootstrap";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiPieChart,
} from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";

export function FinancialStats() {
  const { transactions } = useFinanceStore();

  const incomes = transactions.filter((t) => t.type === "income");
  const expenses = transactions.filter((t) => t.type === "expense");

  const highestIncome =
    incomes.length > 0 ? Math.max(...incomes.map((t) => t.value)) : 0;

  const highestExpense =
    expenses.length > 0 ? Math.max(...expenses.map((t) => t.value)) : 0;

  const avgMonthlyExpense =
    expenses.length > 0
      ? expenses.reduce((sum, t) => sum + t.value, 0) / expenses.length
      : 0;

  const expensesByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.value;
    return acc;
  }, {} as Record<string, number>);

  const topExpenseCategory =
    Object.entries(expensesByCategory).length > 0
      ? Object.entries(expensesByCategory).reduce((a, b) =>
          a[1] > b[1] ? a : b
        )
      : ["Nenhuma", 0];

  const totalTransactions = transactions.length;
  const totalIncomeCount = incomes.length;
  const totalExpenseCount = expenses.length;

  const stats = [
    {
      icon: FiTrendingUp,
      title: "Maior Receita",
      value: formatCurrency(highestIncome),
      description: `Total de ${totalIncomeCount} receita${
        totalIncomeCount !== 1 ? "s" : ""
      }`,
      gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      bgColor: "rgba(17, 153, 142, 0.1)",
    },
    {
      icon: FiTrendingDown,
      title: "Maior Despesa",
      value: formatCurrency(highestExpense),
      description: `Total de ${totalExpenseCount} despesa${
        totalExpenseCount !== 1 ? "s" : ""
      }`,
      gradient: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
      bgColor: "rgba(235, 51, 73, 0.1)",
    },
    {
      icon: FiTarget,
      title: "Média por Transação",
      value: formatCurrency(avgMonthlyExpense),
      description: "Gasto médio por despesa",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      bgColor: "rgba(102, 126, 234, 0.1)",
    },
    {
      icon: FiPieChart,
      title: "Categoria Top",
      value: topExpenseCategory[0],
      description: `${formatCurrency(topExpenseCategory[1] as number)} gastos`,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      bgColor: "rgba(240, 147, 251, 0.1)",
    },
  ];

  if (totalTransactions === 0) {
    return (
      <Card className="border-0 shadow-card">
        <Card.Body className="p-5 text-center">
          <div className="mb-3" style={{ fontSize: "3rem" }}>
            📊
          </div>
          <h5 className="text-muted">Nenhuma estatística disponível</h5>
          <p className="text-muted mb-0">
            Adicione transações para ver suas estatísticas financeiras
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-card">
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
            <h5 className="mb-0 fw-bold">Estatísticas Financeiras</h5>
            <small className="text-muted">
              Resumo inteligente das suas finanças
            </small>
          </div>
        </div>

        <Row className="g-3">
          {stats.map((stat, index) => (
            <Col md={6} lg={3} key={index}>
              <div
                className="p-3 h-100"
                style={{
                  borderRadius: "12px",
                  backgroundColor: stat.bgColor,
                  border: "2px solid rgba(0,0,0,0.05)",
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: stat.gradient,
                    }}
                  >
                    <stat.icon size={18} className="text-white" />
                  </div>
                  <small className="text-muted fw-semibold">{stat.title}</small>
                </div>
                <div className="mb-1">
                  <div
                    className="fw-bold"
                    style={{
                      fontSize: "1.25rem",
                      background: stat.gradient,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
                <small className="text-muted">{stat.description}</small>
              </div>
            </Col>
          ))}
        </Row>

        <div className="mt-4 pt-3 border-top">
          <Row className="text-center">
            <Col>
              <div className="mb-1">
                <Badge bg="secondary" className="px-3 py-2">
                  {totalTransactions} Transações
                </Badge>
              </div>
              <small className="text-muted">Total registrado</small>
            </Col>
            <Col>
              <div className="mb-1">
                <Badge bg="success" className="px-3 py-2">
                  {totalIncomeCount} Receitas
                </Badge>
              </div>
              <small className="text-muted">Entradas</small>
            </Col>
            <Col>
              <div className="mb-1">
                <Badge bg="danger" className="px-3 py-2">
                  {totalExpenseCount} Despesas
                </Badge>
              </div>
              <small className="text-muted">Saídas</small>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
}
