"use client";

import { useState, useRef } from "react";
import { Card, Button, Form, Badge, Row, Col, Alert } from "react-bootstrap";
import { FiDownload, FiUpload, FiTrash2, FiPlus } from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { DEFAULT_CATEGORIES } from "@/types";
import {
  showSuccess,
  showError,
  showWarning,
  showConfirm,
} from "@/lib/sweetalert";

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

  const handleImportNewFormat = async (data: any) => {
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
        const transactionsToInsert = data.realTransactions.map((t: any) => ({
          description: t.description,
          type: t.type,
          category: t.category,
          value: t.value,
          date: t.date,
          month: t.date.substring(0, 7),
          user_id: user.id,
        }));

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
      const value = maxValue ? parseFloat(maxValue) : undefined;

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

    const title = isDefaultCategory ? "Ocultar categoria?" : "Excluir categoria?";

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

      <Row className="g-4">
        <Col lg={6}>
          <Card
            className="border-0 shadow-card h-100"
            style={{ overflow: "hidden" }}
          >
            <Card.Body className="p-4">
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
                  <h5 className="mb-0 fw-bold">Backup de Dados</h5>
                  <small className="text-muted">Exportar transações</small>
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

        <Col lg={6}>
          <Card
            className="border-0 shadow-card h-100"
            style={{ overflow: "hidden" }}
          >
            <Card.Body className="p-4">
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
                  <h5 className="mb-0 fw-bold">Importar Dados</h5>
                  <small className="text-muted">Restaurar backup</small>
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
                <span>Selecionar Arquivo</span>
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={12}>
          <Card className="border-0 shadow-card">
            <Card.Body className="p-4">
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
                    type="number"
                    placeholder="Valor máximo (opcional)"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    min="0"
                    step="0.01"
                    style={{
                      borderRadius: "12px",
                      border: "2px solid #e2e8f0",
                      padding: "12px",
                    }}
                  />
                </div>
                <small className="text-muted mt-2 d-block">
                  💡 Defina limites opcionais: porcentagem máxima do orçamento ou valor máximo em reais
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
                            {limits && (limits.maxPercentage !== undefined || limits.maxValue !== undefined) && (
                              <small className="text-muted mt-1">
                                {limits.maxPercentage !== undefined && (
                                  <span>📊 Máx: {limits.maxPercentage}%</span>
                                )}
                                {limits.maxPercentage !== undefined && limits.maxValue !== undefined && (
                                  <span> • </span>
                                )}
                                {limits.maxValue !== undefined && (
                                  <span>💰 Máx: R$ {limits.maxValue.toFixed(2)}</span>
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

        <Col lg={12}>
          <Card
            className="border-0 shadow-card"
            style={{
              borderLeft: "4px solid #dc3545",
            }}
          >
            <Card.Body className="p-4">
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
