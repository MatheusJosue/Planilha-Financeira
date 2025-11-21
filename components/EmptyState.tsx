"use client";

import { Card, Button } from "react-bootstrap";
import { FiPlus } from "react-icons/fi";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = "📊",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-0 shadow-card">
      <Card.Body className="text-center py-5">
        <div
          className="mb-4 empty-state-icon"
        >
          {icon}
        </div>
        <h3 className="fw-bold mb-3 gradient-text">{title}</h3>
        <p className="text-muted mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button
            size="lg"
            onClick={onAction}
            className="d-flex align-items-center gap-2 mx-auto shadow month-selector-button month-selector-button-primary"
          >
            <FiPlus size={20} /> {actionLabel}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}
