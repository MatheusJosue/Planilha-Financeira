"use client";

import { Table, Button, Badge } from "react-bootstrap";
import { FiCopy, FiX } from "react-icons/fi";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface PreviousMonthTransactionListProps {
  transactions: Transaction[];
  onDuplicate: (transaction: Transaction) => void;
  hiddenIds: string[];
  onHide: (id: string) => void;
}

export function PreviousMonthTransactionList({
  transactions,
  onDuplicate,
  hiddenIds,
  onHide,
}: PreviousMonthTransactionListProps) {
  // Filtrar transações que já foram ocultadas
  const visibleTransactions = transactions.filter(
    (t) => !hiddenIds.includes(t.id)
  );

  if (visibleTransactions.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        Nenhuma transação encontrada
      </div>
    );
  }

  // Apenas abre o modal para duplicar - o hide só acontece após confirmar no modal
  const handleDuplicateOnly = (transaction: Transaction) => {
    onDuplicate(transaction);
  };

  return (
    <div
      className="shadow-card"
      style={{
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <Table hover responsive className="align-middle mb-0">
        <thead
          style={{
            background:
              "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          <tr>
            <th
              className="text-center"
              style={{
                padding: "1rem",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Ação
            </th>
            <th
              className="text-start"
              style={{
                padding: "1rem",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Valor
            </th>
            <th
              style={{
                padding: "1rem",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Descrição
            </th>
            <th
              style={{
                padding: "1rem",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Categoria
            </th>
            <th
              style={{
                padding: "1rem",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Data Original
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleTransactions.map((transaction) => (
            <tr key={transaction.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td className="text-center" style={{ padding: "0.75rem" }}>
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDuplicateOnly(transaction)}
                    style={{
                      borderRadius: "8px",
                      padding: "8px 14px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 4px rgba(102, 126, 234, 0.3)",
                      transition: "all 0.2s ease",
                    }}
                    title="Trazer para o mês atual"
                  >
                    <FiCopy size={14} /> Trazer
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onHide(transaction.id)}
                    style={{
                      borderRadius: "8px",
                      padding: "8px 14px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                    title="Remover da lista"
                  >
                    <FiX size={14} /> Ignorar
                  </Button>
                </div>
              </td>
              <td className="text-start" style={{ padding: "1rem" }}>
                <span
                  className={
                    transaction.type === "income"
                      ? "text-success fw-bold"
                      : "text-danger fw-bold"
                  }
                  style={{ fontSize: "1rem" }}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.value)}
                </span>
              </td>
              <td style={{ padding: "1rem", fontWeight: "500" }}>
                {transaction.description}
              </td>
              <td style={{ padding: "1rem" }}>
                <Badge
                  bg="secondary"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "0.85rem",
                  }}
                >
                  {transaction.category}
                </Badge>
              </td>
              <td style={{ padding: "1rem", fontWeight: "500" }}>
                {formatDate(transaction.date)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
