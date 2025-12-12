"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Col, Row } from "react-bootstrap";
import { FiPlus, FiEdit } from "react-icons/fi";
import { Transaction, TransactionType, RecurrenceType } from "@/types";
import { useFinanceStore } from "@/store/financeStore";
import { getTodayISO } from "@/utils/formatDate";
import { showWarning } from "@/lib/sweetalert";
import { parseCurrency } from "@/utils/formatCurrency";
import { SelectField } from "@/components/ui/SelectField";
import { InputField } from "@/components/ui/InputField";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DateInput } from "@/components/ui/DateInput";
import { CategoryPicker } from "@/components/CategoryPicker";

interface TransactionFormProps {
  show: boolean;
  onHide: () => void;
  transaction?: Transaction | null;
  defaultType?: TransactionType;
}

export function TransactionForm({
  show,
  onHide,
  transaction,
  defaultType,
}: TransactionFormProps) {
  const {
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    addRecurringTransaction,
  } = useFinanceStore();

  const incomeTransactions = transactions.filter(t => t.type === "income");

  const getInitialFormData = useCallback(() => {
    if (transaction) {
      return {
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        value: transaction.value.toString(),
        date: transaction.date,
        isRecurring: false,
        recurrence_type: "fixed" as RecurrenceType,
        day_of_month: "5",
        total_installments: "",
        end_date: "",
      };
    }
    return {
      description: "",
      type: defaultType || ("expense" as TransactionType),
      category: "", // We'll let the CategoryPicker handle the initial category selection
      value: "",
      date: getTodayISO(),
      isRecurring: false,
      recurrence_type: "fixed" as RecurrenceType,
      day_of_month: "5",
      total_installments: "",
      end_date: "",
    };
  }, [transaction, defaultType]);

  const [formData, setFormData] = useState(getInitialFormData);

  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let value: number;

    // Validate and parse value based on transaction type
    if (formData.isRecurring && formData.recurrence_type === "variable_by_income") {
      // For variable_by_income type, the value represents a percentage
      const percentage = parseFloat(formData.value);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        showWarning("Por favor, insira um percentual válido (0-100)");
        return;
      }
      value = percentage;
    } else {
      // For all other types (regular transactions and other recurring types), parse as currency
      value = parseCurrency(formData.value);
      if (isNaN(value) || value <= 0) {
        showWarning("Por favor, insira um valor válido");
        return;
      }
    }

    // Validate description
    if (!formData.description.trim()) {
      showWarning("Por favor, insira uma descrição");
      return;
    }

    const isEditing = transaction && transaction.id;

    if (isEditing) {
      updateTransaction(transaction.id, {
        description: formData.description,
        type: formData.type,
        category: formData.category,
        value,
        date: formData.date,
      });
    } else {
      if (formData.isRecurring) {
        addRecurringTransaction({
          description: formData.description,
          type: formData.type,
          category: formData.category,
          value,
          recurrence_type: formData.recurrence_type as RecurrenceType,
          start_date: formData.date,
          day_of_month: parseInt(formData.day_of_month),
          is_active: true,
          end_date: formData.end_date || undefined,
          total_installments: formData.total_installments
            ? parseInt(formData.total_installments)
            : undefined,
        });
      } else {
        // This is where regular transactions should be added
        addTransaction({
          description: formData.description,
          type: formData.type,
          category: formData.category,
          value,
          date: formData.date,
        });
      }
    }

    onHide();
  };

  const isVariableByIncome = formData.isRecurring && formData.recurrence_type === "variable_by_income";
  const currentValueLabel = isVariableByIncome ? "Percentual sobre renda (%)" : "Valor";

  const handleValueChange = (value: string) => {
    setFormData({ ...formData, value });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
          borderBottom: "none",
        }}
      >
        <Modal.Title className="d-flex align-items-center gap-2">
          {transaction && transaction.id ? (
            <>
              <FiEdit size={24} />
              Editar Transação
            </>
          ) : (
            <>
              <FiPlus size={24} />
              Nova Transação
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ padding: "2rem" }}>
          {!defaultType && (
            <Row className="mb-3">
              <Col md={12}>
                <SelectField
                  label="Tipo de Transação"
                  value={formData.type}
                  onChange={(value) =>
                    setFormData({ ...formData, type: value as TransactionType })
                  }
                  options={[
                    { value: "expense", label: "💸 Despesa" },
                    { value: "income", label: "💰 Receita" },
                  ]}
                  required
                />
              </Col>
            </Row>
          )}

          <Row className="mb-3">
            <Col md={12}>
              <InputField
                label="Descrição"
                value={formData.description}
                onChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
                placeholder="Ex: Supermercado, Salário, Gasolina..."
                required
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              {isVariableByIncome ? (
                <Form.Group>
                  <Form.Label
                    style={{ color: "var(--foreground)", fontWeight: 500 }}
                  >
                    {currentValueLabel}
                  </Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => handleValueChange(e.target.value)}
                      placeholder="Ex: 15 (para 15%)"
                      required
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <span
                      className="ms-2"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        padding: "0.375rem 0.75rem",
                        border: "1px solid var(--border-color)",
                        borderLeft: "none",
                        borderRadius: "0 4px 4px 0",
                        whiteSpace: "nowrap",
                      }}
                    >
                      %
                    </span>
                  </div>
                </Form.Group>
              ) : (
                <CurrencyInput
                  label={currentValueLabel}
                  value={formData.value}
                  onChange={handleValueChange}
                  labelStyle={{ color: "var(--foreground)" }}
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--foreground)",
                    borderColor: "var(--border-color)",
                  }}
                  required
                />
              )}
            </Col>
          </Row>

          {isVariableByIncome && (
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label
                    style={{ color: "var(--foreground)", fontWeight: 500 }}
                  >
                    Renda Mensal Atual
                  </Form.Label>
                  <div
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--foreground)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      minHeight: "40px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {incomeTransactions.length > 0 ? (
                      <div>
                        <div>
                          <strong>Total:</strong> {incomeTransactions.reduce((sum, t) => sum + t.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="mt-1">
                          <small className="text-muted">
                            {incomeTransactions.length} transações de renda registradas
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted">
                        Nenhuma transação de renda encontrada
                      </div>
                    )}
                  </div>
                  <Form.Text style={{ color: "var(--muted-foreground)" }}>
                    Valor base para cálculo do percentual
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row className="mb-3">
            <Col md={12}>
              <CategoryPicker
                categories={categories}
                selectedCategory={formData.category}
                onSelect={(category) => setFormData({ ...formData, category })}
              />
            </Col>
          </Row>

          {!transaction && (
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Check
                    type="checkbox"
                    label="🔄 Transação Recorrente"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRecurring: e.target.checked,
                      })
                    }
                    style={{ color: "var(--foreground)", fontWeight: 500 }}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          {formData.isRecurring && !transaction && (
            <>
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label
                      style={{ color: "var(--foreground)", fontWeight: 500 }}
                    >
                      Tipo de Recorrência
                    </Form.Label>
                    <Form.Select
                      value={formData.recurrence_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence_type: e.target.value as RecurrenceType,
                        })
                      }
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <option value="fixed">
                        📅 Fixa Mensal (ex: aluguel)
                      </option>
                      <option value="installment">
                        📊 Parcelada (ex: 12x)
                      </option>
                      <option value="variable">
                        📈 Variável Mensal (ex: luz, água)
                      </option>
                      <option value="variable_by_income">
                        💰 Variável por renda (ex: imposto sobre renda)
                      </option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label
                      style={{ color: "var(--foreground)", fontWeight: 500 }}
                    >
                      Dia do Vencimento
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="31"
                      value={formData.day_of_month}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          day_of_month: e.target.value,
                        })
                      }
                      required
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <Form.Text style={{ color: "var(--muted-foreground)" }}>
                      Dia do mês que a transação ocorre
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {formData.recurrence_type === "installment" && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label
                        style={{ color: "var(--foreground)", fontWeight: 500 }}
                      >
                        Número de Parcelas
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={formData.total_installments}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_installments: e.target.value,
                          })
                        }
                        placeholder="Ex: 12"
                        required
                        style={{
                          backgroundColor: "var(--input-bg)",
                          color: "var(--foreground)",
                          borderColor: "var(--border-color)",
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {formData.recurrence_type === "fixed" && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label
                        style={{ color: "var(--foreground)", fontWeight: 500 }}
                      >
                        Data de Término (opcional)
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                        style={{
                          backgroundColor: "var(--input-bg)",
                          color: "var(--foreground)",
                          borderColor: "var(--border-color)",
                        }}
                      />
                      <Form.Text style={{ color: "var(--muted-foreground)" }}>
                        Deixe vazio para recorrência indeterminada
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </>
          )}

          <Row>
            <Col md={12}>
              <DateInput
                label={formData.isRecurring ? "Data de Início" : "Data"}
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                required
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: "1px solid var(--border-color)",
            padding: "1rem 2rem",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={onHide}
            style={{
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: "500",
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: "500",
            }}
          >
            {transaction ? "💾 Salvar Alterações" : "✨ Adicionar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
