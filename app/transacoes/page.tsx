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
import { PreviousMonthTransactionList } from "@/components/PreviousMonthTransactionList";
import { MonthSelector } from "@/components/MonthSelector";
import RecurringTransactionForm from "@/components/RecurringTransactionForm";
import { ConfirmRecurringModal } from "@/components/ConfirmRecurringModal";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { getMonthsToLoad } from "@/utils/dashboardConfigHelper";

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
  // ID da transação original que está sendo duplicada (para esconder após confirmar)
  const [duplicatingFromId, setDuplicatingFromId] = useState<string | null>(null);

  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);

  // IDs de transações do mês anterior que já foram trazidas ou ocultadas
  const [hiddenPreviousMonthIds, setHiddenPreviousMonthIds] = useState<
    string[]
  >([]);

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
    recurringTransactions,
    deleteRecurringTransaction,
  } = useFinanceStore();

  // Carregar IDs ocultos do Supabase
  useEffect(() => {
    const loadHiddenIds = async () => {
      try {
        const supabaseClient = (
          await import("@/lib/supabase-client")
        ).createClient();
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();

        if (!user) return;

        const { data, error } = await supabaseClient
          .from("hidden_previous_month_transactions")
          .select("transaction_id")
          .eq("user_id", user.id)
          .eq("hidden_for_month", currentMonth);

        if (error) {
          console.error("Erro ao carregar transações ocultas:", error);
          return;
        }

        if (data) {
          setHiddenPreviousMonthIds(data.map((item) => item.transaction_id));
        }
      } catch (error) {
        console.error("Erro ao carregar transações ocultas:", error);
      }
    };

    loadHiddenIds();
  }, [currentMonth]);

  // Função para ocultar uma transação do mês anterior
  const handleHidePreviousMonthTransaction = async (id: string) => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return;

      const { error } = await supabaseClient
        .from("hidden_previous_month_transactions")
        .insert({
          user_id: user.id,
          transaction_id: id,
          hidden_for_month: currentMonth,
        });

      if (error) {
        console.error("Erro ao ocultar transação:", error);
        return;
      }

      // Atualizar estado local
      setHiddenPreviousMonthIds((prev) => [...prev, id]);
    } catch (error) {
      console.error("Erro ao ocultar transação:", error);
    }
  };

  useEffect(() => {
    loadRecurringTransactions().then(async () => {
      // Regenerate predicted transactions after loading recurring ones
      // Página de transações precisa de pelo menos 2 meses para a aba "Previstas"
      const baseMonthsToLoad = await getMonthsToLoad();
      const monthsToLoad = Math.max(baseMonthsToLoad, 2);
      loadFromSupabase(monthsToLoad);
    });
  }, [loadRecurringTransactions, loadFromSupabase]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDuplicatingTransaction(null);
    setShowForm(true);
  };

  const handleDuplicate = (transaction: Transaction) => {
    // Usar o mês atual selecionado (currentMonth) ao invés de incrementar a data original
    // Isso garante que a transação vá para o mês que o usuário está visualizando
    const [, , day] = transaction.date.split("-").map(Number);
    const [targetYear, targetMonthNum] = currentMonth.split("-").map(Number);

    const daysInTargetMonth = new Date(targetYear, targetMonthNum, 0).getDate();
    const validDay = Math.min(day, daysInTargetMonth);
    const targetDateStr = `${targetYear}-${String(targetMonthNum).padStart(
      2,
      "0"
    )}-${String(validDay).padStart(2, "0")}`;

    const duplicated: Transaction = {
      ...transaction,
      date: targetDateStr,
      id: "",
    };

    // Guardar o ID original para esconder após confirmação
    setDuplicatingFromId(transaction.id);
    // Primeiro limpar e setar a transação, depois abrir o modal
    setEditingTransaction(null);
    setDuplicatingTransaction(duplicated);
    // Usar setTimeout para garantir que o estado foi atualizado antes de abrir o modal
    setTimeout(() => {
      setShowForm(true);
    }, 0);
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

  const handleEditRecurring = (transaction: RecurringTransaction) => {
    setEditingRecurring(transaction);
    setShowRecurringForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setDuplicatingTransaction(null);
    setDefaultTransactionType(undefined);
  };

  // Callback chamado quando uma transação é adicionada via duplicação
  const handleTransactionAdded = async () => {
    // Se havia uma transação sendo duplicada, esconder a original da lista de previstas
    if (duplicatingFromId) {
      await handleHidePreviousMonthTransaction(duplicatingFromId);
      setDuplicatingFromId(null);
    }
  };

  const handleCloseRecurringForm = () => {
    setShowRecurringForm(false);
    setEditingRecurring(undefined);
  };

  const monthData = monthsData[currentMonth];
  const currentTransactions = monthData?.transactions || [];

  // Calcular mês anterior
  const getPreviousMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    let prevMonth = monthNum - 1;
    let prevYear = year;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear -= 1;
    }
    return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  };

  const previousMonth = getPreviousMonth(currentMonth);
  const previousMonthData = monthsData[previousMonth];
  const previousMonthTransactions = previousMonthData?.transactions || [];

  // Transações do mês anterior (não recorrentes e não previstas) para a aba "Previstas"
  const previousMonthNonRecurring = previousMonthTransactions.filter(
    (t) => !t.is_predicted && !t.recurring_id
  );

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

  // Transações recorrentes previstas (ainda não confirmadas)
  const predictedRecurringIncome = currentTransactions
    .filter((t) => t.type === "income" && t.is_predicted && t.recurring_id)
    .reduce((sum, t) => sum + t.value, 0);

  const predictedRecurringExpense = currentTransactions
    .filter((t) => t.type === "expense" && t.is_predicted && t.recurring_id)
    .reduce((sum, t) => sum + t.value, 0);

  // Total de recorrentes (confirmadas + previstas)
  const totalRecurringIncome =
    confirmedRecurringIncome + predictedRecurringIncome;
  const totalRecurringExpense =
    confirmedRecurringExpense + predictedRecurringExpense;

  // Contagem de transações recorrentes
  const confirmedRecurringIncomeCount = currentTransactions.filter(
    (t) => t.type === "income" && !t.is_predicted && t.recurring_id
  ).length;
  const predictedRecurringIncomeCount = currentTransactions.filter(
    (t) => t.type === "income" && t.is_predicted && t.recurring_id
  ).length;
  const confirmedRecurringExpenseCount = currentTransactions.filter(
    (t) => t.type === "expense" && !t.is_predicted && t.recurring_id
  ).length;
  const predictedRecurringExpenseCount = currentTransactions.filter(
    (t) => t.type === "expense" && t.is_predicted && t.recurring_id
  ).length;

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

  // Transações do mês anterior separadas por tipo (excluindo as ocultas)
  const previousMonthIncomeTransactions = previousMonthNonRecurring.filter(
    (t) => t.type === "income" && !hiddenPreviousMonthIds.includes(t.id)
  );
  const previousMonthExpenseTransactions = previousMonthNonRecurring.filter(
    (t) => t.type === "expense" && !hiddenPreviousMonthIds.includes(t.id)
  );

  // Recalcular totais do mês anterior considerando transações ocultas
  const visiblePreviousMonthIncome = previousMonthIncomeTransactions.reduce(
    (sum, t) => sum + t.value,
    0
  );
  const visiblePreviousMonthExpense = previousMonthExpenseTransactions.reduce(
    (sum, t) => sum + t.value,
    0
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

        <MonthSelector />
      </div>

      {/* Cards de Resumo */}
      <Row className="mb-4 g-3">
        {activeTab === "transactions" && (
          <>
            <Col xs={12} md={4}>
              <Card
                id="card-one-time-expenses"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiDollarSign className="text-danger me-2" size={20} />
                    <h6 className="text-muted mb-0">Despesas Pontuais</h6>
                  </div>
                  <h3 className="text-danger mb-0" id="total-one-time-expenses">
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
                id="card-recurring-expenses"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiRepeat className="text-danger me-2" size={20} />
                    <h6 className="text-muted mb-0">Contas Recorrentes</h6>
                  </div>
                  <h3
                    className="text-danger mb-0"
                    id="total-recurring-expenses"
                  >
                    {formatCurrency(totalRecurringExpense)}
                  </h3>
                  <small className="text-muted">
                    {confirmedRecurringExpenseCount} confirmadas
                    {predictedRecurringExpenseCount > 0 && (
                      <> + {predictedRecurringExpenseCount} previstas</>
                    )}
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card
                id="card-month-total-expenses"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-warning me-2" size={20} />
                    <h6 className="text-muted mb-0">Total do Mês</h6>
                  </div>
                  <h3 className="text-warning mb-0" id="total-month-expenses">
                    {formatCurrency(currentExpenses + totalRecurringExpense)}
                  </h3>
                  <small className="text-muted">Pontuais + Recorrentes</small>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}

        {activeTab === "income" && (
          <>
            <Col xs={12} md={4}>
              <Card
                id="card-total-income"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiTrendingUp className="text-success me-2" size={20} />
                    <h6 className="text-muted mb-0">Total de Receitas</h6>
                  </div>
                  <h3 className="text-success mb-0" id="total-income">
                    {formatCurrency(currentIncomes + totalRecurringIncome)}
                  </h3>
                  <small className="text-muted">Pontuais + Recorrentes</small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card
                id="card-one-time-income"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-info me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas Pontuais</h6>
                  </div>
                  <h3 className="text-info mb-0" id="total-one-time-income">
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
                id="card-recurring-income"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiRepeat className="text-primary me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas Fixas</h6>
                  </div>
                  <h3 className="text-primary mb-0" id="total-recurring-income">
                    {formatCurrency(totalRecurringIncome)}
                  </h3>
                  <small className="text-muted">
                    {confirmedRecurringIncomeCount} confirmadas
                    {predictedRecurringIncomeCount > 0 && (
                      <> + {predictedRecurringIncomeCount} previstas</>
                    )}
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
                id="card-predicted-income"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-success me-2" size={20} />
                    <h6 className="text-muted mb-0">Receitas (Mês Anterior)</h6>
                  </div>
                  <h3 className="text-success mb-0" id="total-predicted-income">
                    {formatCurrency(visiblePreviousMonthIncome)}
                  </h3>
                  <small className="text-muted">
                    {previousMonthIncomeTransactions.length} transações
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card
                id="card-predicted-expenses"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiCalendar className="text-danger me-2" size={20} />
                    <h6 className="text-muted mb-0">Despesas (Mês Anterior)</h6>
                  </div>
                  <h3
                    className="text-danger mb-0"
                    id="total-predicted-expenses"
                  >
                    {formatCurrency(visiblePreviousMonthExpense)}
                  </h3>
                  <small className="text-muted">
                    {previousMonthExpenseTransactions.length} transações
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card
                id="card-predicted-total"
                className="text-center shadow-sm h-100"
                style={{ borderRadius: "12px" }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-center mb-2">
                    <FiDollarSign className="text-info me-2" size={20} />
                    <h6 className="text-muted mb-0">Saldo (Mês Anterior)</h6>
                  </div>
                  <h3
                    className={`mb-0 ${
                      visiblePreviousMonthIncome -
                        visiblePreviousMonthExpense >=
                      0
                        ? "text-success"
                        : "text-danger"
                    }`}
                    id="total-predicted-count"
                  >
                    {formatCurrency(
                      visiblePreviousMonthIncome - visiblePreviousMonthExpense
                    )}
                  </h3>
                  <small className="text-muted">
                    {previousMonthIncomeTransactions.length +
                      previousMonthExpenseTransactions.length}{" "}
                    transações restantes
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* Tabs */}
      <Card
        className="shadow-sm mb-4"
        style={{ borderRadius: "12px" }}
        id="card-tabs"
      >
        <Card.Header
          style={{
            background: "transparent",
            borderBottom: "none",
            padding: "1rem 1.5rem 0",
          }}
        >
          <Nav
            id="transaction-tabs"
            variant="tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as TabType)}
          >
            <Nav.Item>
              <Nav.Link
                id="tab-predicted"
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
                id="tab-income"
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
                id="tab-transactions"
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
              {previousMonthNonRecurring.length === 0 ? (
                <div className="text-center py-5">
                  <FiCalendar size={48} className="text-muted mb-3" />
                  <p className="text-muted">
                    Nenhuma transação pontual no mês anterior ({previousMonth})
                  </p>
                  <small className="text-muted">
                    As transações pontuais do mês anterior aparecem aqui para
                    você decidir quais trazer para o mês atual.
                  </small>
                </div>
              ) : (
                <>
                  {/* Informativo */}
                  <div
                    className="mb-4 p-3"
                    role="alert"
                    style={{
                      background: "rgba(102, 126, 234, 0.1)",
                      border: "1px solid rgba(102, 126, 234, 0.3)",
                      borderRadius: "12px",
                      color: "var(--foreground)",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <FiCalendar size={20} />
                      <div>
                        <strong>
                          Transações do Mês Anterior ({previousMonth}):
                        </strong>{" "}
                        Estas são as transações pontuais do mês anterior. Use o
                        botão <strong>&quot;Duplicar&quot;</strong> para trazer
                        uma transação para o mês atual.
                      </div>
                    </div>
                  </div>

                  {/* Visão Unificada - Transações do mês anterior */}
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
                              Receitas
                            </h5>
                          </div>
                          <h2 className="text-success mb-2">
                            {formatCurrency(visiblePreviousMonthIncome)}
                          </h2>
                          <Badge
                            bg="success"
                            style={{
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {previousMonthIncomeTransactions.length} transações
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
                              Despesas
                            </h5>
                          </div>
                          <h2 className="text-danger mb-2">
                            {formatCurrency(visiblePreviousMonthExpense)}
                          </h2>
                          <Badge
                            bg="danger"
                            style={{
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {previousMonthExpenseTransactions.length} transações
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
                            <h5 className="text-primary mb-0 fw-bold">Saldo</h5>
                          </div>
                          <h2
                            className={`mb-2 ${
                              visiblePreviousMonthIncome -
                                visiblePreviousMonthExpense >=
                              0
                                ? "text-success"
                                : "text-danger"
                            }`}
                          >
                            {formatCurrency(
                              visiblePreviousMonthIncome -
                                visiblePreviousMonthExpense
                            )}
                          </h2>
                          <Badge
                            bg={
                              visiblePreviousMonthIncome -
                                visiblePreviousMonthExpense >=
                              0
                                ? "success"
                                : "danger"
                            }
                            style={{
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.9rem",
                            }}
                          >
                            {visiblePreviousMonthIncome -
                              visiblePreviousMonthExpense >=
                            0
                              ? "Positivo"
                              : "Negativo"}
                          </Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Seção de Receitas do Mês Anterior */}
                  {previousMonthIncomeTransactions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="mb-3 d-flex align-items-center gap-2">
                        <FiTrendingUp className="text-success" />
                        Receitas do Mês Anterior
                        <Badge
                          bg="success"
                          style={{
                            borderRadius: "8px",
                            padding: "4px 10px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {previousMonthIncomeTransactions.length}
                        </Badge>
                      </h5>
                      <PreviousMonthTransactionList
                        transactions={previousMonthIncomeTransactions}
                        onDuplicate={handleDuplicate}
                        hiddenIds={hiddenPreviousMonthIds}
                        onHide={handleHidePreviousMonthTransaction}
                      />
                    </div>
                  )}

                  {/* Seção de Despesas do Mês Anterior */}
                  {previousMonthExpenseTransactions.length > 0 && (
                    <div>
                      <h5 className="mb-3 d-flex align-items-center gap-2">
                        <FiDollarSign className="text-danger" />
                        Despesas do Mês Anterior
                        <Badge
                          bg="danger"
                          style={{
                            borderRadius: "8px",
                            padding: "4px 10px",
                            fontSize: "0.85rem",
                          }}
                        >
                          {previousMonthExpenseTransactions.length}
                        </Badge>
                      </h5>
                      <PreviousMonthTransactionList
                        transactions={previousMonthExpenseTransactions}
                        onDuplicate={handleDuplicate}
                        hiddenIds={hiddenPreviousMonthIds}
                        onHide={handleHidePreviousMonthTransaction}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Seção de Transações Recorrentes Configuradas - SEMPRE VISÍVEL */}
      <Card
        className="shadow-sm mt-4"
        style={{
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
        }}
      >
        <Card.Body>
          <h5 className="mb-3 d-flex align-items-center gap-2">
            <FiRepeat className="text-primary" size={24} />
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

          {recurringTransactions.length > 0 ? (
            <div
              className="shadow-card"
              style={{
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              <Table
                hover
                responsive
                className="align-middle mb-0"
                id="table-configured-recurring"
              >
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
                    <tr
                      key={transaction.id}
                      id={`configured-recurring-row-${transaction.id}`}
                    >
                      <td className="text-center" style={{ padding: "1rem" }}>
                        <Button
                          id={`btn-edit-configured-${transaction.id}`}
                          variant="outline-primary"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => handleEditRecurring(transaction)}
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          title="Editar"
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          id={`btn-delete-configured-${transaction.id}`}
                          variant="outline-danger"
                          size="sm"
                          className="mb-1"
                          onClick={() =>
                            deleteRecurringTransaction(transaction.id)
                          }
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          title="Excluir"
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                      <td className="text-start" style={{ padding: "1rem" }}>
                        <span style={{ fontWeight: "500" }}>
                          {transaction.description}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <Badge
                          bg={
                            transaction.type === "income" ? "success" : "danger"
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
                      <td className="text-end" style={{ padding: "1rem" }}>
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-success fw-bold"
                              : "text-danger fw-bold"
                          }
                          style={{ fontSize: "1rem" }}
                        >
                          {transaction.recurrence_type ===
                          "variable_by_income" ? (
                            `${transaction.value}%`
                          ) : (
                            <>
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(transaction.value)}
                            </>
                          )}
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
                          {transaction.recurrence_type === "fixed"
                            ? "Fixo"
                            : transaction.recurrence_type === "installment"
                            ? `${transaction.current_installment}/${transaction.total_installments}`
                            : transaction.recurrence_type === "variable"
                            ? "Variável"
                            : "Var. por Renda"}
                        </Badge>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        Dia {transaction.day_of_month || "N/A"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {new Date(transaction.start_date).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div
              className="text-center p-5"
              style={{
                backgroundColor: "var(--card-bg)",
                borderRadius: "12px",
                border: "1px dashed var(--border-color)",
              }}
            >
              <FiRepeat
                size={48}
                style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
              />
              <p
                style={{
                  color: "var(--muted-foreground)",
                  margin: "1rem 0 0 0",
                  fontSize: "1.1rem",
                }}
              >
                Nenhuma transação recorrente configurada
              </p>
              <p
                style={{
                  color: "var(--muted-foreground)",
                  margin: "0.5rem 0 0 0",
                  fontSize: "0.9rem",
                }}
              >
                Clique no botão &quot;➕ Criar Conta&quot; acima para adicionar
                uma nova transação recorrente
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <TransactionForm
        show={showForm}
        onHide={handleCloseForm}
        transaction={editingTransaction || duplicatingTransaction}
        defaultType={defaultTransactionType}
        onTransactionAdded={handleTransactionAdded}
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
