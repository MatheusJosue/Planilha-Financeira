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
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 10px 30px rgba(102, 126, 234, 0.4)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          color: "white",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1) rotate(90deg)";
          e.currentTarget.style.boxShadow =
            "0 15px 40px rgba(102, 126, 234, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
          e.currentTarget.style.boxShadow =
            "0 10px 30px rgba(102, 126, 234, 0.4)";
        }}
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
