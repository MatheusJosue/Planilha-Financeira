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

  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedEnabled = localStorage.getItem("periodSeparationEnabled");
    const saved1 = localStorage.getItem("paymentPeriod1End");
    const saved2 = localStorage.getItem("paymentPeriod2Start");

    if (savedEnabled) setPeriodSeparationEnabled(savedEnabled === "true");
    if (saved1) setPeriod1End(parseInt(saved1));
    if (saved2) setPeriod2Start(parseInt(saved2));

    setIsHydrated(true);
  }, []);

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

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(
        "periodSeparationEnabled",
        periodSeparationEnabled.toString()
      );
      localStorage.setItem("paymentPeriod1End", period1End.toString());
      localStorage.setItem("paymentPeriod2Start", period2Start.toString());
    }
  }, [isHydrated, periodSeparationEnabled, period1End, period2Start]);

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

  // Para a aba de previsões, incluir transações previstas E transações recorrentes
  // (as recorrentes já estão em currentTransactions com recurring_id)
  const allPredictedTransactions = currentTransactions.filter(
    (t) => t.is_predicted || t.recurring_id
  );

  const predictedIncome = allPredictedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);
  const predictedExpense = allPredictedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const incomeTransactions = currentTransactions.filter(
    (t) => t.type === "income" && !t.is_predicted
  );
  const expenseTransactions = currentTransactions.filter(
    (t) => t.type === "expense" && !t.is_predicted
  );

  const expenseTransactionsPeriod1 = expenseTransactions.filter((t) => {
    const day = parseInt(t.date.split("-")[2], 10);
    return day <= period1End;
  });
  const expenseTransactionsPeriod2 = expenseTransactions.filter((t) => {
    const day = parseInt(t.date.split("-")[2], 10);
    return day >= period2Start;
  });

  const incomeTransactionsPeriod1 = incomeTransactions.filter((t) => {
    const day = parseInt(t.date.split("-")[2], 10);
    return day <= period1End;
  });
  const incomeTransactionsPeriod2 = incomeTransactions.filter((t) => {
    const day = parseInt(t.date.split("-")[2], 10);
    return day >= period2Start;
  });

  const totalExpenseTransPeriod1 = expenseTransactionsPeriod1.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalExpenseTransPeriod2 = expenseTransactionsPeriod2.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalIncomeTransPeriod1 = incomeTransactionsPeriod1.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalIncomeTransPeriod2 = incomeTransactionsPeriod2.reduce(
    (sum, t) => sum + t.value,
    0
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

  const expenseRecurringPeriod1 = sortedExpenseRecurring.filter(
    (t) => t.day_of_month <= period1End
  );
  const expenseRecurringPeriod2 = sortedExpenseRecurring.filter(
    (t) => t.day_of_month >= period2Start
  );

  const totalExpensePeriod1 = expenseRecurringPeriod1.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalExpensePeriod2 = expenseRecurringPeriod2.reduce(
    (sum, t) => sum + t.value,
    0
  );

  const sortedIncomeRecurring = [...incomeRecurring].sort(
    (a, b) => a.day_of_month - b.day_of_month
  );
  const incomeRecurringPeriod1 = sortedIncomeRecurring.filter(
    (t) => t.day_of_month <= period1End
  );
  const incomeRecurringPeriod2 = sortedIncomeRecurring.filter(
    (t) => t.day_of_month >= period2Start
  );

  const totalIncomePeriod1 = incomeRecurringPeriod1.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const totalIncomePeriod2 = incomeRecurringPeriod2.reduce(
    (sum, t) => sum + t.value,
    0
  );

  const predictedIncomeTransactions = allPredictedTransactions.filter(
    (t) => t.type === "income"
  );
  const predictedExpenseTransactions = allPredictedTransactions.filter(
    (t) => t.type === "expense"
  );

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <div className="mb-3 mb-md-0">
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
          className="d-flex align-items-center justify-content-center gap-2 shadow w-100 w-md-auto"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            maxWidth: "100%",
          }}
        >
          <FiPlus size={20} />
          <span className="d-none d-sm-inline">
            {activeTab === "income" ? "Nova Receita" : "Nova Despesa"}
          </span>
          <span className="d-inline d-sm-none">
            {activeTab === "income" ? "Receita" : "Despesa"}
          </span>
        </Button>
      </div>

      {(activeTab === "transactions" || activeTab === "income") && (
        <MonthSelector />
      )}

      {/* Cards de Resumo */}
      <Row className="mb-4 g-3">
        {activeTab === "transactions" && (
          <>
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
            <Col xs={12} md={4}>
              <Card
                className="text-center shadow-sm h-100"
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
                  Despesas Pontuais
                </h5>

                {periodSeparationEnabled ? (
                  <>
                    {/* 1º Período - Despesas Pontuais */}
                    <Card
                      className="mb-3"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(220, 53, 69, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220, 53, 69, 0.15) 0%, rgba(214, 51, 132, 0.1) 100%)",
                          borderBottom: "2px solid rgba(220, 53, 69, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-danger">
                            📅 1º Período (dias 1 a {period1End})
                          </h6>
                          <Badge
                            bg="danger"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalExpenseTransPeriod1)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <TransactionList
                          onEdit={handleEdit}
                          onDuplicate={handleDuplicate}
                          showPredicted={false}
                          typeFilter="expense"
                          periodFilter={{ startDay: 1, endDay: period1End }}
                        />
                      </Card.Body>
                    </Card>

                    {/* 2º Período - Despesas Pontuais */}
                    <Card
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(220, 53, 69, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220, 53, 69, 0.15) 0%, rgba(214, 51, 132, 0.1) 100%)",
                          borderBottom: "2px solid rgba(220, 53, 69, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-danger">
                            📅 2º Período (dia {period2Start} em diante)
                          </h6>
                          <Badge
                            bg="danger"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalExpenseTransPeriod2)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <TransactionList
                          onEdit={handleEdit}
                          onDuplicate={handleDuplicate}
                          showPredicted={false}
                          typeFilter="expense"
                          periodFilter={{ startDay: period2Start, endDay: 31 }}
                        />
                      </Card.Body>
                    </Card>
                  </>
                ) : (
                  <TransactionList
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    showPredicted={false}
                    typeFilter="expense"
                  />
                )}
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
                ) : periodSeparationEnabled ? (
                  <>
                    {/* 1º Período */}
                    <Card
                      className="mb-3"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(220, 53, 69, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220, 53, 69, 0.15) 0%, rgba(214, 51, 132, 0.1) 100%)",
                          borderBottom: "2px solid rgba(220, 53, 69, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-danger">
                            📅 1º Período (dias 1 a {period1End})
                          </h6>
                          <Badge
                            bg="danger"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalExpensePeriod1)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        {expenseRecurringPeriod1.length === 0 ? (
                          <div className="text-center py-3 text-muted">
                            Nenhuma conta neste período
                          </div>
                        ) : (
                          <Table hover responsive className="align-middle mb-0">
                            <thead
                              style={{
                                background: "rgba(220, 53, 69, 0.05)",
                              }}
                            >
                              <tr>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Descrição
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Categoria
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Valor
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Recorrência
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Dia
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {expenseRecurringPeriod1.map((transaction) => {
                                const categoryColor = getCategoryColor(
                                  transaction.category
                                );
                                return (
                                  <tr key={transaction.id}>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      {transaction.description}
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <Badge
                                        style={{
                                          backgroundColor: categoryColor,
                                          borderRadius: "6px",
                                          padding: "4px 10px",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        {transaction.category}
                                      </Badge>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <span className="text-danger fw-bold">
                                        -{formatCurrency(transaction.value)}
                                      </span>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <Badge
                                        bg="danger"
                                        style={{
                                          borderRadius: "6px",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        {getRecurrenceLabel(transaction)}
                                      </Badge>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <span className="text-danger fw-semibold">
                                        Dia {transaction.day_of_month}
                                      </span>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="me-1"
                                        onClick={() =>
                                          handleEditRecurring(transaction)
                                        }
                                        style={{
                                          borderRadius: "6px",
                                          padding: "4px 8px",
                                        }}
                                      >
                                        <FiEdit2 size={14} />
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteRecurring(transaction.id)
                                        }
                                        style={{
                                          borderRadius: "6px",
                                          padding: "4px 8px",
                                        }}
                                      >
                                        <FiTrash2 size={14} />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>

                    {/* 2º Período */}
                    <Card
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(220, 53, 69, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(220, 53, 69, 0.15) 0%, rgba(214, 51, 132, 0.1) 100%)",
                          borderBottom: "2px solid rgba(220, 53, 69, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-danger">
                            📅 2º Período (dia {period2Start} em diante)
                          </h6>
                          <Badge
                            bg="danger"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalExpensePeriod2)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        {expenseRecurringPeriod2.length === 0 ? (
                          <div className="text-center py-3 text-muted">
                            Nenhuma conta neste período
                          </div>
                        ) : (
                          <Table hover responsive className="align-middle mb-0">
                            <thead
                              style={{
                                background: "rgba(220, 53, 69, 0.05)",
                              }}
                            >
                              <tr>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Descrição
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Categoria
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Valor
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Recorrência
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Dia
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {expenseRecurringPeriod2.map((transaction) => {
                                const categoryColor = getCategoryColor(
                                  transaction.category
                                );
                                return (
                                  <tr key={transaction.id}>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      {transaction.description}
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <Badge
                                        style={{
                                          backgroundColor: categoryColor,
                                          borderRadius: "6px",
                                          padding: "4px 10px",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        {transaction.category}
                                      </Badge>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <span className="text-danger fw-bold">
                                        -{formatCurrency(transaction.value)}
                                      </span>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <Badge
                                        bg="danger"
                                        style={{
                                          borderRadius: "6px",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        {getRecurrenceLabel(transaction)}
                                      </Badge>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <span className="text-danger fw-semibold">
                                        Dia {transaction.day_of_month}
                                      </span>
                                    </td>
                                    <td
                                      className="text-center"
                                      style={{ padding: "0.75rem" }}
                                    >
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="me-1"
                                        onClick={() =>
                                          handleEditRecurring(transaction)
                                        }
                                        style={{
                                          borderRadius: "6px",
                                          padding: "4px 8px",
                                        }}
                                      >
                                        <FiEdit2 size={14} />
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteRecurring(transaction.id)
                                        }
                                        style={{
                                          borderRadius: "6px",
                                          padding: "4px 8px",
                                        }}
                                      >
                                        <FiTrash2 size={14} />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </>
                ) : (
                  <Table hover responsive className="align-middle mb-0">
                    <thead
                      style={{
                        background: "rgba(220, 53, 69, 0.05)",
                      }}
                    >
                      <tr>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Descrição
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Categoria
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Valor
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Recorrência
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Dia
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
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
                          <tr key={transaction.id}>
                            <td
                              className="text-center"
                              style={{ padding: "0.75rem" }}
                            >
                              {transaction.description}
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "0.75rem" }}
                            >
                              <Badge
                                style={{
                                  backgroundColor: categoryColor,
                                  borderRadius: "6px",
                                  padding: "4px 10px",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {transaction.category}
                              </Badge>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "0.75rem" }}
                            >
                              <span className="text-danger fw-bold">
                                -{formatCurrency(transaction.value)}
                              </span>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "0.75rem" }}
                            >
                              <Badge
                                bg="danger"
                                style={{
                                  borderRadius: "6px",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {getRecurrenceLabel(transaction)}
                              </Badge>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "0.75rem" }}
                            >
                              <span className="text-danger fw-semibold">
                                Dia {transaction.day_of_month}
                              </span>
                            </td>
                            <td
                              className="text-center"
                              style={{ padding: "0.75rem" }}
                            >
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="me-1"
                                onClick={() => handleEditRecurring(transaction)}
                                style={{
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                }}
                              >
                                <FiEdit2 size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleDeleteRecurring(transaction.id)
                                }
                                style={{
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                }}
                              >
                                <FiTrash2 size={14} />
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
                  <FiRepeat className="text-success" />
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
                ) : periodSeparationEnabled ? (
                  <>
                    {/* 1º Período - Receitas */}
                    <Card
                      className="mb-3"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(25, 135, 84, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(25, 135, 84, 0.15) 0%, rgba(40, 167, 69, 0.1) 100%)",
                          borderBottom: "2px solid rgba(25, 135, 84, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-success">
                            📅 1º Período (dias 1 a {period1End})
                          </h6>
                          <Badge
                            bg="success"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalIncomePeriod1)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        {incomeRecurringPeriod1.length === 0 ? (
                          <div className="text-center py-3 text-muted">
                            Nenhuma receita neste período
                          </div>
                        ) : (
                          <Table hover responsive className="align-middle mb-0">
                            <thead
                              style={{ background: "rgba(25, 135, 84, 0.05)" }}
                            >
                              <tr>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Descrição
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Categoria
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Valor
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Recorrência
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Dia
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {incomeRecurringPeriod1.map((transaction) => (
                                <tr key={transaction.id}>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    {transaction.description}
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <Badge
                                      bg="success"
                                      style={{
                                        borderRadius: "6px",
                                        padding: "4px 10px",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {transaction.category}
                                    </Badge>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <span className="text-success fw-bold">
                                      +{formatCurrency(transaction.value)}
                                    </span>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <Badge
                                      bg="success"
                                      style={{
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {getRecurrenceLabel(transaction)}
                                    </Badge>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <span className="text-success fw-semibold">
                                      Dia {transaction.day_of_month}
                                    </span>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      className="me-1"
                                      onClick={() =>
                                        handleEditRecurring(transaction)
                                      }
                                      style={{
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      <FiEdit2 size={14} />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteRecurring(transaction.id)
                                      }
                                      style={{
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      <FiTrash2 size={14} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>

                    {/* 2º Período - Receitas */}
                    <Card
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(25, 135, 84, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(25, 135, 84, 0.15) 0%, rgba(40, 167, 69, 0.1) 100%)",
                          borderBottom: "2px solid rgba(25, 135, 84, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-success">
                            📅 2º Período (dia {period2Start} em diante)
                          </h6>
                          <Badge
                            bg="success"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalIncomePeriod2)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        {incomeRecurringPeriod2.length === 0 ? (
                          <div className="text-center py-3 text-muted">
                            Nenhuma receita neste período
                          </div>
                        ) : (
                          <Table hover responsive className="align-middle mb-0">
                            <thead
                              style={{ background: "rgba(25, 135, 84, 0.05)" }}
                            >
                              <tr>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Descrição
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Categoria
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Valor
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Recorrência
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Dia
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "0.75rem",
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {incomeRecurringPeriod2.map((transaction) => (
                                <tr key={transaction.id}>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    {transaction.description}
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <Badge
                                      bg="success"
                                      style={{
                                        borderRadius: "6px",
                                        padding: "4px 10px",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {transaction.category}
                                    </Badge>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <span className="text-success fw-bold">
                                      +{formatCurrency(transaction.value)}
                                    </span>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <Badge
                                      bg="success"
                                      style={{
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {getRecurrenceLabel(transaction)}
                                    </Badge>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <span className="text-success fw-semibold">
                                      Dia {transaction.day_of_month}
                                    </span>
                                  </td>
                                  <td
                                    className="text-center"
                                    style={{ padding: "0.75rem" }}
                                  >
                                    <Button
                                      variant="outline-success"
                                      size="sm"
                                      className="me-1"
                                      onClick={() =>
                                        handleEditRecurring(transaction)
                                      }
                                      style={{
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      <FiEdit2 size={14} />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteRecurring(transaction.id)
                                      }
                                      style={{
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      <FiTrash2 size={14} />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </Card.Body>
                    </Card>
                  </>
                ) : (
                  <Table hover responsive className="align-middle mb-0">
                    <thead style={{ background: "rgba(25, 135, 84, 0.05)" }}>
                      <tr>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Descrição
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Categoria
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Valor
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Recorrência
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Dia
                        </th>
                        <th
                          className="text-center"
                          style={{
                            padding: "0.75rem",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIncomeRecurring.map((transaction) => (
                        <tr key={transaction.id}>
                          <td
                            className="text-center"
                            style={{ padding: "0.75rem" }}
                          >
                            {transaction.description}
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "0.75rem" }}
                          >
                            <Badge
                              bg="success"
                              style={{
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "0.8rem",
                              }}
                            >
                              {transaction.category}
                            </Badge>
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "0.75rem" }}
                          >
                            <span className="text-success fw-bold">
                              +{formatCurrency(transaction.value)}
                            </span>
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "0.75rem" }}
                          >
                            <Badge
                              bg="success"
                              style={{
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                              }}
                            >
                              {getRecurrenceLabel(transaction)}
                            </Badge>
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "0.75rem" }}
                          >
                            <span className="text-success fw-semibold">
                              Dia {transaction.day_of_month}
                            </span>
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "0.75rem" }}
                          >
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditRecurring(transaction)}
                              style={{
                                borderRadius: "6px",
                                padding: "4px 8px",
                              }}
                            >
                              <FiEdit2 size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteRecurring(transaction.id)
                              }
                              style={{
                                borderRadius: "6px",
                                padding: "4px 8px",
                              }}
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>

              <div>
                <h5 className="mb-3 d-flex align-items-center gap-2">
                  <FiDollarSign className="text-success" />
                  Receitas Pontuais
                </h5>

                {periodSeparationEnabled ? (
                  <>
                    {/* 1º Período - Receitas Pontuais */}
                    <Card
                      className="mb-3"
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(25, 135, 84, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(25, 135, 84, 0.15) 0%, rgba(40, 167, 69, 0.1) 100%)",
                          borderBottom: "2px solid rgba(25, 135, 84, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-success">
                            📅 1º Período (dias 1 a {period1End})
                          </h6>
                          <Badge
                            bg="success"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalIncomeTransPeriod1)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <TransactionList
                          onEdit={handleEdit}
                          onDuplicate={handleDuplicate}
                          showPredicted={false}
                          typeFilter="income"
                          periodFilter={{ startDay: 1, endDay: period1End }}
                        />
                      </Card.Body>
                    </Card>

                    {/* 2º Período - Receitas Pontuais */}
                    <Card
                      style={{
                        borderRadius: "12px",
                        border: "2px solid rgba(25, 135, 84, 0.2)",
                      }}
                    >
                      <Card.Header
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(25, 135, 84, 0.15) 0%, rgba(40, 167, 69, 0.1) 100%)",
                          borderBottom: "2px solid rgba(25, 135, 84, 0.2)",
                          padding: "1rem",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-success">
                            📅 2º Período (dia {period2Start} em diante)
                          </h6>
                          <Badge
                            bg="success"
                            style={{
                              fontSize: "1rem",
                              padding: "0.5rem 1rem",
                              borderRadius: "8px",
                            }}
                          >
                            Total: {formatCurrency(totalIncomeTransPeriod2)}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <TransactionList
                          onEdit={handleEdit}
                          onDuplicate={handleDuplicate}
                          showPredicted={false}
                          typeFilter="income"
                          periodFilter={{ startDay: period2Start, endDay: 31 }}
                        />
                      </Card.Body>
                    </Card>
                  </>
                ) : (
                  <TransactionList
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    showPredicted={false}
                    typeFilter="income"
                  />
                )}
              </div>
            </>
          )}

          {activeTab === "predicted" && (
            <>
              {allPredictedTransactions.length === 0 ? (
                <div className="text-center py-5">
                  <FiCalendar size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    Nenhuma transação prevista para este mês
                  </p>
                </div>
              ) : periodSeparationEnabled ? (
                <>
                  {/* 1º Período - Previsões */}
                  <Card
                    className="mb-3"
                    style={{
                      borderRadius: "12px",
                      border: "2px solid rgba(102, 126, 234, 0.3)",
                      background: "rgba(102, 126, 234, 0.02)",
                    }}
                  >
                    <Card.Header
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)",
                        padding: "1rem",
                      }}
                    >
                      <h5 className="mb-0 fw-bold" style={{ color: "#667eea" }}>
                        📅 1º Período (dias 1 a {period1End})
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3 mb-3">
                        <Col xs={12} md={6}>
                          <Card
                            className="text-center h-100"
                            style={{
                              borderRadius: "10px",
                              border: "2px solid rgba(25, 135, 84, 0.3)",
                              background: "rgba(25, 135, 84, 0.05)",
                            }}
                          >
                            <Card.Body className="py-3">
                              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <FiTrendingUp
                                  className="text-success"
                                  size={20}
                                />
                                <h6 className="text-success mb-0 fw-semibold">
                                  Receitas Previstas
                                </h6>
                              </div>
                              <h4 className="text-success mb-1">
                                {formatCurrency(
                                  allPredictedTransactions
                                    .filter(
                                      (t) =>
                                        t.type === "income" &&
                                        parseInt(t.date.split("-")[2]) <=
                                          period1End
                                    )
                                    .reduce((sum, t) => sum + t.value, 0)
                                )}
                              </h4>
                              <small className="text-muted">
                                {
                                  allPredictedTransactions.filter(
                                    (t) =>
                                      t.type === "income" &&
                                      parseInt(t.date.split("-")[2]) <=
                                        period1End
                                  ).length
                                }{" "}
                                transações
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12} md={6}>
                          <Card
                            className="text-center h-100"
                            style={{
                              borderRadius: "10px",
                              border: "2px solid rgba(220, 53, 69, 0.3)",
                              background: "rgba(220, 53, 69, 0.05)",
                            }}
                          >
                            <Card.Body className="py-3">
                              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <FiDollarSign
                                  className="text-danger"
                                  size={20}
                                />
                                <h6 className="text-danger mb-0 fw-semibold">
                                  Despesas Previstas
                                </h6>
                              </div>
                              <h4 className="text-danger mb-1">
                                {formatCurrency(
                                  allPredictedTransactions
                                    .filter(
                                      (t) =>
                                        t.type === "expense" &&
                                        parseInt(t.date.split("-")[2]) <=
                                          period1End
                                    )
                                    .reduce((sum, t) => sum + t.value, 0)
                                )}
                              </h4>
                              <small className="text-muted">
                                {
                                  allPredictedTransactions.filter(
                                    (t) =>
                                      t.type === "expense" &&
                                      parseInt(t.date.split("-")[2]) <=
                                        period1End
                                  ).length
                                }{" "}
                                transações
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* Lista de Transações do 1º Período */}
                      <div className="mt-3">
                        {allPredictedTransactions.filter(
                          (t) => parseInt(t.date.split("-")[2]) <= period1End
                        ).length > 0 ? (
                          <TransactionList
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            showPredicted={true}
                            periodFilter={{ startDay: 1, endDay: period1End }}
                          />
                        ) : (
                          <div className="text-center py-3 text-muted">
                            Nenhuma transação prevista neste período
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>

                  {/* 2º Período - Previsões */}
                  <Card
                    style={{
                      borderRadius: "12px",
                      border: "2px solid rgba(102, 126, 234, 0.3)",
                      background: "rgba(102, 126, 234, 0.02)",
                    }}
                  >
                    <Card.Header
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)",
                        borderBottom: "2px solid rgba(102, 126, 234, 0.2)",
                        padding: "1rem",
                      }}
                    >
                      <h5 className="mb-0 fw-bold" style={{ color: "#667eea" }}>
                        📅 2º Período (dia {period2Start} em diante)
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3 mb-3">
                        <Col xs={12} md={6}>
                          <Card
                            className="text-center h-100"
                            style={{
                              borderRadius: "10px",
                              border: "2px solid rgba(25, 135, 84, 0.3)",
                              background: "rgba(25, 135, 84, 0.05)",
                            }}
                          >
                            <Card.Body className="py-3">
                              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <FiTrendingUp
                                  className="text-success"
                                  size={20}
                                />
                                <h6 className="text-success mb-0 fw-semibold">
                                  Receitas Previstas
                                </h6>
                              </div>
                              <h4 className="text-success mb-1">
                                {formatCurrency(
                                  allPredictedTransactions
                                    .filter(
                                      (t) =>
                                        t.type === "income" &&
                                        parseInt(t.date.split("-")[2]) >=
                                          period2Start
                                    )
                                    .reduce((sum, t) => sum + t.value, 0)
                                )}
                              </h4>
                              <small className="text-muted">
                                {
                                  allPredictedTransactions.filter(
                                    (t) =>
                                      t.type === "income" &&
                                      parseInt(t.date.split("-")[2]) >=
                                        period2Start
                                  ).length
                                }{" "}
                                transações
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12} md={6}>
                          <Card
                            className="text-center h-100"
                            style={{
                              borderRadius: "10px",
                              border: "2px solid rgba(220, 53, 69, 0.3)",
                              background: "rgba(220, 53, 69, 0.05)",
                            }}
                          >
                            <Card.Body className="py-3">
                              <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                <FiDollarSign
                                  className="text-danger"
                                  size={20}
                                />
                                <h6 className="text-danger mb-0 fw-semibold">
                                  Despesas Previstas
                                </h6>
                              </div>
                              <h4 className="text-danger mb-1">
                                {formatCurrency(
                                  allPredictedTransactions
                                    .filter(
                                      (t) =>
                                        t.type === "expense" &&
                                        parseInt(t.date.split("-")[2]) >=
                                          period2Start
                                    )
                                    .reduce((sum, t) => sum + t.value, 0)
                                )}
                              </h4>
                              <small className="text-muted">
                                {
                                  allPredictedTransactions.filter(
                                    (t) =>
                                      t.type === "expense" &&
                                      parseInt(t.date.split("-")[2]) >=
                                        period2Start
                                  ).length
                                }{" "}
                                transações
                              </small>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* Lista de Transações do 2º Período */}
                      <div className="mt-3">
                        {allPredictedTransactions.filter(
                          (t) => parseInt(t.date.split("-")[2]) >= period2Start
                        ).length > 0 ? (
                          <TransactionList
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            showPredicted={true}
                            periodFilter={{
                              startDay: period2Start,
                              endDay: 31,
                            }}
                          />
                        ) : (
                          <div className="text-center py-3 text-muted">
                            Nenhuma transação prevista neste período
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <>
                  {/* Visão Unificada - Sem separação de períodos */}
                  <Row className="g-3 mb-4">
                    <Col xs={12} md={4}>
                      <Card
                        className="text-center h-100 shadow-sm"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid rgba(25, 135, 84, 0.3)",
                          background: "rgba(25, 135, 84, 0.05)",
                        }}
                      >
                        <Card.Body className="py-4">
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <FiTrendingUp className="text-success" size={24} />
                            <h5 className="text-success mb-0 fw-bold">
                              Receitas Previstas
                            </h5>
                          </div>
                          <h2 className="text-success mb-2">
                            {formatCurrency(predictedIncome)}
                          </h2>
                          <Badge
                            bg="success"
                            style={{
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {predictedIncomeTransactions.length} transações
                          </Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={4}>
                      <Card
                        className="text-center h-100 shadow-sm"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid rgba(220, 53, 69, 0.3)",
                          background: "rgba(220, 53, 69, 0.05)",
                        }}
                      >
                        <Card.Body className="py-4">
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <FiDollarSign className="text-danger" size={24} />
                            <h5 className="text-danger mb-0 fw-bold">
                              Despesas Previstas
                            </h5>
                          </div>
                          <h2 className="text-danger mb-2">
                            {formatCurrency(predictedExpense)}
                          </h2>
                          <Badge
                            bg="danger"
                            style={{
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {predictedExpenseTransactions.length} transações
                          </Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={4}>
                      <Card
                        className="text-center h-100 shadow-sm"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid rgba(102, 126, 234, 0.3)",
                          background: "rgba(102, 126, 234, 0.05)",
                        }}
                      >
                        <Card.Body className="py-4">
                          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <FiCalendar className="text-primary" size={24} />
                            <h5 className="text-primary mb-0 fw-bold">
                              Saldo Previsto
                            </h5>
                          </div>
                          <h2
                            className={`mb-2 ${
                              predictedIncome - predictedExpense >= 0
                                ? "text-success"
                                : "text-danger"
                            }`}
                          >
                            {formatCurrency(predictedIncome - predictedExpense)}
                          </h2>
                          <Badge
                            bg={
                              predictedIncome - predictedExpense >= 0
                                ? "success"
                                : "danger"
                            }
                            style={{
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {predictedIncome - predictedExpense >= 0
                              ? "Positivo"
                              : "Negativo"}
                          </Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

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
