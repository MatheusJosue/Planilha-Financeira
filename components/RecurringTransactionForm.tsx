"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { FiRepeat, FiEdit } from "react-icons/fi";
import { RecurringTransaction, RecurrenceType, TransactionType } from "@/types";
import { useFinanceStore } from "@/store/financeStore";
import { parseCurrency } from "@/utils/formatCurrency";

interface RecurringTransactionFormProps {
  show: boolean;
  onHide: () => void;
  transaction?: RecurringTransaction;
  defaultType?: TransactionType;
}

export default function RecurringTransactionForm({
  show,
  onHide,
  transaction,
  defaultType = "expense",
}: RecurringTransactionFormProps) {
  const { categories, transactions, addRecurringTransaction, updateRecurringTransaction } =
    useFinanceStore();

  // Get only income transactions to calculate the percentage
  const incomeTransactions = transactions.filter(t => t.type === "income");

  const getInitialFormData = () => {
    if (transaction) {
      return {
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        value: transaction.value.toString(),
        recurrence_type: transaction.recurrence_type,
        start_date: transaction.start_date.split("T")[0],
        end_date: transaction.end_date?.split("T")[0] || "",
        total_installments: transaction.total_installments?.toString() || "",
        day_of_month: transaction.day_of_month.toString(),
        is_active: transaction.is_active,
      };
    }
    return {
      description: "",
      type: defaultType,
      category: categories[0] || "",
      value: "",
      recurrence_type: "fixed" as RecurrenceType,
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      total_installments: "",
      day_of_month: "5",
      is_active: true,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    setFormData(getInitialFormData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedValue = 0;
    // For variable_by_income type, the value represents a percentage (should be between 0 and 100)
    if (formData.recurrence_type === "variable_by_income") {
      const percentage = parseFloat(formData.value);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        alert("A porcentagem deve estar entre 0 e 100");
        return;
      }
      parsedValue = percentage; // Store the percentage value as the main value
    } else {
      parsedValue = parseCurrency(formData.value);
    }

    const data: Omit<RecurringTransaction, "id" | "user_id" | "created_at"> = {
      description: formData.description,
      type: formData.type,
      category: formData.category,
      value: parsedValue,
      recurrence_type: formData.recurrence_type,
      start_date: formData.start_date,
      day_of_month: parseInt(formData.day_of_month),
      is_active: formData.is_active,
    };

    if (
      formData.recurrence_type === "installment" &&
      formData.total_installments
    ) {
      data.total_installments = parseInt(formData.total_installments);
      data.current_installment = transaction?.current_installment || 1;
    }

    if (formData.end_date) {
      data.end_date = formData.end_date;
    }

    if (transaction) {
      await updateRecurringTransaction(transaction.id, data);
    } else {
      await addRecurringTransaction(data);
    }

    onHide();
  };

  const isIncome = formData.type === "income";
  const gradientColors = isIncome
    ? "linear-gradient(135deg, #198754 0%, #20c997 100%)"
    : "linear-gradient(135deg, #dc3545 0%, #d63384 100%)";

  const isVariableByIncome = formData.recurrence_type === "variable_by_income";

  return (
    <Modal id="recurring-transaction-form-modal" show={show} onHide={onHide} size="lg" centered>
      <Modal.Header
        closeButton
        style={{
          background: gradientColors,
          color: "#fff",
          borderBottom: "none",
        }}
      >
        <Modal.Title
          className="d-flex align-items-center gap-2"
          style={{ color: "#fff" }}
        >
          {transaction ? (
            <>
              <FiEdit size={24} />
              Editar Conta Recorrente
            </>
          ) : (
            <>
              <FiRepeat size={24} />
              Nova Conta Recorrente
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Form id="recurring-transaction-form" onSubmit={handleSubmit}>
        <Modal.Body style={{ padding: "2rem" }}>
          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  Tipo de Recorrência
                </Form.Label>
                <Form.Select
                  id="form-recurrence-type"
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
                  <option value="fixed">📅 Fixa Mensal (ex: aluguel)</option>
                  <option value="installment">📊 Parcelada (ex: 12x)</option>
                  <option value="variable">
                    📈 Variável Mensal (ex: luz, água)
                  </option>
                  <option value="variable_by_income">
                    💰 Variável por renda (ex: imposto sobre renda)
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  Descrição
                </Form.Label>
                <Form.Control
                  id="form-description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ex: Aluguel, Internet, Financiamento..."
                  required
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--foreground)",
                    borderColor: "var(--border-color)",
                  }}
                />
              </Form.Group>
            </Col>

            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  {isVariableByIncome ? "Percentual sobre renda (%)" : "Valor"}
                </Form.Label>
                {isVariableByIncome ? (
                  <InputGroup>
                    <Form.Control
                      id="form-value-percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      placeholder="Ex: 15 (para 15%)"
                      required
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                    <InputGroup.Text
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      %
                    </InputGroup.Text>
                  </InputGroup>
                ) : (
                  <InputGroup>
                    <InputGroup.Text
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      R$
                    </InputGroup.Text>
                    <Form.Control
                      id="form-value"
                      type="text"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      placeholder="Ex: 45,00"
                      required
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--foreground)",
                        borderColor: "var(--border-color)",
                      }}
                    />
                  </InputGroup>
                )}
                {isVariableByIncome && (
                  <Form.Text style={{ color: "var(--muted-foreground)" }}>
                    Este percentual será aplicado sobre a soma da sua renda mensal
                  </Form.Text>
                )}
              </Form.Group>
            </Col>

            {isVariableByIncome && (
              <Col md={12} className="mb-3">
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
            )}

            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  Categoria
                </Form.Label>
                <Form.Select
                  id="form-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--foreground)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  Dia do Vencimento
                </Form.Label>
                <Form.Control
                  id="form-day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day_of_month}
                  onChange={(e) =>
                    setFormData({ ...formData, day_of_month: e.target.value })
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

            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label
                  style={{ color: "var(--foreground)", fontWeight: 500 }}
                >
                  Data de Início
                </Form.Label>
                <Form.Control
                  id="form-start-date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--foreground)",
                    borderColor: "var(--border-color)",
                  }}
                />
              </Form.Group>
            </Col>

            {formData.recurrence_type === "installment" && (
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label
                    style={{ color: "var(--foreground)", fontWeight: 500 }}
                  >
                    Número de Parcelas
                  </Form.Label>
                  <Form.Control
                    id="form-total-installments"
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
            )}

            {formData.recurrence_type === "fixed" && (
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label
                    style={{ color: "var(--foreground)", fontWeight: 500 }}
                  >
                    Data de Término (opcional)
                  </Form.Label>
                  <Form.Control
                    id="form-end-date"
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
            )}

            <Col md={12}>
              <Form.Group>
                <Form.Check
                  id="form-is-active"
                  type="checkbox"
                  label="Transação ativa"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  style={{ color: "var(--foreground)" }}
                />
                <Form.Text style={{ color: "var(--muted-foreground)" }}>
                  Desmarque para pausar esta transação recorrente
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: "var(--card-bg)",
            borderTop: "2px solid",
            borderImage: `${gradientColors} 1`,
            padding: "1rem 2rem",
          }}
        >
          <Button
            id="btn-cancel-recurring"
            variant="outline-secondary"
            onClick={onHide}
            style={{
              borderRadius: "8px",
              padding: "0.5rem 1.5rem",
            }}
          >
            Cancelar
          </Button>
          <Button
            id="btn-submit-recurring"
            type="submit"
            style={{
              background: gradientColors,
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1.5rem",
              color: "white",
            }}
          >
            {transaction ? "💾 Salvar Alterações" : "✨ Criar Conta"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
