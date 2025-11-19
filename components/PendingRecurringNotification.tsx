"use client";

import { useMemo, useState, useEffect } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import { useFinanceStore } from "@/store/financeStore";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { FiBell, FiCheck, FiX } from "react-icons/fi";

export default function PendingRecurringNotification() {
  const { transactions, updatePaymentStatus } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);

  const pendingTransactions = useMemo(() => {
    if (typeof window === "undefined") return [];

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const pending = transactions.filter((t) => {
      if (!t.is_predicted) return false;
      if (t.is_paid !== undefined) return false;

      return t.date <= todayStr;
    });

    const dismissedKey = `dismissed-recurring-${todayStr}`;
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || "[]");

    return pending.filter((t) => !dismissed.includes(t.id));
  }, [transactions]);

  // Escutar evento para abrir o modal
  useEffect(() => {
    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("openRecurringNotifications", handleOpenModal);
    return () =>
      window.removeEventListener("openRecurringNotifications", handleOpenModal);
  }, []);

  const handleMarkAsPaid = (transaction: Transaction) => {
    // Atualizar a transação como paga
    updatePaymentStatus(transaction.id, true);

    // Fechar modal se foi a última
    if (pendingTransactions.length <= 1) {
      setShowModal(false);
    }
  };

  const handleMarkAsUnpaid = (transaction: Transaction) => {
    // Atualizar a transação como não paga
    updatePaymentStatus(transaction.id, false);

    // Fechar modal se foi a última
    if (pendingTransactions.length <= 1) {
      setShowModal(false);
    }
  };

  const handleDismissAll = () => {
    const today = new Date().toISOString().split("T")[0];
    const dismissedKey = `dismissed-recurring-${today}`;
    const dismissed = pendingTransactions.map((t) => t.id);
    localStorage.setItem(dismissedKey, JSON.stringify(dismissed));

    setShowModal(false);
  };

  if (pendingTransactions.length === 0) return null;

  return (
    <>
      {/* Modal de confirmação */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
            borderBottom: "1px solid var(--border-color)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <div>
            <Modal.Title
              style={{
                color: "var(--foreground)",
                fontSize: "1.5rem",
                fontWeight: "600",
              }}
            >
              <FiBell className="me-2" style={{ marginBottom: "3px" }} />
              Transações Vencidas
            </Modal.Title>
            <p
              className="mb-0 mt-1"
              style={{
                color: "var(--muted-foreground)",
                fontSize: "0.9rem",
                fontWeight: "normal",
              }}
            >
              {pendingTransactions.length} transação(ões) aguardando confirmação
            </p>
          </div>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
            padding: "1.5rem",
          }}
        >
          <div className="d-flex flex-column gap-3">
            {pendingTransactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  backgroundColor: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderLeft: `4px solid ${
                    transaction.type === "income" ? "#28a745" : "#dc3545"
                  }`,
                  borderRadius: "6px",
                  padding: "1rem",
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <h6
                      className="mb-1"
                      style={{ color: "var(--foreground)", fontWeight: "600" }}
                    >
                      {transaction.description}
                    </h6>
                    <div
                      className="d-flex align-items-center gap-3"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      <span>
                        📅{" "}
                        {new Date(
                          transaction.date + "T00:00:00"
                        ).toLocaleDateString("pt-BR")}
                      </span>
                      <span>🏷️ {transaction.category}</span>
                      <Badge
                        bg={
                          transaction.type === "income" ? "success" : "danger"
                        }
                        style={{ fontSize: "0.7rem" }}
                      >
                        {transaction.type === "income" ? "Receita" : "Despesa"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <span
                        style={{
                          fontWeight: "700",
                          fontSize: "1.1rem",
                          color:
                            transaction.type === "income"
                              ? "#28a745"
                              : "#dc3545",
                        }}
                      >
                        {formatCurrency(transaction.value)}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 ms-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleMarkAsPaid(transaction)}
                      className="d-flex align-items-center"
                      style={{ padding: "0.5rem 1.2rem", whiteSpace: "nowrap" }}
                    >
                      <FiCheck size={16} className="me-1" />
                      Pago
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleMarkAsUnpaid(transaction)}
                      className="d-flex align-items-center"
                      style={{ padding: "0.5rem 1.2rem", whiteSpace: "nowrap" }}
                    >
                      <FiX size={16} className="me-1" />
                      Não Pago
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: "var(--card-bg)",
            borderTop: "1px solid var(--border-color)",
            padding: "1rem 1.5rem",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={handleDismissAll}
            style={{ padding: "0.5rem 1.5rem", fontWeight: "500" }}
          >
            Lembrar Amanhã
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
