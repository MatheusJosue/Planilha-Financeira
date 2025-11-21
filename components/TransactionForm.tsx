"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Col, Row } from "react-bootstrap";
import { Transaction, TransactionType } from "@/types";
import { useFinanceStore } from "@/store/financeStore";
import { getTodayISO } from "@/utils/formatDate";
import { showWarning } from "@/lib/sweetalert";
import { parseCurrency } from "@/utils/formatCurrency";
import { SelectField } from "@/components/ui/SelectField";
import { InputField } from "@/components/ui/InputField";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { DateInput } from "@/components/ui/DateInput";

interface TransactionFormProps {
  show: boolean;
  onHide: () => void;
  transaction?: Transaction | null;
}

export function TransactionForm({
  show,
  onHide,
  transaction,
}: TransactionFormProps) {
  const { categories, addTransaction, updateTransaction } = useFinanceStore();

  const getInitialFormData = useCallback(() => {
    if (transaction) {
      return {
        description: transaction.description,
        type: transaction.type,
        category: transaction.category,
        value: transaction.value.toString(),
        date: transaction.date,
      };
    }
    return {
      description: "",
      type: "expense" as TransactionType,
      category: categories[0] || "",
      value: "",
      date: getTodayISO(),
    };
  }, [transaction, categories]);

  const [formData, setFormData] = useState(getInitialFormData);

  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseCurrency(formData.value);
    if (isNaN(value) || value <= 0) {
      showWarning("Por favor, insira um valor válido");
      return;
    }

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
      addTransaction({
        description: formData.description,
        type: formData.type,
        category: formData.category,
        value,
        date: formData.date,
      });
    }

    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {transaction && transaction.id
            ? "Editar Transação"
            : "Nova Transação"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6} className="mb-3">
              <InputField
                label="Descrição"
                value={formData.description}
                onChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
                placeholder="Ex: Supermercado, Salário..."
                required
              />
            </Col>

            <Col md={6} className="mb-3">
              <CurrencyInput
                label="Valor"
                value={formData.value}
                onChange={(value) => setFormData({ ...formData, value })}
                labelStyle={{ color: "var(--foreground)" }}
                style={{
                  backgroundColor: "var(--input-bg)",
                  color: "var(--foreground)",
                  borderColor: "var(--border-color)",
                }}
                required
              />
            </Col>
          </Row>

          <SelectField
            label="Tipo"
            value={formData.type}
            onChange={(value) =>
              setFormData({ ...formData, type: value as TransactionType })
            }
            options={[
              { value: "expense", label: "Despesa" },
              { value: "income", label: "Receita" },
            ]}
            required
          />

          <SelectField
            label="Categoria"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categories.map((cat) => ({ value: cat, label: cat }))}
            required
          />

          <DateInput
            label="Data"
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            required
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {transaction ? "Salvar Alterações" : "Adicionar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
