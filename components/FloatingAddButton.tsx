"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { TransactionForm } from "./TransactionForm";

export function FloatingAddButton() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        className="floating-button"
        onClick={() => setShowForm(true)}
        title="Nova Transação"
      >
        <FiPlus size={28} strokeWidth={3} />
      </button>

      <TransactionForm
        show={showForm}
        onHide={() => setShowForm(false)}
        transaction={null}
      />
    </>
  );
}
