"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Table,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRepeat,
  FiCalendar,
} from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { RecurringTransaction } from "@/types";
import RecurringTransactionForm from "@/components/RecurringTransactionForm";
import { formatCurrency } from "@/utils/formatCurrency";
import { useRouter } from "next/navigation";

export default function RecorrentesPage() {
  const router = useRouter();
  const {
    recurringTransactions,
    loadRecurringTransactions,
    deleteRecurringTransaction,
  } = useFinanceStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<
    RecurringTransaction | undefined
  >(undefined);

  useEffect(() => {
    loadRecurringTransactions();
  }, [loadRecurringTransactions]);

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação recorrente?")) {
      await deleteRecurringTransaction(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTransaction(undefined);
  };

  const getRecurrenceLabel = (transaction: RecurringTransaction) => {
    switch (transaction.recurrence_type) {
      case "fixed":
        return "Fixa Mensal";
      case "installment":
        return `Parcelada ${transaction.current_installment || 1}/${
          transaction.total_installments
        }`;
      case "variable":
        return "Variável Mensal";
      case "variable_by_income":
        return "Variável por Renda";
    }
  };

  const activeTransactions = recurringTransactions.filter((t) => t.is_active);
  const inactiveTransactions = recurringTransactions.filter(
    (t) => !t.is_active
  );

  const totalMonthlyExpense = activeTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.value, 0);

  const totalMonthlyIncome = activeTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.value, 0);

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 d-flex align-items-center">
            <FiRepeat className="me-2" />
            Transações Recorrentes
          </h2>
          <p className="text-muted">
            Gerencie gastos fixos, variáveis e parcelados
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingTransaction(undefined);
            setShowForm(true);
          }}
          className="d-flex align-items-center"
          style={{ whiteSpace: "nowrap" }}
        >
          <FiPlus className="me-2" />
          Nova Transação Recorrente
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted mb-2">Despesas Mensais Fixas</h6>
              <h3 className="text-danger mb-0">
                {formatCurrency(totalMonthlyExpense)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted mb-2">Receitas Mensais Fixas</h6>
              <h3 className="text-success mb-0">
                {formatCurrency(totalMonthlyIncome)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h6 className="text-muted mb-2">Saldo Mensal Previsto</h6>
              <h3
                className={
                  totalMonthlyIncome - totalMonthlyExpense >= 0
                    ? "text-success"
                    : "text-danger"
                }
              >
                {formatCurrency(totalMonthlyIncome - totalMonthlyExpense)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Transações Ativas</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {activeTransactions.length === 0 ? (
            <div className="text-center py-5">
              <FiCalendar size={48} className="text-muted mb-3" />
              <p className="text-muted">Nenhuma transação recorrente ativa</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                Criar Primeira Transação
              </Button>
            </div>
          ) : (
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
                      Ações
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
                      Tipo
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
                      Valor
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      Recorrência
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      Dia Vencimento
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      Início
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="text-center" style={{ padding: "1rem" }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => handleEdit(transaction)}
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          title="Editar"
                        >
                          <FiEdit2 />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="mb-1"
                          onClick={() => handleDelete(transaction.id)}
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          title="Excluir"
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "500" }}>
                        <strong>{transaction.description}</strong>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <Badge
                          bg={transaction.type === "income" ? "success" : "danger"}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                          }}
                        >
                          {transaction.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
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
                      <td className="text-end" style={{ padding: "1rem" }}>
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
                      <td style={{ padding: "1rem" }}>
                        <Badge
                          bg="primary"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                          }}
                        >
                          {getRecurrenceLabel(transaction)}
                        </Badge>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        Dia {transaction.day_of_month}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {new Date(transaction.start_date).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {inactiveTransactions.length > 0 && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Transações Inativas</h5>
          </Card.Header>
          <Card.Body className="p-0">
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
                      Ações
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
                      Tipo
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
                      Valor
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      Recorrência
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveTransactions.map((transaction) => (
                    <tr key={transaction.id} className="text-muted">
                      <td className="text-center" style={{ padding: "1rem" }}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2 mb-1"
                          onClick={() => handleEdit(transaction)}
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          title="Editar"
                        >
                          <FiEdit2 />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="mb-1"
                          onClick={() => handleDelete(transaction.id)}
                          style={{ borderRadius: "8px", padding: "6px 12px" }}
                          title="Excluir"
                        >
                          <FiTrash2 />
                        </Button>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: "500" }}>
                        <strong>{transaction.description}</strong>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <Badge
                          bg={transaction.type === "income" ? "success" : "danger"}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                          }}
                        >
                          {transaction.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
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
                      <td className="text-end" style={{ padding: "1rem" }}>
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
                      <td style={{ padding: "1rem" }}>
                        <Badge
                          bg="primary"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontWeight: "500",
                            fontSize: "0.85rem",
                          }}
                        >
                          {getRecurrenceLabel(transaction)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      <RecurringTransactionForm
        show={showForm}
        onHide={handleCloseForm}
        transaction={editingTransaction}
      />
    </Container>
  );
}
