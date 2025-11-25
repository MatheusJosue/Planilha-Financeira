"use client";

import { useState } from "react";
import { Modal, Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { FiCheck, FiX } from "react-icons/fi";
import { Transaction } from "@/types";
import { formatCurrency, parseCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface ConfirmRecurringModalProps {
  show: boolean;
  transaction: Transaction | null;
  onHide: () => void;
  onConfirm: (transaction: Transaction, newValue: number) => Promise<void>;
}

export function ConfirmRecurringModal({
  show,
  transaction,
  onHide,
  onConfirm,
}: ConfirmRecurringModalProps) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleShow = () => {
    if (transaction) {
      // Formatar apenas o número, sem símbolo de moeda
      setValue(transaction.value.toFixed(2).replace(".", ","));
    }
  };

  const handleConfirm = async () => {
    if (!transaction) return;

    const parsedValue = parseCurrency(value);
    if (parsedValue <= 0) return;

    setIsLoading(true);
    try {
      await onConfirm(transaction, parsedValue);
      onHide();
    } catch (error) {
      console.error("Error confirming transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      onShow={handleShow}
      centered
      style={{
        backdropFilter: "blur(5px)",
      }}
    >
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
        }}
      >
        <Modal.Title className="d-flex align-items-center gap-2">
          <FiCheck size={24} />
          Confirmar Conta Recorrente
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        {transaction && (
          <>
            <div className="mb-3">
              <p className="text-muted mb-2">
                <strong>Descrição:</strong>
              </p>
              <p className="mb-0 fs-5">{transaction.description}</p>
            </div>

            <div className="mb-3">
              <p className="text-muted mb-2">
                <strong>Categoria:</strong>
              </p>
              <p className="mb-0">{transaction.category}</p>
            </div>

            <div className="mb-3">
              <p className="text-muted mb-2">
                <strong>Data:</strong>
              </p>
              <p className="mb-0">{formatDate(transaction.date)}</p>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Valor da Transação
              </Form.Label>
              <InputGroup>
                <InputGroup.Text>R$</InputGroup.Text>
                <Form.Control
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0,00"
                  style={{
                    borderRadius: "0 12px 12px 0",
                    padding: "12px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                  }}
                  autoFocus
                />
              </InputGroup>
              <Form.Text className="text-muted">
                💡 Ajuste o valor se necessário. O valor original da recorrente
                não será alterado.
              </Form.Text>
            </Form.Group>

            <div
              className="p-3 rounded"
              style={{
                background: "rgba(102, 126, 234, 0.1)",
                border: "1px solid rgba(102, 126, 234, 0.3)",
              }}
            >
              <small className="text-muted d-block mb-1">
                ℹ️ <strong>Importante:</strong>
              </small>
              <small className="text-muted">
                Esta confirmação criará uma transação real para este mês com o
                valor ajustado. A conta recorrente continuará existindo com o
                valor original para os próximos meses.
              </small>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer style={{ border: "none", padding: "1rem 1.5rem" }}>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={isLoading}
          className="d-flex align-items-center gap-2"
          style={{
            borderRadius: "10px",
            padding: "10px 20px",
          }}
        >
          <FiX size={18} />
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          className="d-flex align-items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "10px",
            padding: "10px 20px",
          }}
        >
          {isLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              Confirmando...
            </>
          ) : (
            <>
              <FiCheck size={18} />
              Confirmar Transação
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
