"use client";

import { useState } from "react";
import { Button } from "react-bootstrap";
import { FiPlus } from "react-icons/fi";
import { Transaction } from "@/types";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { MonthSelector } from "@/components/MonthSelector";

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [duplicatingTransaction, setDuplicatingTransaction] =
    useState<Transaction | null>(null);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDuplicatingTransaction(null);
    setShowForm(true);
  };

  const handleDuplicate = (transaction: Transaction) => {
    const [year, month, day] = transaction.date.split("-").map(Number);

    let nextMonth = month + 1;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    const validDay = Math.min(day, daysInNextMonth);

    const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(
      2,
      "0"
    )}-${String(validDay).padStart(2, "0")}`;

    const duplicated: Transaction = {
      ...transaction,
      date: nextMonthStr,
      id: "",
    };

    setDuplicatingTransaction(duplicated);
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setDuplicatingTransaction(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="display-5 fw-bold gradient-text mb-2">Transações</h1>
          <p className="text-muted">
            Gerencie todas as suas movimentações financeiras
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setShowForm(true)}
          className="d-flex align-items-center gap-2 shadow"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
          }}
        >
          <FiPlus size={20} /> Nova Transação
        </Button>
      </div>

      <MonthSelector />

      <TransactionList onEdit={handleEdit} onDuplicate={handleDuplicate} />

      <TransactionForm
        show={showForm}
        onHide={handleCloseForm}
        transaction={editingTransaction || duplicatingTransaction}
      />
    </div>
  );
}
