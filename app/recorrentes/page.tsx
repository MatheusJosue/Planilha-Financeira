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
          <h2 className="mb-1">
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
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Recorrência</th>
                    <th>Dia Vencimento</th>
                    <th>Início</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.description}</strong>
                      </td>
                      <td>
                        <Badge
                          bg={
                            transaction.type === "income" ? "success" : "danger"
                          }
                        >
                          {transaction.type === "income"
                            ? "Receita"
                            : "Despesa"}
                        </Badge>
                      </td>
                      <td>{transaction.category}</td>
                      <td>
                        <strong
                          className={
                            transaction.type === "income"
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {formatCurrency(transaction.value)}
                        </strong>
                      </td>
                      <td>
                        <Badge bg="primary">
                          {getRecurrenceLabel(transaction)}
                        </Badge>
                      </td>
                      <td>Dia {transaction.day_of_month}</td>
                      <td>
                        {new Date(transaction.start_date).toLocaleDateString(
                          "pt-BR"
                        )}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(transaction)}
                        >
                          <FiEdit2 />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <FiTrash2 />
                        </Button>
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
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Recorrência</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inactiveTransactions.map((transaction) => (
                    <tr key={transaction.id} className="text-muted">
                      <td>{transaction.description}</td>
                      <td>
                        <Badge
                          bg={
                            transaction.type === "income" ? "success" : "danger"
                          }
                        >
                          {transaction.type === "income"
                            ? "Receita"
                            : "Despesa"}
                        </Badge>
                      </td>
                      <td>{transaction.category}</td>
                      <td>{formatCurrency(transaction.value)}</td>
                      <td>
                        <Badge bg="secondary">
                          {getRecurrenceLabel(transaction)}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(transaction)}
                        >
                          <FiEdit2 />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <FiTrash2 />
                        </Button>
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
