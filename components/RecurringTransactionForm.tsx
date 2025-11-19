"use client";

import { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, InputGroup } from "react-bootstrap";
import { RecurringTransaction, RecurrenceType, TransactionType } from "@/types";
import { useFinanceStore } from "@/store/financeStore";

interface RecurringTransactionFormProps {
  show: boolean;
  onHide: () => void;
  transaction?: RecurringTransaction;
}

export default function RecurringTransactionForm({
  show,
  onHide,
  transaction,
}: RecurringTransactionFormProps) {
  const { categories, addRecurringTransaction, updateRecurringTransaction } =
    useFinanceStore();

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
      type: "expense" as TransactionType,
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

  // Atualizar o formulário quando a transação mudar
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [transaction, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: Omit<RecurringTransaction, "id" | "user_id" | "created_at"> = {
      description: formData.description,
      type: formData.type,
      category: formData.category,
      value: parseFloat(formData.value),
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

  return (
    <Modal show={show} onHide={onHide} size="lg" centered data-bs-theme="dark">
      <Modal.Header
        closeButton
        style={{
          backgroundColor: "var(--card-bg)",
          color: "var(--foreground)",
        }}
      >
        <Modal.Title style={{ color: "var(--foreground)" }}>
          {transaction ? "Editar" : "Nova"} Transação Recorrente
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
          }}
        >
          <Row>
            <Col md={12} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
                  Descrição
                </Form.Label>
                <Form.Control
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

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
                  Tipo
                </Form.Label>
                <Form.Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as TransactionType,
                    })
                  }
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--foreground)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
                  Categoria
                </Form.Label>
                <Form.Select
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

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
                  Valor
                </Form.Label>
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
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    placeholder="0,00"
                    required
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--foreground)",
                      borderColor: "var(--border-color)",
                    }}
                  />
                </InputGroup>
              </Form.Group>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
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
                  <option value="fixed">Fixa Mensal (ex: aluguel)</option>
                  <option value="installment">Parcelada (ex: 12x)</option>
                  <option value="variable">
                    Variável Mensal (ex: luz, água)
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
                  Dia do Vencimento
                </Form.Label>
                <Form.Control
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

            <Col md={6} className="mb-3">
              <Form.Group>
                <Form.Label style={{ color: "var(--foreground)" }}>
                  Data de Início
                </Form.Label>
                <Form.Control
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
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ color: "var(--foreground)" }}>
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
            )}

            {formData.recurrence_type === "fixed" && (
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ color: "var(--foreground)" }}>
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
            )}

            <Col md={12}>
              <Form.Group>
                <Form.Check
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
        <Modal.Footer style={{ backgroundColor: "var(--card-bg)" }}>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {transaction ? "Atualizar" : "Criar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
