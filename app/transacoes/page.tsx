"use client";

import { useEffect, useState } from "react";
import { Button, Card, Row, Col, Nav, Badge, Table } from "react-bootstrap";
import {
  FiPlus,
  FiRepeat,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { Transaction, RecurringTransaction, TransactionType } from "@/types";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { MonthSelector } from "@/components/MonthSelector";
import RecurringTransactionForm from "@/components/RecurringTransactionForm";
import { ConfirmRecurringModal } from "@/components/ConfirmRecurringModal";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";

type TabType = "transactions" | "income" | "predicted";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("predicted");
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
  const [confirmingTransaction, setConfirmingTransaction] =
    useState<Transaction | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { data: settings, error } = await supabaseClient
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar configurações:", error);
        return;
      }

      if (settings) {
        setPeriodSeparationEnabled(settings.period_separation_enabled || false);
        setPeriod1End(settings.period_1_end || 15);
        setPeriod2Start(settings.period_2_start || 16);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const {
    loadRecurringTransactions,
    loadFromSupabase,
    convertPredictedToReal,
    monthsData,
    currentMonth,
  } = useFinanceStore();

  useEffect(() => {
    loadRecurringTransactions().then(() => {
      // Regenerate predicted transactions after loading recurring ones
      loadFromSupabase();
    });
  }, [loadRecurringTransactions, loadFromSupabase]);

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

  const handleConfirmRecurring = (transaction: Transaction) => {
    setConfirmingTransaction(transaction);
    setShowConfirmModal(true);
  };

  const handleConfirmWithValue = async (
    transaction: Transaction,
    newValue: number
  ) => {
    await convertPredictedToReal(transaction, { value: newValue });
    setShowConfirmModal(false);
    setConfirmingTransaction(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setDuplicatingTransaction(null);
    setDefaultTransactionType(undefined);
  };

  const handleCloseRecurringForm = () => {
    setShowRecurringForm(false);
    setEditingRecurring(undefined);
  };

  const monthData = monthsData[currentMonth];
  const currentTransactions = monthData?.transactions || [];

  const currentIncomes = currentTransactions
    .filter((t) => t.type === "income" && !t.is_predicted && !t.recurring_id)
    .reduce((sum, t) => sum + t.value, 0);

  const currentExpenses = currentTransactions
    .filter((t) => t.type === "expense" && !t.is_predicted && !t.recurring_id)
    .reduce((sum, t) => sum + t.value, 0);

  const confirmedRecurringIncome = currentTransactions
    .filter((t) => t.type === "income" && !t.is_predicted && t.recurring_id)
    .reduce((sum, t) => sum + t.value, 0);

  const confirmedRecurringExpense = currentTransactions
    .filter((t) => t.type === "expense" && !t.is_predicted && t.recurring_id)
    .reduce((sum, t) => sum + t.value, 0);

  const predictedTransactions = currentTransactions.filter(
    (t) => t.is_predicted
  );

  // Para os cards, separar previstas (não confirmadas) de todas as transações
  const allPredictedTransactions = predictedTransactions;

  const predictedIncome = allPredictedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);
  const predictedExpense = allPredictedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  // Incluir TODAS as transações confirmadas (pontuais + recorrentes)
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

      <MonthSelector />

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
                    {
                      currentTransactions.filter(
                        (t) =>
                          t.type === "expense" &&
                          !t.is_predicted &&
                          !t.recurring_id
                      ).length
                    }{" "}
                    transações
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
                    {formatCurrency(confirmedRecurringExpense)}
                  </h3>
                  <small className="text-muted">
                    {
                      currentTransactions.filter(
                        (t) =>
                          t.type === "expense" &&
                          !t.is_predicted &&
                          t.recurring_id
                      ).length
                    }{" "}
                    confirmadas
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
                    {formatCurrency(
                      currentExpenses + confirmedRecurringExpense
                    )}
                  </h3>
                  <small className="text-muted">
                    Pontuais + Fixas confirmadas
                  </small>
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
                    {formatCurrency(currentIncomes + confirmedRecurringIncome)}
                  </h3>
                  <small className="text-muted">
                    Pontuais + Fixas confirmadas
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
                    <FiCalendar className="text-info me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas Pontuais</h6>
                  </div>
                  <h3 className="text-info mb-0">
                    {formatCurrency(currentIncomes)}
                  </h3>
                  <small className="text-muted">
                    {
                      currentTransactions.filter(
                        (t) =>
                          t.type === "income" &&
                          !t.is_predicted &&
                          !t.recurring_id
                      ).length
                    }{" "}
                    transações
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
                    {formatCurrency(confirmedRecurringIncome)}
                  </h3>
                  <small className="text-muted">
                    {
                      currentTransactions.filter(
                        (t) =>
                          t.type === "income" &&
                          !t.is_predicted &&
                          t.recurring_id
                      ).length
                    }{" "}
                    confirmadas
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
                          onConfirmRecurring={handleConfirmRecurring}
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
                          onConfirmRecurring={handleConfirmRecurring}
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
                    onConfirmRecurring={handleConfirmRecurring}
                    showPredicted={false}
                    typeFilter="expense"
                  />
                )}
              </div>
            </>
          )}

          {activeTab === "income" && (
            <>
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
                          onConfirmRecurring={handleConfirmRecurring}
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
                          onConfirmRecurring={handleConfirmRecurring}
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
                    onConfirmRecurring={handleConfirmRecurring}
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
                            onConfirmRecurring={handleConfirmRecurring}
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
                            onConfirmRecurring={handleConfirmRecurring}
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
                        onConfirmRecurring={handleConfirmRecurring}
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
                        onConfirmRecurring={handleConfirmRecurring}
                        showPredicted={true}
                        typeFilter="expense"
                      />
                    </div>
                  )}

                  {/* Seção de Transações Recorrentes Configuradas */}
                  {(() => {
                    const {
                      recurringTransactions,
                      deleteRecurringTransaction,
                    } = useFinanceStore.getState();

                    return recurringTransactions.length > 0 ? (
                      <div className="mt-4">
                        <h5 className="mb-3 d-flex align-items-center gap-2">
                          <FiRepeat className="text-primary" />
                          Transações Recorrentes Configuradas
                          <Badge
                            bg="primary"
                            style={{
                              borderRadius: "8px",
                              padding: "4px 10px",
                              fontSize: "0.85rem",
                            }}
                          >
                            {recurringTransactions.length}
                          </Badge>
                        </h5>
                        <div
                          className="shadow-card"
                          style={{
                            borderRadius: "16px",
                            overflow: "hidden",
                          }}
                        >
                          <Table hover responsive className="align-middle mb-0">
                            <thead
                              style={{
                                background:
                                  "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
                                borderBottom: "2px solid #e2e8f0",
                              }}
                            >
                              <tr>
                                <th
                                  className="text-center"
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Ações
                                </th>
                                <th
                                  className="text-start"
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Descrição
                                </th>
                                <th
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Tipo
                                </th>
                                <th
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Categoria
                                </th>
                                <th
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Valor
                                </th>
                                <th
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Recorrência
                                </th>
                                <th
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Dia Vencimento
                                </th>
                                <th
                                  style={{
                                    padding: "1rem",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  Início
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {recurringTransactions.map((transaction) => (
                                <tr key={transaction.id}>
                                  <td
                                    className="text-center"
                                    style={{ padding: "1rem" }}
                                  >
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="me-2 mb-1"
                                      onClick={() =>
                                        setEditingRecurring(transaction)
                                      }
                                      style={{
                                        borderRadius: "8px",
                                        padding: "6px 12px",
                                      }}
                                      title="Editar"
                                    >
                                      <FiEdit />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      className="mb-1"
                                      onClick={() => {
                                        if (
                                          confirm(
                                            "Tem certeza que deseja excluir esta transação recorrente?"
                                          )
                                        ) {
                                          deleteRecurringTransaction(
                                            transaction.id
                                          );
                                        }
                                      }}
                                      style={{
                                        borderRadius: "8px",
                                        padding: "6px 12px",
                                      }}
                                      title="Excluir"
                                    >
                                      <FiTrash2 />
                                    </Button>
                                  </td>
                                  <td
                                    style={{
                                      padding: "1rem",
                                      fontWeight: "500",
                                    }}
                                  >
                                    <strong>{transaction.description}</strong>
                                  </td>
                                  <td style={{ padding: "1rem" }}>
                                    <Badge
                                      bg={
                                        transaction.type === "income"
                                          ? "success"
                                          : "danger"
                                      }
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        fontWeight: "500",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {transaction.type === "income"
                                        ? "Receita"
                                        : "Despesa"}
                                    </Badge>
                                  </td>
                                  <td style={{ padding: "1rem" }}>
                                    <Badge
                                      bg="secondary"
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        fontWeight: "500",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {transaction.category}
                                    </Badge>
                                  </td>
                                  <td
                                    className="text-end"
                                    style={{ padding: "1rem" }}
                                  >
                                    <span
                                      className={
                                        transaction.type === "income"
                                          ? "text-success fw-bold"
                                          : "text-danger fw-bold"
                                      }
                                      style={{ fontSize: "1rem" }}
                                    >
                                      {transaction.type === "income"
                                        ? "+"
                                        : "-"}
                                      {formatCurrency(transaction.value)}
                                    </span>
                                  </td>
                                  <td style={{ padding: "1rem" }}>
                                    <Badge
                                      bg="primary"
                                      style={{
                                        padding: "6px 12px",
                                        borderRadius: "8px",
                                        fontWeight: "500",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {(() => {
                                        switch (transaction.recurrence_type) {
                                          case "fixed":
                                            return "Fixa Mensal";
                                          case "installment":
                                            return `Parcelada ${
                                              transaction.current_installment ||
                                              1
                                            }/${
                                              transaction.total_installments ||
                                              transaction.total_installments ||
                                              1
                                            }`;
                                          case "variable":
                                            return "Variável Mensal";
                                        }
                                      })()}
                                    </Badge>
                                  </td>
                                  <td style={{ padding: "1rem" }}>
                                    Dia {transaction.day_of_month || "N/A"}
                                  </td>
                                  <td style={{ padding: "1rem" }}>
                                    {new Date(
                                      transaction.start_date
                                    ).toLocaleDateString("pt-BR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    ) : null;
                  })()}
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
        defaultType={activeTab === "income" ? "income" : "expense"}
      />

      <ConfirmRecurringModal
        show={showConfirmModal}
        onHide={() => {
          setShowConfirmModal(false);
          setConfirmingTransaction(null);
        }}
        transaction={confirmingTransaction}
        onConfirm={handleConfirmWithValue}
      />
    </div>
  );
}
