"use client";

import { Card, Row, Col } from "react-bootstrap";
import { FiTrendingUp, FiTrendingDown, FiDollarSign } from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";

export function SummaryCards() {
  const { transactions } = useFinanceStore();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const balance = totalIncome - totalExpense;

  return (
    <Row className="g-4 mb-4">
      <Col md={4}>
        <Card
          className="border-0 shadow-card h-100 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-white mb-1 small opacity-75 fw-semibold">
                  RECEITAS
                </p>
                <h2 className="mb-0 text-white fw-bold">
                  {formatCurrency(totalIncome)}
                </h2>
                <small className="text-white opacity-75">
                  {transactions.filter((t) => t.type === "income").length}{" "}
                  transações
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
            background: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
            animationDelay: "0.1s",
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-white mb-1 small opacity-75 fw-semibold">
                  DESPESAS
                </p>
                <h2 className="mb-0 text-white fw-bold">
                  {formatCurrency(totalExpense)}
                </h2>
                <small className="text-white opacity-75">
                  {transactions.filter((t) => t.type === "expense").length}{" "}
                  transações
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
                : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            animationDelay: "0.2s",
          }}
        >
          <Card.Body className="p-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-white mb-1 small opacity-75 fw-semibold">
                  SALDO TOTAL
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
  );
}
