"use client";

import { useEffect, useState } from "react";
import { Button, Card, Row, Col, Nav, Badge, Table } from "react-bootstrap";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRepeat,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import { Transaction, RecurringTransaction, TransactionType } from "@/types";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { MonthSelector } from "@/components/MonthSelector";
import RecurringTransactionForm from "@/components/RecurringTransactionForm";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";

type TabType = "transactions" | "income" | "predicted";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const [showForm, setShowForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<
    TransactionType | undefined
  >(undefined);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [duplicatingTransaction, setDuplicatingTransaction] =
    useState<Transaction | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<
    RecurringTransaction | undefined
  >(undefined);

  const {
    recurringTransactions,
    loadRecurringTransactions,
    deleteRecurringTransaction,
    monthsData,
    currentMonth,
  } = useFinanceStore();

  useEffect(() => {
    loadRecurringTransactions();
  }, [loadRecurringTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDuplicatingTransaction(null);
    setShowForm(true);
  };

  const handleDuplicate = (transaction: Transaction) => {
    const [year, month, day] = transaction.date.split("-").map(Number);
    let nextMonth = month + 1;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    const validDay = Math.min(day, daysInNextMonth);
    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(
      2,
      "0"
    )}-${String(validDay).padStart(2, "0")}`;

    const duplicated: Transaction = {
      ...transaction,
      date: nextMonthStr,
      id: "",
    };

    setDuplicatingTransaction(duplicated);
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setDuplicatingTransaction(null);
    setDefaultTransactionType(undefined);
  };

  const handleEditRecurring = (transaction: RecurringTransaction) => {
    setEditingRecurring(transaction);
    setShowRecurringForm(true);
  };

  const handleDeleteRecurring = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação recorrente?")) {
      await deleteRecurringTransaction(id);
    }
  };

  const handleCloseRecurringForm = () => {
    setShowRecurringForm(false);
    setEditingRecurring(undefined);
  };

  const getRecurrenceLabel = (transaction: RecurringTransaction) => {
    switch (transaction.recurrence_type) {
      case "fixed":
        return "Fixa Mensal";
      case "installment":
        return `Parcelada ${transaction.current_installment || 1}/${
          transaction.total_installments
        }`;
      case "variable":
        return "Variável Mensal";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Alimentação: "#fd7e14",
      Transporte: "#0dcaf0",
      Moradia: "#6f42c1",
      Saúde: "#d63384",
      Educação: "#0d6efd",
      Lazer: "#ffc107",
      Vestuário: "#20c997",
      Outros: "#6c757d",
      Investimentos: "#198754",
      Salário: "#28a745",
      Freelance: "#17a2b8",
      Presente: "#e83e8c",
    };
    return colors[category] || "#6c757d";
  };

  // Estatísticas
  const activeRecurring = recurringTransactions.filter((t) => t.is_active);
  const monthData = monthsData[currentMonth];
  const currentTransactions = monthData?.transactions || [];

  const totalMonthlyIncome = activeRecurring
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  const totalMonthlyExpense = activeRecurring
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const currentIncomes = currentTransactions
    .filter((t) => t.type === "income" && !t.is_predicted)
    .reduce((sum, t) => sum + t.value, 0);

  const currentExpenses = currentTransactions
    .filter((t) => t.type === "expense" && !t.is_predicted)
    .reduce((sum, t) => sum + t.value, 0);

  const predictedTransactions = currentTransactions.filter(
    (t) => t.is_predicted
  );
  const predictedIncome = predictedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);
  const predictedExpense = predictedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const incomeTransactions = currentTransactions.filter(
    (t) => t.type === "income" && !t.is_predicted
  );
  const expenseTransactions = currentTransactions.filter(
    (t) => t.type === "expense" && !t.is_predicted
  );

  const incomeRecurring = activeRecurring.filter((t) => t.type === "income");
  const totalIncomeWithRecurring = currentIncomes + totalMonthlyIncome;

  const expenseRecurring = activeRecurring.filter((t) => t.type === "expense");
  const totalExpenseWithRecurring = currentExpenses + totalMonthlyExpense;

  const sortedExpenseRecurring = [...expenseRecurring].sort((a, b) => {
    if (a.day_of_month !== b.day_of_month) {
      return a.day_of_month - b.day_of_month;
    }

    const typeOrder: { [key: string]: number } = {
      fixed: 1,
      installment: 2,
      variable: 3,
    };

    return (
      (typeOrder[a.recurrence_type] || 3) - (typeOrder[b.recurrence_type] || 3)
    );
  });

  // Transações previstas separadas por tipo
  const predictedIncomeTransactions = predictedTransactions.filter(
    (t) => t.type === "income"
  );
  const predictedExpenseTransactions = predictedTransactions.filter(
    (t) => t.type === "expense"
  );

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-5 fw-bold gradient-text mb-2">Financeiro</h1>
          <p className="text-muted">
            Gerencie transações, recorrentes e previsões
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => {
            if (activeTab === "income") {
              setDefaultTransactionType("income");
              setShowForm(true);
            } else {
              setDefaultTransactionType("expense");
              setShowForm(true);
            }
          }}
          className="d-flex align-items-center gap-2 shadow"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
          }}
        >
          <FiPlus size={20} />
          {activeTab === "income" ? "Nova Receita" : "Nova Despesa"}
        </Button>
      </div>

      {(activeTab === "transactions" || activeTab === "income") && (
        <MonthSelector />
      )}

      {/* Cards de Resumo */}
      <Row className="mb-4">
        {activeTab === "transactions" && (
          <>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiDollarSign className="text-danger me-2" size={20} />
                    <h6 className="text-muted mb-0">Despesas Pontuais</h6>
                  </div>
                  <h3 className="text-danger mb-0">
                    {formatCurrency(currentExpenses)}
                  </h3>
                  <small className="text-muted">
                    {expenseTransactions.length} transações
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiRepeat className="text-danger me-2" size={20} />
                    <h6 className="text-muted mb-0">Contas Recorrentes</h6>
                  </div>
                  <h3 className="text-danger mb-0">
                    {formatCurrency(totalMonthlyExpense)}
                  </h3>
                  <small className="text-muted">
                    {expenseRecurring.length} contas mensais
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-warning me-2" size={20} />
                    <h6 className="text-muted mb-0">Total do Mês</h6>
                  </div>
                  <h3 className="text-warning mb-0">
                    {formatCurrency(totalExpenseWithRecurring)}
                  </h3>
                  <small className="text-muted">Despesas totais</small>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}

        {activeTab === "income" && (
          <>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiTrendingUp className="text-success me-2" size={20} />
                    <h6 className="text-muted mb-0">Total de Receitas</h6>
                  </div>
                  <h3 className="text-success mb-0">
                    {formatCurrency(totalIncomeWithRecurring)}
                  </h3>
                  <small className="text-muted">Transações + Recorrentes</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-info me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas Pontuais</h6>
                  </div>
                  <h3 className="text-info mb-0">
                    {formatCurrency(currentIncomes)}
                  </h3>
                  <small className="text-muted">
                    {incomeTransactions.length} transações
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiRepeat className="text-primary me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas Fixas</h6>
                  </div>
                  <h3 className="text-primary mb-0">
                    {formatCurrency(totalMonthlyIncome)}
                  </h3>
                  <small className="text-muted">
                    {incomeRecurring.length} recorrentes
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}

        {activeTab === "predicted" && (
          <>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-success me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas Previstas</h6>
                  </div>
                  <h3 className="text-success mb-0">
                    {formatCurrency(predictedIncome)}
                  </h3>
                  <small className="text-muted">
                    {
                      predictedTransactions.filter((t) => t.type === "income")
                        .length
                    }{" "}
                    previsões
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-danger me-2" size={20} />
                    <h6 className="text-muted mb-0">Despesas Previstas</h6>
                  </div>
                  <h3 className="text-danger mb-0">
                    {formatCurrency(predictedExpense)}
                  </h3>
                  <small className="text-muted">
                    {
                      predictedTransactions.filter((t) => t.type === "expense")
                        .length
                    }{" "}
                    previsões
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card
                className="text-center shadow-sm"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiDollarSign className="text-info me-2" size={20} />
                    <h6 className="text-muted mb-0">Total de Previsões</h6>
                  </div>
                  <h3 className="text-info mb-0">
                    {predictedTransactions.length}
                  </h3>
                  <small className="text-muted">Transações</small>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Tabs */}
      <Card className="shadow-sm mb-4" style={{ borderRadius: "12px" }}>
        <Card.Header
          style={{
            background: "transparent",
            borderBottom: "none",
            padding: "1rem 1.5rem 0",
          }}
        >
          <Nav
            variant="tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as TabType)}
          >
            <Nav.Item>
              <Nav.Link
                eventKey="predicted"
                className="d-flex align-items-center gap-2"
                style={{
                  borderRadius: "12px 12px 0 0",
                  fontWeight: activeTab === "predicted" ? "600" : "500",
                  padding: "12px 20px",
                  border: "none",
                  background:
                    activeTab === "predicted"
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "transparent",
                  color:
                    activeTab === "predicted" ? "#fff" : "var(--bs-body-color)",
                  transition: "all 0.3s ease",
                  marginRight: "4px",
                }}
              >
                <FiCalendar size={18} />
                <span>Previstas</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="income"
                className="d-flex align-items-center gap-2"
                style={{
                  borderRadius: "12px 12px 0 0",
                  fontWeight: activeTab === "income" ? "600" : "500",
                  padding: "12px 20px",
                  border: "none",
                  background:
                    activeTab === "income"
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "transparent",
                  color:
                    activeTab === "income" ? "#fff" : "var(--bs-body-color)",
                  transition: "all 0.3s ease",
                  marginRight: "4px",
                }}
              >
                <FiTrendingUp size={18} />
                <span>Receitas</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="transactions"
                className="d-flex align-items-center gap-2"
                style={{
                  borderRadius: "12px 12px 0 0",
                  fontWeight: activeTab === "transactions" ? "600" : "500",
                  padding: "12px 20px",
                  border: "none",
                  background:
                    activeTab === "transactions"
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "transparent",
                  color:
                    activeTab === "transactions"
                      ? "#fff"
                      : "var(--bs-body-color)",
                  transition: "all 0.3s ease",
                }}
              >
                <FiDollarSign size={18} />
                <span>Despesas</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body style={{ padding: "1.5rem" }}>
          {activeTab === "transactions" && (
            <>
              <div className="mb-4">
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FiDollarSign className="text-danger" />
                  Despesas
                </h5>
                <TransactionList
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  showPredicted={false}
                  typeFilter="expense"
                />
              </div>

              <div>
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FiRepeat className="text-danger" />
                  Contas Recorrentes
                </h5>
                {expenseRecurring.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded">
                    <p className="text-muted mb-2">
                      Nenhuma conta recorrente cadastrada
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowRecurringForm(true)}
                      style={{ borderRadius: "8px" }}
                    >
                      Adicionar Conta Recorrente
                    </Button>
                  </div>
                ) : (
                  <Table hover responsive className="align-middle mb-0">
                    <thead
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(214, 51, 132, 0.08) 100%)",
                        borderBottom: "2px solid rgba(220, 53, 69, 0.2)",
                      }}
                    >
                      <tr>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#dc3545",
                          }}
                        >
                          Descrição
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#dc3545",
                          }}
                        >
                          Categoria
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#dc3545",
                          }}
                        >
                          Valor
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#dc3545",
                          }}
                        >
                          Recorrência
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#dc3545",
                          }}
                        >
                          Dia
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#dc3545",
                          }}
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedExpenseRecurring.map((transaction) => {
                        const categoryColor = getCategoryColor(
                          transaction.category
                        );
                        return (
                          <tr
                            key={transaction.id}
                            style={{
                              borderLeft: "4px solid transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderLeft =
                                "4px solid #dc3545";
                              e.currentTarget.style.background =
                                "rgba(220, 53, 69, 0.03)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderLeft =
                                "4px solid transparent";
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td
                              className="text-center"
                              style={{ padding: "1rem", fontWeight: "500" }}
                            >
                              {transaction.description}
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "1rem" }}
                            >
                              <Badge
                                style={{
                                  backgroundColor: categoryColor,
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontWeight: "500",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {transaction.category}
                              </Badge>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "1rem" }}
                            >
                              <span
                                className="text-danger fw-bold"
                                style={{
                                  fontSize: "1.05rem",
                                  background: "rgba(220, 53, 69, 0.1)",
                                  padding: "6px 16px",
                                  borderRadius: "8px",
                                  display: "inline-block",
                                }}
                              >
                                -{formatCurrency(transaction.value)}
                              </span>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "1rem" }}
                            >
                              <Badge
                                style={{
                                  borderRadius: "8px",
                                  padding: "6px 12px",
                                  fontWeight: "500",
                                  fontSize: "0.85rem",
                                  background:
                                    "linear-gradient(135deg, #dc3545 0%, #d63384 100%)",
                                  border: "none",
                                }}
                              >
                                {getRecurrenceLabel(transaction)}
                              </Badge>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "1rem" }}
                            >
                              <span
                                style={{ color: "#dc3545", fontWeight: "500" }}
                              >
                                Dia {transaction.day_of_month}
                              </span>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "1rem" }}
                            >
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditRecurring(transaction)}
                                style={{
                                  borderRadius: "8px",
                                  borderWidth: "2px",
                                  padding: "6px 12px",
                                }}
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleDeleteRecurring(transaction.id)
                                }
                                style={{
                                  borderRadius: "8px",
                                  borderWidth: "2px",
                                  padding: "6px 12px",
                                }}
                              >
                                <FiTrash2 />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </div>
            </>
          )}

          {activeTab === "income" && (
            <>
              <div className="mb-4">
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FiDollarSign className="text-success" />
                  Receitas
                </h5>
                <TransactionList
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  showPredicted={false}
                  typeFilter="income"
                />
              </div>

              <div>
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FiRepeat className="text-primary" />
                  Receitas Recorrentes
                </h5>
                {incomeRecurring.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded">
                    <p className="text-muted mb-2">
                      Nenhuma receita recorrente cadastrada
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowRecurringForm(true)}
                      style={{ borderRadius: "8px" }}
                    >
                      Adicionar Receita Recorrente
                    </Button>
                  </div>
                ) : (
                  <Table hover responsive className="align-middle mb-0">
                    <thead
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(25, 135, 84, 0.1) 0%, rgba(40, 167, 69, 0.08) 100%)",
                        borderBottom: "2px solid rgba(25, 135, 84, 0.2)",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#198754",
                          }}
                        >
                          Descrição
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#198754",
                          }}
                        >
                          Categoria
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#198754",
                          }}
                        >
                          Valor
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#198754",
                          }}
                        >
                          Recorrência
                        </th>
                        <th
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#198754",
                          }}
                        >
                          Dia
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "1rem",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            color: "#198754",
                          }}
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeRecurring.map((transaction) => (
                        <tr
                          key={transaction.id}
                          style={{
                            borderLeft: "4px solid transparent",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderLeft =
                              "4px solid #198754";
                            e.currentTarget.style.background =
                              "rgba(25, 135, 84, 0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderLeft =
                              "4px solid transparent";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "1rem", fontWeight: "500" }}>
                            {transaction.description}
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <Badge
                              bg="success"
                              style={{
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontWeight: "500",
                                fontSize: "0.85rem",
                              }}
                            >
                              {transaction.category}
                            </Badge>
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "1rem" }}
                          >
                            <span
                              className="text-success fw-bold"
                              style={{
                                fontSize: "1.05rem",
                                background: "rgba(25, 135, 84, 0.1)",
                                padding: "6px 16px",
                                borderRadius: "8px",
                                display: "inline-block",
                              }}
                            >
                              +{formatCurrency(transaction.value)}
                            </span>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <Badge
                              style={{
                                borderRadius: "8px",
                                padding: "6px 12px",
                                fontWeight: "500",
                                fontSize: "0.85rem",
                                background:
                                  "linear-gradient(135deg, #198754 0%, #20c997 100%)",
                                border: "none",
                              }}
                            >
                              {getRecurrenceLabel(transaction)}
                            </Badge>
                          </td>
                          <td style={{ padding: "1rem" }}>
                            <span
                              style={{ color: "#198754", fontWeight: "500" }}
                            >
                              Dia {transaction.day_of_month}
                            </span>
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "1rem" }}
                          >
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEditRecurring(transaction)}
                              style={{
                                borderRadius: "8px",
                                borderWidth: "2px",
                                padding: "6px 12px",
                              }}
                            >
                              <FiEdit2 />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteRecurring(transaction.id)
                              }
                              style={{
                                borderRadius: "8px",
                                borderWidth: "2px",
                                padding: "6px 12px",
                              }}
                            >
                              <FiTrash2 />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </>
          )}

          {activeTab === "predicted" && (
            <>
              {predictedTransactions.length === 0 ? (
                <div className="text-center py-5">
                  <FiCalendar size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    Nenhuma transação prevista para este mês
                  </p>
                </div>
              ) : (
                <>
                  {/* Seção de Receitas Previstas */}
                  {predictedIncomeTransactions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="mb-3 d-flex align-items-center gap-2">
                        <FiTrendingUp className="text-success" />
                        Receitas Previstas
                        <Badge
                          bg="success"
                          style={{
                            borderRadius: "8px",
                            padding: "4px 10px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {predictedIncomeTransactions.length}
                        </Badge>
                      </h5>
                      <TransactionList
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        showPredicted={true}
                        typeFilter="income"
                      />
                    </div>
                  )}

                  {/* Seção de Despesas Previstas */}
                  {predictedExpenseTransactions.length > 0 && (
                    <div>
                      <h5 className="mb-3 d-flex align-items-center gap-2">
                        <FiDollarSign className="text-danger" />
                        Despesas Previstas
                        <Badge
                          bg="danger"
                          style={{
                            borderRadius: "8px",
                            padding: "4px 10px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {predictedExpenseTransactions.length}
                        </Badge>
                      </h5>
                      <TransactionList
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        showPredicted={true}
                        typeFilter="expense"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <TransactionForm
        show={showForm}
        onHide={handleCloseForm}
        transaction={editingTransaction || duplicatingTransaction}
        defaultType={defaultTransactionType}
      />

      <RecurringTransactionForm
        show={showRecurringForm}
        onHide={handleCloseRecurringForm}
        transaction={editingRecurring}
      />
    </div>
  );
}
