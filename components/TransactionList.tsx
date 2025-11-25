"use client";

import { useState } from "react";
import { Table, Button, Badge, Form, InputGroup } from "react-bootstrap";
import {
  FiEdit,
  FiTrash2,
  FiSearch,
  FiMenu,
  FiCopy,
  FiRepeat,
} from "react-icons/fi";
import { showConfirm } from "@/lib/sweetalert";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Transaction } from "@/types";
import { useFinanceStore } from "@/store/financeStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void;
  onDuplicate?: (transaction: Transaction) => void;
  onConfirmRecurring?: (transaction: Transaction) => void;
  showPredicted?: boolean;
  typeFilter?: "income" | "expense";
  periodFilter?: {
    startDay: number;
    endDay: number;
  };
}

interface SortableRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string, description: string) => void;
  onDuplicate?: (transaction: Transaction) => void;
  onConfirmRecurring?: (transaction: Transaction) => void;
}

function SortableRow({
  transaction,
  onEdit,
  onDelete,
  onDuplicate,
  onConfirmRecurring,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: transaction.id });

  const isPredicted = transaction.is_predicted;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isPredicted ? 0.7 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    borderBottom: "1px solid #e2e8f0",
    background: isPredicted ? "rgba(102, 126, 234, 0.05)" : "transparent",
  };

  return (
    <tr ref={setNodeRef} style={style}>
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
        <div className="d-flex align-items-center gap-2">
          {transaction.recurring_id && (
            <FiRepeat
              size={16}
              className={
                transaction.type === "income" ? "text-success" : "text-danger"
              }
              title="Transação Recorrente"
            />
          )}
          <span>{transaction.description}</span>
        </div>
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
      <td
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", padding: "1rem" }}
      >
        <div className="d-flex align-items-center gap-2">
          <FiMenu className="text-muted" />
          <span style={{ fontWeight: "500" }}>
            {formatDate(transaction.date)}
          </span>
          {isPredicted && (
            <Badge
              bg="primary"
              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
            >
              Previsto
            </Badge>
          )}
          {transaction.is_paid === true && (
            <Badge
              bg="success"
              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
            >
              ✓ Pago
            </Badge>
          )}
          {transaction.is_paid === false && (
            <Badge
              bg="danger"
              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
            >
              ✗ Não Pago
            </Badge>
          )}
        </div>
      </td>
      <td className="text-center" style={{ padding: "1rem" }}>
        {isPredicted && transaction.recurring_id ? (
          <>
            <Button
              variant="primary"
              size="sm"
              className="me-2"
              onClick={() => {
                onConfirmRecurring?.(transaction);
              }}
              style={{
                borderRadius: "8px",
                padding: "6px 16px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                fontWeight: "600",
              }}
              title="Confirmar conta recorrente com possibilidade de ajustar valor"
            >
              ✓ Confirmar
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onDelete(transaction.id, transaction.description)}
              style={{ borderRadius: "8px", padding: "6px 12px" }}
              title="Excluir transação prevista"
            >
              <FiTrash2 />
            </Button>
          </>
        ) : !isPredicted ? (
          <>
            <Button
              variant="outline-success"
              size="sm"
              className="me-2"
              onClick={() => onDuplicate?.(transaction)}
              style={{ borderRadius: "8px", padding: "6px 12px" }}
              title="Duplicar para próximo mês"
            >
              <FiCopy />
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              className="me-2"
              onClick={() => onEdit(transaction)}
              style={{ borderRadius: "8px", padding: "6px 12px" }}
            >
              <FiEdit />
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onDelete(transaction.id, transaction.description)}
              style={{ borderRadius: "8px", padding: "6px 12px" }}
            >
              <FiTrash2 />
            </Button>
          </>
        ) : null}
      </td>
    </tr>
  );
}

