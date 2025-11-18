"use client";

import { useState, useRef } from "react";
import { Card, Button, Form, Badge, Row, Col, Alert } from "react-bootstrap";
import { FiDownload, FiUpload, FiTrash2, FiPlus } from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { DEFAULT_CATEGORIES } from "@/types";

export default function SettingsPage() {
  const {
    transactions,
    categories,
    addCategory,
    deleteCategory,
    importData,
    clearAllData,
  } = useFinanceStore();

  const [newCategory, setNewCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify({ transactions, categories }, null, 2);
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
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && data.categories) {
          if (
            window.confirm(
              "Isso substituirá todos os dados atuais. Deseja continuar?"
            )
          ) {
            importData(data);
            alert("Dados importados com sucesso!");
          }
        } else {
          alert("Arquivo inválido!");
        }
      } catch {
        alert("Erro ao ler o arquivo!");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      if (categories.includes(newCategory.trim())) {
        alert("Esta categoria já existe!");
        return;
      }
      addCategory(newCategory.trim());
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (category: string) => {
    const usedInTransactions = transactions.some(
      (t) => t.category === category
    );
    if (usedInTransactions) {
      alert(
        "Não é possível excluir uma categoria que está sendo usada em transações!"
      );
      return;
    }

    if (window.confirm(`Deseja realmente excluir a categoria "${category}"?`)) {
      deleteCategory(category);
    }
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "⚠️ ATENÇÃO: Isso apagará TODAS as suas transações e categorias customizadas. Esta ação não pode ser desfeita!"
      )
    ) {
      if (
        window.confirm(
          "Tem certeza absoluta? Todos os seus dados serão perdidos!"
        )
      ) {
        clearAllData();
        alert("Todos os dados foram apagados!");
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
                <div className="d-flex gap-2">
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
              </Form.Group>

              <div className="mb-4">
                <h6 className="text-muted mb-3 fw-semibold">
                  📋 Categorias Padrão:
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <Badge
                      key={cat}
                      bg="secondary"
                      className="p-2"
                      style={{
                        borderRadius: "10px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {customCategories.length > 0 && (
                <div>
                  <h6 className="text-muted mb-3 fw-semibold">
                    ✨ Categorias Customizadas:
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {customCategories.map((cat) => (
                      <div
                        key={cat}
                        className="d-flex justify-content-between align-items-center p-3"
                        style={{
                          borderRadius: "12px",
                          border: "2px solid #e2e8f0",
                          background: "#f8f9fa",
                        }}
                      >
                        <span className="fw-semibold">{cat}</span>
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
                    ))}
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
