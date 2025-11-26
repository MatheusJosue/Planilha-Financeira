"use client";

import { useState, ReactNode } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";

interface ChartWrapperProps {
  children: ReactNode;
  title: string;
  configKey: string;
  onRemove: (key: string) => void;
}

export function ChartWrapper({ children, title, configKey, onRemove }: ChartWrapperProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemove = () => {
    setShowConfirm(true);
  };

  const confirmRemove = () => {
    onRemove(configKey);
    setShowConfirm(false);
  };

  const cancelRemove = () => {
    setShowConfirm(false);
  };

  return (
    <Card className="border-0 shadow-card h-100 position-relative">
      <div className="position-absolute top-0 end-0 p-2 d-flex gap-1 z-2">
        <Button
          variant="outline-danger"
          size="sm"
          onClick={handleRemove}
          className="border-0 shadow-none d-flex align-items-center justify-content-center"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(220, 53, 69, 0.1)",
            color: "#dc3545",
          }}
          aria-label={`Remover ${title}`}
        >
          <FiTrash2 size={14} />
        </Button>
      </div>
      
      {children}
      
      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={cancelRemove} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Confirmar Remoção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Você tem certeza que deseja remover o gráfico <strong>{title}</strong> do dashboard?</p>
          <p className="text-muted">Esta ação pode ser desfeita nas configurações.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelRemove}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmRemove}>
            Remover
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}