"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Transaction, TransactionType } from "@/types";
import { useFinanceStore } from "@/store/financeStore";
import { getTodayISO } from "@/utils/formatDate";
import { showWarning } from "@/lib/sweetalert";

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

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      showWarning("Por favor, insira um valor válido");
      return;
    }

    if (!formData.description.trim()) {
      showWarning("Por favor, insira uma descrição");
      return;
    }

    if (transaction) {
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
          {transaction ? "Editar Transação" : "Nova Transação"}
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
            <Form.Label>Valor (R$)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              required
            />
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