export function TransactionList({
  onEdit,
  onDuplicate,
  onConfirmRecurring,
  showPredicted = false,
  typeFilter,
  periodFilter,
}: TransactionListProps) {
  const { monthsData, currentMonth, deleteTransaction, categories } =
    useFinanceStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  // Pegar transações do mês atual
  const monthData = monthsData[currentMonth];
  const transactions = monthData?.transactions || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getUniqueMonths = () => {
    const months = transactions.map((t) => t.date.substring(0, 7));
    return Array.from(new Set(months)).sort().reverse();
  };

  const filteredTransactions = transactions.filter((t) => {
    const isPredicted = t.is_predicted === true;

    // Filter by predicted status
    if (showPredicted !== undefined) {
      if (showPredicted && !isPredicted) return false;
      if (!showPredicted && isPredicted) return false;
    }

    if (typeFilter && t.type !== typeFilter) return false;

    if (periodFilter) {
      const dayOfMonth = parseInt(t.date.split("-")[2], 10);
      if (periodFilter.endDay < periodFilter.startDay) {
        if (
          dayOfMonth < periodFilter.startDay &&
          dayOfMonth > periodFilter.endDay
        ) {
          return false;
        }
      } else {
        if (
          dayOfMonth < periodFilter.startDay ||
          dayOfMonth > periodFilter.endDay
        ) {
          return false;
        }
      }
    }

    const matchesSearch = t.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory =
      filterCategory === "all" || t.category === filterCategory;
    const matchesMonth =
      filterMonth === "all" || t.date.startsWith(filterMonth);

    return matchesSearch && matchesType && matchesCategory && matchesMonth;
  });

  // Sort transactions: one-time first (no recurring_id), then recurring (with recurring_id)
  // Within each group, sort by date (newest first)
  let sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Group by recurring status first
    const aIsRecurring = !!a.recurring_id;
    const bIsRecurring = !!b.recurring_id;

    if (aIsRecurring !== bIsRecurring) {
      return aIsRecurring ? 1 : -1; // One-time first
    }

    // Within same group, sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (localOrder.length > 0) {
    sortedTransactions = sortedTransactions.sort((a, b) => {
      const indexA = localOrder.indexOf(a.id);
      const indexB = localOrder.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedTransactions.findIndex((t) => t.id === active.id);
      const newIndex = sortedTransactions.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(sortedTransactions, oldIndex, newIndex);
      setLocalOrder(newOrder.map((t) => t.id));
    }
  };

  const handleDelete = async (id: string, description: string) => {
    const result = await showConfirm(
      `Deseja realmente excluir "${description}"?`,
      "Excluir transação?"
    );
    if (result.isConfirmed) {
      deleteTransaction(id);
    }
  };

  return (
    <div>
      {sortedTransactions.some((t) => t.is_predicted) && (
        <div
          className="mb-4 p-3"
          role="alert"
          style={{
            background: "rgba(13, 202, 240, 0.1)",
            border: "1px solid rgba(13, 202, 240, 0.3)",
            borderRadius: "12px",
            color: "var(--foreground)",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <FiMenu size={20} />
            <div>
              <strong>Transações Previstas:</strong> As transações com badge
              &quot;Previsto&quot; são geradas automaticamente. Use o botão{" "}
              <strong>&quot;✓ Confirmar&quot;</strong> para confirmar contas
              recorrentes e ajustar o valor se necessário.
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 row g-3">
        <div className="col-md-4">
          <InputGroup style={{ borderRadius: "10px", overflow: "hidden" }}>
            <InputGroup.Text
              style={{
                borderRight: "none",
              }}
            >
              <FiSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar transação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ borderLeft: "none" }}
            />
          </InputGroup>
        </div>

        <div className="col-md-2">
          <Form.Select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as "all" | "income" | "expense")
            }
            style={{
              borderRadius: "10px",
              padding: "0.5rem",
            }}
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </Form.Select>
        </div>

        <div className="col-md-3">
          <Form.Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              borderRadius: "10px",
              padding: "0.5rem",
            }}
          >
            <option value="all">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Form.Select>
        </div>

        <div className="col-md-3">
          <Form.Select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{
              borderRadius: "10px",
              padding: "0.5rem",
            }}
          >
            <option value="all">Todos os meses</option>
            {getUniqueMonths().map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
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
                  Tipo
                </th>
                <th
                  style={{
                    padding: "1rem",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <FiMenu /> <span>Data</span>
                  </div>
                </th>
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
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center text-muted py-5"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                      📊
                    </div>
                    <div style={{ fontWeight: "500" }}>
                      Nenhuma transação encontrada
                    </div>
                  </td>
                </tr>
              ) : (
                <SortableContext
                  items={sortedTransactions.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedTransactions.map((transaction) => (
                    <SortableRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={onEdit}
                      onDelete={handleDelete}
                      onDuplicate={onDuplicate}
                      onConfirmRecurring={onConfirmRecurring}
                    />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </Table>
        </div>
      </DndContext>

      {sortedTransactions.length > 0 && (
        <div
          className="text-center mt-3 p-2"
          style={{
            background:
              "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
            borderRadius: "10px",
            fontWeight: "500",
            fontSize: "0.9rem",
            color: "#667eea",
          }}
        >
          📋 Mostrando {sortedTransactions.length} de {transactions.length}{" "}
          transações
        </div>
      )}
    </div>
  );
}
