"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { Transaction, TransactionType } from "@/types";
import { useFinanceStore } from "@/store/financeStore";
import { getTodayISO } from "@/utils/formatDate";
import { showWarning } from "@/lib/sweetalert";
import { parseCurrency } from "@/utils/formatCurrency";

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

  const getInitialFormData = () => {
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
  };

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
          <Form.Group className="mb-3">
            <Form.Label>Tipo</Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as TransactionType,
                })
              }
              required
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descrição</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Supermercado, Salário..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Categoria</Form.Label>
            <Form.Select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
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
                    type="text"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    placeholder="Ex: 45,00 ou 45.00"
                    required
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--foreground)",
                      borderColor: "var(--border-color)",
                    }}
                  />
                </InputGroup>
              </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </Form.Group>
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
