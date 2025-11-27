"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, Button, Form, Badge, Row, Col, Alert } from "react-bootstrap";
import {
  FiDownload,
  FiUpload,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiLayout,
  FiCreditCard,
} from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { DEFAULT_CATEGORIES } from "@/types";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";
import { parseCurrency } from "@/utils/formatCurrency";

interface ImportedRecurringTransaction {
  description: string;
  type: string;
  category: string;
  value: number;
  day_of_month?: number;
  recurrence_type?: string;
  start_date?: string;
  end_date?: string | null;
  total_installments?: number | null;
  current_installment?: number | null;
  is_active?: boolean;
}

interface ImportedTransaction {
  description: string;
  type: string;
  category: string;
  value: number;
  date: string;
}

interface ImportData {
  categories?: string[];
  recurringTransactions?: ImportedRecurringTransaction[];
  realTransactions?: ImportedTransaction[];
}

export default function SettingsPage() {
  const {
    transactions,
    categories,
    categoryLimits,
    recurringTransactions,
    monthsData,
    addCategory,
    deleteCategory,
    importData,
    clearAllData,
  } = useFinanceStore();

  const [newCategory, setNewCategory] = useState("");
  const [maxPercentage, setMaxPercentage] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuração de períodos
  const [periodSeparationEnabled, setPeriodSeparationEnabled] = useState(false);
  const [period1End, setPeriod1End] = useState(15);
  const [period2Start, setPeriod2Start] = useState(16);

  // Configuração do Dashboard
  const [dashboardCards, setDashboardCards] = useState({
    balance: true,
    monthlyIncome: true,
    monthlyExpense: true,
    periodCards: true,
    charts: true,
    recentTransactions: true,
    // Individual chart settings
    expensesByCategory: true,
    incomeVsExpense: true,
    recurringVsVariable: true,
    futureProjection: true,
    financialStats: true,
  });

  // Carregar configurações do banco de dados
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

      if (!user) {
        return;
      }

      // Buscar configurações do usuário
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

        if (settings.dashboard_config) {
          setDashboardCards(settings.dashboard_config);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const saveUserSettings = useCallback(async () => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showError("Você precisa estar logado para salvar configurações.");
        return;
      }

      const settingsData = {
        user_id: user.id,
        period_separation_enabled: periodSeparationEnabled,
        period_1_end: period1End,
        period_2_start: period2Start,
        dashboard_config: dashboardCards,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseClient
        .from("user_settings")
        .upsert(settingsData, { onConflict: "user_id" });

      if (error) {
        console.error("Erro ao salvar configurações:", error);
        showError("Erro ao salvar configurações.");
        return;
      }

      showSuccess("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      showError("Erro ao salvar configurações.");
    }
  }, [periodSeparationEnabled, period1End, period2Start, dashboardCards]);

  const handleExport = async () => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showError("Você precisa estar logado para exportar dados.");
        return;
      }

      const { data: allTransactionsData } = await supabaseClient
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      const { data: recurringData } = await supabaseClient
        .from("recurring_transactions")
        .select("*")
        .eq("user_id", user.id);

      const customCategories = categories.filter(
        (cat) => !DEFAULT_CATEGORIES.includes(cat)
      );

      const realTransactions = (allTransactionsData || []).map((t) => ({
        description: t.description,
        type: t.type,
        category: t.category,
        value: t.value,
        date: t.date,
      }));

      const recurringTransactionsClean = (recurringData || []).map((rt) => ({
        description: rt.description,
        type: rt.type,
        category: rt.category,
        value: rt.value,
        day_of_month: rt.day_of_month,
        recurrence_type: rt.recurrence_type,
        start_date: rt.start_date,
        end_date: rt.end_date,
        total_installments: rt.total_installments,
        current_installment: rt.current_installment,
        is_active: rt.is_active,
      }));

      const exportData = {
        recurringTransactions: recurringTransactionsClean,
        realTransactions,
        categories: customCategories,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financeiro-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Export error:", error);
      showError("Erro ao exportar dados.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        const isNewFormat =
          data.recurringTransactions !== undefined &&
          data.realTransactions !== undefined;

        const isOldFormat =
          data.transactions !== undefined && data.categories !== undefined;

        if (!isNewFormat && !isOldFormat) {
          showError("Arquivo inválido! Formato não reconhecido.");
          return;
        }

        const result = await showConfirm(
          "Isso substituirá todos os dados atuais. Deseja continuar?",
          "Importar dados?"
        );

        if (result.isConfirmed) {
          if (isNewFormat) {
            await handleImportNewFormat(data);
          } else {
            await importData(data);
          }
        }
      } catch (error) {
        console.error("Import error:", error);
        showError("Erro ao ler o arquivo!");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportNewFormat = async (data: ImportData) => {
    try {
      const supabaseClient = (
        await import("@/lib/supabase-client")
      ).createClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showError("Você precisa estar logado para importar dados.");
        return;
      }

      if (data.categories && data.categories.length > 0) {
        for (const cat of data.categories) {
          const { data: existing } = await supabaseClient
            .from("categories")
            .select("name")
            .eq("user_id", user.id)
            .eq("name", cat)
            .single();

          if (!existing) {
            await supabaseClient
              .from("categories")
              .insert([{ name: cat, user_id: user.id }]);
          }
        }
      }

      if (data.recurringTransactions && data.recurringTransactions.length > 0) {
        for (const rt of data.recurringTransactions) {
          const { error } = await supabaseClient
            .from("recurring_transactions")
            .insert([
              {
                description: rt.description,
                type: rt.type,
                category: rt.category,
                value: rt.value,
                day_of_month: rt.day_of_month || 1,
                recurrence_type: rt.recurrence_type || "fixed",
                start_date:
                  rt.start_date || new Date().toISOString().split("T")[0],
                end_date: rt.end_date || null,
                total_installments: rt.total_installments || null,
                current_installment: rt.current_installment || null,
                is_active: rt.is_active !== undefined ? rt.is_active : true,
                user_id: user.id,
              },
            ]);

          if (error) {
            console.error("Error importing recurring transaction:", error);
          }
        }
      }

      if (data.realTransactions && data.realTransactions.length > 0) {
        const transactionsToInsert = data.realTransactions.map(
          (t: ImportedTransaction) => ({
            description: t.description,
            type: t.type,
            category: t.category,
            value: t.value,
            date: t.date,
            month: t.date.substring(0, 7),
            user_id: user.id,
          })
        );

        const { error } = await supabaseClient
          .from("transactions")
          .insert(transactionsToInsert);

        if (error) {
          console.error("Error importing transactions:", error);
          showError(`Erro ao importar transações: ${error.message}`);
          return;
        }
      }

      await (await import("@/store/financeStore")).useFinanceStore
        .getState()
        .loadFromSupabase();
      showSuccess("Dados importados com sucesso!");
    } catch (error) {
      console.error("Import error:", error);
      showError("Erro ao importar dados. Verifique o console.");
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      if (categories.includes(newCategory.trim())) {
        showWarning("Esta categoria já existe!");
        return;
      }

      const percentage = maxPercentage ? parseFloat(maxPercentage) : undefined;
      const value = maxValue ? parseCurrency(maxValue) : undefined;

      if (percentage !== undefined && (percentage <= 0 || percentage > 100)) {
        showWarning("A porcentagem deve estar entre 0 e 100!");
        return;
      }

      if (value !== undefined && value <= 0) {
        showWarning("O valor máximo deve ser maior que zero!");
        return;
      }

      await addCategory(newCategory.trim(), percentage, value);
      setNewCategory("");
      setMaxPercentage("");
      setMaxValue("");
    }
  };

  const handleDeleteCategory = async (category: string) => {
    const isDefaultCategory = DEFAULT_CATEGORIES.includes(category);

    const usedInTransactions = transactions.some(
      (t) => t.category === category
    );
    if (usedInTransactions) {
      showWarning(
        "Não é possível excluir uma categoria que está sendo usada em transações!"
      );
      return;
    }

    const message = isDefaultCategory
      ? `Deseja ocultar a categoria padrão "${category}"? Ela não aparecerá mais na sua lista.`
      : `Deseja realmente excluir a categoria "${category}"?`;

    const title = isDefaultCategory
      ? "Ocultar categoria?"
      : "Excluir categoria?";

    const result = await showConfirm(message, title);
    if (result.isConfirmed) {
      await deleteCategory(category);
    }
  };

  const handleClearAll = async () => {
    const result1 = await showConfirm(
      "⚠️ ATENÇÃO: Isso apagará TODAS as suas transações e categorias customizadas. Esta ação não pode ser desfeita!",
      "Limpar todos os dados?"
    );

    if (result1.isConfirmed) {
      const result2 = await showConfirm(
        "Tem certeza absoluta? Todos os seus dados serão perdidos!",
        "Última confirmação"
      );

      if (result2.isConfirmed) {
        await clearAllData();
        showSuccess("Todos os dados foram apagados!");
      }
    }
  };

  const customCategories = categories.filter(
    (cat) => !DEFAULT_CATEGORIES.includes(cat)
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="display-5 fw-bold gradient-text mb-2">Configurações</h1>
        <p className="text-muted">
          Gerencie backup, categorias e dados da aplicação
        </p>
      </div>

      <Row className="g-3 g-md-4">
        <Col xs={6} lg={6}>
          <Card
            className="border-0 shadow-card h-100"
            style={{ overflow: "hidden" }}
          >
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  }}
                >
                  <FiDownload size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Exportar Backup</h5>
                </div>
              </div>
              <Card.Text className="text-muted mb-3">
                Exporte suas transações e categorias em formato JSON para fazer
                backup dos seus dados.
              </Card.Text>
              <Button
                onClick={handleExport}
                className="w-100 shadow d-flex align-items-center justify-content-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: "600",
                }}
              >
                <FiDownload size={18} />
                <span>Exportar Dados</span>
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={6} lg={6}>
          <Card
            className="border-0 shadow-card h-100"
            style={{ overflow: "hidden" }}
          >
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <FiUpload size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Restaurar backup</h5>
                </div>
              </div>
              <Card.Text className="text-muted mb-3">
                Importe um arquivo de backup anterior. Atenção: isso
                sobrescreverá os dados atuais.
              </Card.Text>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                ref={fileInputRef}
                style={{ display: "none" }}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-100 shadow d-flex align-items-center justify-content-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: "600",
                }}
              >
                <FiUpload size={18} />
                <span>Importar dados</span>
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <FiCalendar size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Períodos de Pagamento</h5>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    id="periodSeparationToggle"
                    checked={periodSeparationEnabled}
                    onChange={(e) =>
                      setPeriodSeparationEnabled(e.target.checked)
                    }
                    className="form-check-input"
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                      borderColor: "#667eea",
                    }}
                  />
                  <label
                    htmlFor="periodSeparationToggle"
                    className="mb-0 fw-semibold d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                  >
                    📅 Separar contas em 2 períodos de pagamento
                    {periodSeparationEnabled && (
                      <Badge
                        bg="success"
                        style={{ fontSize: "0.7rem", fontWeight: "normal" }}
                      >
                        Ativado ✓
                      </Badge>
                    )}
                  </label>
                </div>
                <small className="text-muted ms-4 ps-2 d-block mt-1">
                  {periodSeparationEnabled
                    ? "Suas transações serão organizadas em dois períodos mensais diferentes (ex: dia 10 e dia 20)"
                    : "Ative para organizar suas contas em dois períodos mensais diferentes"}
                </small>
              </div>

              {periodSeparationEnabled && (
                <div
                  className="p-3 mt-3"
                  style={{
                    background: "rgba(102, 126, 234, 0.05)",
                    borderRadius: "12px",
                    border: "2px solid rgba(102, 126, 234, 0.2)",
                  }}
                >
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold text-muted mb-2">
                          1º Período: até dia
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="31"
                          value={period1End}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= 31) {
                              setPeriod1End(val);
                              if (val < 31) {
                                setPeriod2Start(val + 1);
                              }
                            }
                          }}
                          className="text-center fw-bold"
                          style={{
                            borderRadius: "10px",
                            border: "2px solid #667eea",
                            padding: "12px",
                            fontSize: "1.1rem",
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold text-muted mb-2">
                          2º Período: a partir do dia
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="31"
                          value={period2Start}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= 31 && val > period1End) {
                              setPeriod2Start(val);
                            }
                          }}
                          className="text-center fw-bold"
                          style={{
                            borderRadius: "10px",
                            border: "2px solid #667eea",
                            padding: "12px",
                            fontSize: "1.1rem",
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="text-center mt-3">
                    <Button
                      onClick={saveUserSettings}
                      className="shadow"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        borderRadius: "10px",
                        padding: "10px 24px",
                        fontWeight: "600",
                      }}
                    >
                      💾 Salvar Configurações
                    </Button>
                  </div>
                  <small className="text-muted d-block mt-3 text-center">
                    💡 Exemplo: Se você recebe no dia 10 e no dia 20, configure
                    o 1º período até dia 10 e o 2º período a partir do dia 11
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  }}
                >
                  <FiLayout size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Personalizar Dashboard</h5>
                  <small className="text-muted">
                    Escolha quais cards aparecerão no seu dashboard
                  </small>
                </div>
              </div>

              <div className="mb-3">
                {/* Seção: Cards de Resumo */}
                <div className="mb-4">
                  <h6
                    className="fw-bold mb-3"
                    style={{ color: "var(--foreground)" }}
                  >
                    Resumo Mensal
                  </h6>
                  <Row className="g-3">
                    <Col xs={12} md={4}>
                      <div
                        className="p-3"
                        style={{
                          background: "rgba(40, 167, 69, 0.05)",
                          borderRadius: "10px",
                          border: "2px solid rgba(40, 167, 69, 0.2)",
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="dashboard-income"
                          label="📈 Receitas Totais"
                          checked={dashboardCards.monthlyIncome}
                          onChange={(e) =>
                            setDashboardCards({
                              ...dashboardCards,
                              monthlyIncome: e.target.checked,
                            })
                          }
                          className="fw-semibold"
                        />
                      </div>
                    </Col>

                    <Col xs={12} md={4}>
                      <div
                        className="p-3"
                        style={{
                          background: "rgba(220, 53, 69, 0.05)",
                          borderRadius: "10px",
                          border: "2px solid rgba(220, 53, 69, 0.2)",
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="dashboard-expense"
                          label="📉 Despesas Totais"
                          checked={dashboardCards.monthlyExpense}
                          onChange={(e) =>
                            setDashboardCards({
                              ...dashboardCards,
                              monthlyExpense: e.target.checked,
                            })
                          }
                          className="fw-semibold"
                        />
                      </div>
                    </Col>

                    <Col xs={12} md={4}>
                      <div
                        className="p-3"
                        style={{
                          background: "rgba(102, 126, 234, 0.05)",
                          borderRadius: "10px",
                          border: "2px solid rgba(102, 126, 234, 0.2)",
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="dashboard-balance"
                          label="💰 Saldo do Mês"
                          checked={dashboardCards.balance}
                          onChange={(e) =>
                            setDashboardCards({
                              ...dashboardCards,
                              balance: e.target.checked,
                            })
                          }
                          className="fw-semibold"
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Seção: Estatísticas */}
                <div className="mb-4">
                  <h6
                    className="fw-bold mb-3"
                    style={{ color: "var(--foreground)" }}
                  >
                    📈 Estatísticas Financeiras
                  </h6>
                  <Row className="g-3">
                    <Col xs={12}>
                      <div
                        className="p-3"
                        style={{
                          background: "rgba(23, 162, 184, 0.05)",
                          borderRadius: "10px",
                          border: "2px solid rgba(23, 162, 184, 0.2)",
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="dashboard-recent"
                          label="🕒 Transações Recentes e Estatísticas"
                          checked={dashboardCards.recentTransactions}
                          onChange={(e) =>
                            setDashboardCards({
                              ...dashboardCards,
                              recentTransactions: e.target.checked,
                            })
                          }
                          className="fw-semibold"
                        />
                        <small className="text-muted ms-4 d-block mt-1">
                          Lista das últimas transações e estatísticas gerais
                        </small>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Seção: Gráficos */}
                <div className="mb-4">
                  <h6
                    className="fw-bold mb-3"
                    style={{ color: "var(--foreground)" }}
                  >
                    📊 Gráficos e Análises
                  </h6>
                  <Row className="g-3">
                    <Col xs={12}>
                      <div
                        className="p-3"
                        style={{
                          background: "rgba(255, 193, 7, 0.05)",
                          borderRadius: "10px",
                          border: "2px solid rgba(255, 193, 7, 0.2)",
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="dashboard-charts"
                          label="📊 Gráficos (Despesas por Categoria, Fixas vs Variáveis, etc.)"
                          checked={dashboardCards.charts}
                          onChange={(e) =>
                            setDashboardCards({
                              ...dashboardCards,
                              charts: e.target.checked,
                            })
                          }
                          className="fw-semibold"
                        />
                        <small className="text-muted ms-4 d-block mt-1">
                          Inclui: Despesas por Categoria, Despesas Fixas vs
                          Variáveis, Evolução do Saldo
                        </small>

                        {/* Sub-options for individual charts */}
                        {dashboardCards.charts && (
                          <div className="mt-3 ms-4">
                            <Row className="g-2">
                              <Col xs={12} md={6}>
                                <Form.Check
                                  type="checkbox"
                                  id="dashboard-recurringVsVariable"
                                  label="Despesas Fixas vs Variáveis"
                                  checked={
                                    dashboardCards.recurringVsVariable ?? true
                                  }
                                  onChange={(e) =>
                                    setDashboardCards({
                                      ...dashboardCards,
                                      recurringVsVariable: e.target.checked,
                                    })
                                  }
                                  className="mb-2"
                                />
                              </Col>

                              <Col xs={12} md={6}>
                                <Form.Check
                                  type="checkbox"
                                  id="dashboard-futureProjection"
                                  label="Projeção Financeira"
                                  checked={
                                    dashboardCards.futureProjection ?? true
                                  }
                                  onChange={(e) =>
                                    setDashboardCards({
                                      ...dashboardCards,
                                      futureProjection: e.target.checked,
                                    })
                                  }
                                  className="mb-2"
                                />
                              </Col>

                              <Col xs={12} md={6}>
                                <Form.Check
                                  type="checkbox"
                                  id="dashboard-expensesByCategory"
                                  label="Despesas por Categoria"
                                  checked={
                                    dashboardCards.expensesByCategory ?? true
                                  }
                                  onChange={(e) =>
                                    setDashboardCards({
                                      ...dashboardCards,
                                      expensesByCategory: e.target.checked,
                                    })
                                  }
                                  className="mb-2"
                                />
                              </Col>
                              <Col xs={12} md={6}>
                                <Form.Check
                                  type="checkbox"
                                  id="dashboard-incomeVsExpense"
                                  label="Receitas vs Despesas"
                                  checked={
                                    dashboardCards.incomeVsExpense ?? true
                                  }
                                  onChange={(e) =>
                                    setDashboardCards({
                                      ...dashboardCards,
                                      incomeVsExpense: e.target.checked,
                                    })
                                  }
                                  className="mb-2"
                                />
                              </Col>
                            </Row>
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="text-center mt-4">
                  <Button
                    onClick={saveUserSettings}
                    className="shadow"
                    style={{
                      background:
                        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px 24px",
                      fontWeight: "600",
                    }}
                  >
                    💾 Salvar Configurações
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Seção: Cards por Período */}
        <Col xs={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>📅</span>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Cards por Período</h5>
                  <small className="text-muted">
                    Exibir cards separados por período de pagamento
                  </small>
                </div>
              </div>

              <div
                className="p-3"
                style={{
                  background: periodSeparationEnabled
                    ? "rgba(79, 172, 254, 0.05)"
                    : "rgba(108, 117, 125, 0.05)",
                  borderRadius: "10px",
                  border: periodSeparationEnabled
                    ? "2px solid rgba(79, 172, 254, 0.2)"
                    : "2px solid rgba(108, 117, 125, 0.2)",
                }}
              >
                <Form.Check
                  type="checkbox"
                  id="dashboard-periods"
                  label="📅 Exibir cards de 1º Período e 2º Período"
                  checked={dashboardCards.periodCards}
                  onChange={(e) =>
                    setDashboardCards({
                      ...dashboardCards,
                      periodCards: e.target.checked,
                    })
                  }
                  className="fw-semibold"
                  disabled={!periodSeparationEnabled}
                />
                <small className="text-muted ms-4 d-block mt-1">
                  {periodSeparationEnabled
                    ? "Exibe cards separados por período de pagamento"
                    : "⚠️ Ative a separação de períodos acima para usar esta opção"}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🏷️</span>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Gerenciar Categorias</h5>
                  <small className="text-muted">
                    Adicione ou remova categorias personalizadas
                  </small>
                </div>
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  Adicionar Nova Categoria
                </Form.Label>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Nome da categoria"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #e2e8f0",
                      padding: "12px",
                    }}
                  />
                  <Button
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                    className="shadow"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 20px",
                      minWidth: "60px",
                    }}
                  >
                    <FiPlus size={20} />
                  </Button>
                </div>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    placeholder="% máxima (opcional)"
                    value={maxPercentage}
                    onChange={(e) => setMaxPercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #e2e8f0",
                      padding: "12px",
                    }}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Valor máximo (opcional)"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #e2e8f0",
                      padding: "12px",
                    }}
                  />
                </div>
                <small className="text-muted mt-2 d-block">
                  💡 Defina limites opcionais: porcentagem máxima do orçamento
                  ou valor máximo em reais
                </small>
              </Form.Group>

              <div className="mb-4">
                <h6 className="text-muted mb-3 fw-semibold">
                  📋 Categorias Padrão:
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {DEFAULT_CATEGORIES.map((cat) => {
                    const isHidden = !categories.includes(cat);
                    if (isHidden) return null;

                    return (
                      <div
                        key={cat}
                        className="d-flex align-items-center gap-2 p-2"
                        style={{
                          borderRadius: "10px",
                          fontSize: "0.9rem",
                          fontWeight: "600",
                          background: "#6c757d",
                          color: "white",
                        }}
                      >
                        <span>{cat}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            padding: "0 4px",
                            fontSize: "1rem",
                            lineHeight: "1",
                          }}
                          title="Ocultar categoria"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {customCategories.length > 0 && (
                <div>
                  <h6 className="text-muted mb-3 fw-semibold">
                    ✨ Categorias Customizadas:
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {customCategories.map((cat) => {
                      const limits = categoryLimits[cat];
                      return (
                        <div
                          key={cat}
                          className="d-flex justify-content-between align-items-center p-3"
                          style={{
                            borderRadius: "12px",
                            border: "2px solid var(--border-color)",
                            background: "var(--card-bg)",
                          }}
                        >
                          <div className="d-flex flex-column">
                            <span
                              className="fw-semibold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {cat}
                            </span>
                            {limits &&
                              (limits.maxPercentage !== undefined ||
                                limits.maxValue !== undefined) && (
                                <small className="text-muted mt-1">
                                  {limits.maxPercentage !== undefined && (
                                    <span>📊 Máx: {limits.maxPercentage}%</span>
                                  )}
                                  {limits.maxPercentage !== undefined &&
                                    limits.maxValue !== undefined && (
                                      <span> • </span>
                                    )}
                                  {limits.maxValue !== undefined && (
                                    <span>
                                      💰 Máx: R$ {limits.maxValue.toFixed(2)}
                                    </span>
                                  )}
                                </small>
                              )}
                          </div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat)}
                            style={{
                              borderRadius: "10px",
                              padding: "6px 12px",
                            }}
                          >
                            <FiTrash2 size={16} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #674eea 0%, #a855f7 100%)",
                  }}
                >
                  <FiCreditCard size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold">Assinatura do App</h5>
                  <small className="text-muted">
                    Gerencie sua assinatura e planos pagos
                  </small>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold mb-3">Plano Atual</h6>
                <div
                  className="p-3"
                  style={{
                    background: "rgba(103, 78, 234, 0.05)",
                    borderRadius: "10px",
                    border: "2px solid rgba(103, 78, 234, 0.2)",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-0">Plano Básico (Gratuito)</h6>
                      <p className="mb-0 text-muted small">
                        Recursos básicos da aplicação
                      </p>
                    </div>
                    <Badge bg="success">Ativo</Badge>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold mb-3">Planos Disponíveis</h6>
                <Row className="g-3">
                  <Col xs={12} md={6}>
                    <div
                      className="p-3 border h-100"
                      style={{
                        borderRadius: "10px",
                        border: "2px solid rgba(33, 150, 243, 0.3)",
                      }}
                    >
                      <h6 className="mb-2">Plano Premium</h6>
                      <p className="text-muted small mb-3">
                        Recursos avançados e relatórios completos
                      </p>
                      <p className="h5 mb-0">
                        <strong>R$ 29,90</strong> /mês
                      </p>
                      <Button
                        className="w-100 mt-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      >
                        Assinar Agora
                      </Button>
                    </div>
                  </Col>
                  <Col xs={12} md={6}>
                    <div
                      className="p-3 border h-100"
                      style={{
                        borderRadius: "10px",
                        border: "2px solid rgba(255, 152, 0, 0.3)",
                      }}
                    >
                      <h6 className="mb-2">Plano Pro</h6>
                      <p className="text-muted small mb-3">
                        Todos os recursos + suporte prioritário
                      </p>
                      <p className="h5 mb-0">
                        <strong>R$ 59,90</strong> /mês
                      </p>
                      <Button
                        className="w-100 mt-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
                          border: "none",
                          borderRadius: "8px",
                        }}
                      >
                        Assinar Agora
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="mb-3">
                <h6 className="fw-bold mb-3">Método de Pagamento</h6>
                <div
                  className="p-3"
                  style={{
                    background: "rgba(103, 78, 234, 0.05)",
                    borderRadius: "10px",
                    border: "2px solid rgba(103, 78, 234, 0.2)",
                  }}
                >
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Nome no Cartão
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nome conforme impresso no cartão"
                      autoComplete="cc-name"
                      style={{
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        padding: "12px",
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Número do Cartão
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="•••• •••• •••• ••••"
                      autoComplete="cc-number"
                      style={{
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        padding: "12px",
                      }}
                    />
                  </Form.Group>

                  <Row className="g-3">
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">
                          Validade (MM/AA)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="MM/AA"
                          autoComplete="cc-exp"
                          style={{
                            borderRadius: "10px",
                            border: "2px solid #e2e8f0",
                            padding: "12px",
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">CVV</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="•••"
                          autoComplete="cc-csc"
                          style={{
                            borderRadius: "10px",
                            border: "2px solid #e2e8f0",
                            padding: "12px",
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mt-3">
                    <Form.Label className="fw-semibold">
                      CPF do Titular (opcional)
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="CPF do titular do cartão"
                      autoComplete="off"
                      style={{
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        padding: "12px",
                      }}
                    />
                  </Form.Group>

                  <Button
                    className="w-100 mt-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #674eea 0%, #a855f7 100%)",
                      border: "none",
                      borderRadius: "10px",
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Salvar Método de Pagamento
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12}>
          <Card
            className="border-0 shadow-card"
            style={{
              borderLeft: "4px solid #dc3545",
            }}
          >
            <Card.Body className="p-3 p-md-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
                  }}
                >
                  <FiTrash2 size={24} className="text-white" />
                </div>
                <div>
                  <h5 className="mb-0 fw-bold text-danger">Zona de Perigo</h5>
                  <small className="text-muted">Ação irreversível</small>
                </div>
              </div>
              <Alert
                variant="danger"
                style={{
                  borderRadius: "12px",
                  border: "none",
                  background: "rgba(220, 53, 69, 0.1)",
                }}
              >
                <strong>⚠️ Atenção!</strong> Esta ação não pode ser desfeita e
                apagará permanentemente todos os seus dados.
              </Alert>
              <Button
                onClick={handleClearAll}
                className="w-100 shadow d-flex align-items-center justify-content-center gap-2"
                style={{
                  background:
                    "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: "600",
                }}
              >
                <FiTrash2 size={18} />
                <span>Limpar Todos os Dados</span>
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
