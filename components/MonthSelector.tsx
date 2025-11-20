"use client";

import { useState, useMemo, useCallback } from "react";
import { Button, Modal, Form, Badge } from "react-bootstrap";
import {
  FiCalendar,
  FiPlus,
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";
import { formatMonth, calculateNextMonth } from "@/utils/formatDate";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface BaseButtonOwnProps {
  backgroundColor: string;
  textColor?: string;
}

interface BaseButtonProps extends BaseButtonOwnProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  primary: "#667eea",
  secondary: "#1a202c", // botão de cancelar / secundário
  success: "#11998e",
} as const;

const ANIMATION_CONFIG = {
  transition: "all 0.2s ease-in-out",
  hoverTransform: "translateY(-2px)",
  hoverShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
} as const;

// ============================================================================
// UTILS
// ============================================================================

// ============================================================================
// BUTTONS BASE
// ============================================================================

interface BaseButtonVisualProps {
  backgroundColor: string;
  textColor?: string;
  borderColor?: string;
  hoverBackgroundColor?: string;
  hoverBorderColor?: string;
  shadowOnHover?: boolean;
}

interface BaseButtonProps extends BaseButtonVisualProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const BaseButton = ({
  onClick,
  disabled = false,
  children,
  icon,
  className = "",
  ariaLabel,
  backgroundColor,
  textColor = "#ffffff",
  borderColor = "transparent",
  hoverBackgroundColor,
  hoverBorderColor,
  shadowOnHover = true,
}: BaseButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const bg =
    isHovered && !disabled && hoverBackgroundColor
      ? hoverBackgroundColor
      : backgroundColor;

  const border =
    isHovered && !disabled && hoverBorderColor ? hoverBorderColor : borderColor;

  return (
    <Button
      // NÃO usar variant visual
      variant="none"
      onClick={onClick}
      disabled={disabled}
      className={`d-flex align-items-center ${className}`}
      aria-label={ariaLabel}
      style={{
        backgroundColor: bg,
        color: textColor,
        border: `1px solid ${border}`,
        padding: "10px 20px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        transition: ANIMATION_CONFIG.transition,
        opacity: disabled ? 0.6 : 1,
        transform:
          isHovered && !disabled
            ? ANIMATION_CONFIG.hoverTransform
            : "translateY(0)",
        boxShadow:
          isHovered && !disabled && shadowOnHover
            ? ANIMATION_CONFIG.hoverShadow
            : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: 999,
        backgroundImage: "none", // garante que nenhum gradient do Bootstrap entre
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon && <span className="me-2 d-flex align-items-center">{icon}</span>}
      {children}
    </Button>
  );
};

// BOTÃO ROXO (CRIAR MÊS / NOVO MÊS)
export const PrimaryButton = (
  props: Omit<BaseButtonProps, keyof BaseButtonVisualProps>
) => (
  <BaseButton
    {...props}
    backgroundColor={COLORS.primary}
    textColor="#ffffff"
    borderColor="transparent"
    hoverBackgroundColor="#7f8cf0"
    hoverBorderColor="transparent"
    shadowOnHover
  />
);

// BOTÃO CANCELAR – TRANSPARENTE (GHOST)
export const SecondaryButton = (
  props: Omit<BaseButtonProps, keyof BaseButtonVisualProps>
) => (
  <BaseButton
    {...props}
    backgroundColor="transparent"
    textColor="var(--foreground)"
    borderColor="rgba(255, 255, 255, 0.08)"
    hoverBackgroundColor="rgba(255, 255, 255, 0.04)"
    hoverBorderColor="rgba(255, 255, 255, 0.16)"
    shadowOnHover={false}
  />
);

// BOTÃO VERDE (SE VOCÊ QUISER USAR EM OUTRO LUGAR)
export const SuccessButton = (
  props: Omit<BaseButtonProps, keyof BaseButtonVisualProps>
) => (
  <BaseButton
    {...props}
    backgroundColor={COLORS.success}
    textColor="#ffffff"
    borderColor="transparent"
    hoverBackgroundColor="#15b8a3"
    hoverBorderColor="transparent"
    shadowOnHover
  />
);

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

interface NavigationButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}

const NavigationButton = ({
  direction,
  onClick,
  disabled,
}: NavigationButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = direction === "prev" ? FiChevronLeft : FiChevronRight;
  const label = direction === "prev" ? "Mês anterior" : "Próximo mês";

  return (
    <Button
      variant="light"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: "1px solid var(--border-color)",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
        transition: ANIMATION_CONFIG.transition,
        backgroundColor: isHovered && !disabled ? "#f8f9fa" : "white",
        transform: isHovered && !disabled ? "scale(1.05)" : "scale(1)",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: 999,
      }}
    >
      <Icon size={18} />
    </Button>
  );
};

interface MonthBadgeProps {
  currentMonth: string;
  onClick?: () => void;
}

const MonthBadge = ({ currentMonth, onClick }: MonthBadgeProps) => {
  const isClickable = !!onClick;

  return (
    <button
      type="button"
      onClick={onClick}
      className="d-flex align-items-center justify-content-center gap-2"
      role="button"
      aria-live="polite"
      aria-label={`Selecionar mês: ${formatMonth(currentMonth, "long")}`}
      style={{
        cursor: isClickable ? "pointer" : "default",
        padding: "10px 20px",
        fontSize: "1rem",
        fontWeight: "bold",
        backgroundColor: COLORS.primary,
        color: "#ffffff",
        minWidth: "160px",
        border: "none",
        borderRadius: 999,
        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.35)",
        transition: ANIMATION_CONFIG.transition,
      }}
      onMouseEnter={(e) => {
        if (!isClickable) return;
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 4px 12px rgba(102, 126, 234, 0.55)";
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        if (!isClickable) return;
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 2px 8px rgba(102, 126, 234, 0.35)";
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(0)";
      }}
    >
      <FiCalendar size={16} aria-hidden="true" />
      <span>{formatMonth(currentMonth)}</span>
    </button>
  );
};

interface ValidationMessageProps {
  isValid: boolean;
  isDuplicate: boolean;
  monthValue: string;
}

const ValidationMessage = ({
  isValid,
  isDuplicate,
  monthValue,
}: ValidationMessageProps) => {
  if (!monthValue) return null;

  if (isDuplicate) {
    return (
      <Form.Text
        className="d-flex align-items-center gap-2 mt-2"
        style={{ color: "#dc3545", fontWeight: 500 }}
        role="alert"
      >
        <FiAlertCircle size={16} />
        Este mês já existe! Escolha outro mês.
      </Form.Text>
    );
  }

  if (isValid) {
    return (
      <Form.Text
        className="d-flex align-items-center gap-2 mt-2"
        style={{ color: "#38ef7d", fontWeight: 500 }}
        role="status"
      >
        <FiCheckCircle size={16} />
        {formatMonth(monthValue, "long")} disponível para criação
      </Form.Text>
    );
  }

  return null;
};

interface CopyPreviousOptionProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CopyPreviousOption = ({ checked, onChange }: CopyPreviousOptionProps) => (
  <div
    className="p-3"
    style={{
      background: "rgba(17, 153, 142, 0.1)",
      border: "2px solid rgba(17, 153, 142, 0.3)",
      borderRadius: 8,
      transition: ANIMATION_CONFIG.transition,
    }}
  >
    <Form.Group className="mb-0">
      <Form.Check
        type="checkbox"
        id="copyPrevious"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        label={
          <div className="d-flex align-items-center gap-2">
            <FiCopy size={18} aria-hidden="true" />
            <span
              className="fw-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Copiar transações do mês anterior
            </span>
          </div>
        }
        style={{ fontSize: "1rem", color: "var(--foreground)" }}
      />
      <Form.Text
        className="ms-4 d-block mt-2"
        style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
      >
        <FiInfo size={14} className="me-1" />
        As transações recorrentes serão duplicadas com as datas atualizadas.
        Ideal para contas fixas mensais como aluguel, internet, etc.
      </Form.Text>
    </Form.Group>
  </div>
);

interface MonthStatsProps {
  totalMonths: number;
}

const MonthStats = ({ totalMonths }: MonthStatsProps) => {
  if (totalMonths === 0) return null;

  return (
    <div
      className="mt-3 p-2 d-flex align-items-center gap-2"
      style={{
        fontSize: "0.85rem",
        color: "var(--text-muted)",
        backgroundColor: "rgba(102, 126, 234, 0.05)",
        borderRadius: 6,
      }}
      role="status"
    >
      <FiInfo size={14} />
      <span>
        Você tem {totalMonths} {totalMonths === 1 ? "mês" : "meses"} cadastrado
        {totalMonths === 1 ? "" : "s"}
      </span>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MonthSelector() {
  const { currentMonth, setCurrentMonth, createNewMonth, getAvailableMonths } =
    useFinanceStore();

  const [showModal, setShowModal] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState("");
  const [copyPrevious, setCopyPrevious] = useState(false);

  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const availableMonths = useMemo(
    () => getAvailableMonths(),
    [getAvailableMonths]
  );

  const isMonthDuplicate = useMemo(
    () => !!newMonthValue && availableMonths.includes(newMonthValue),
    [newMonthValue, availableMonths]
  );

  const suggestedNextMonth = useMemo(() => {
    if (availableMonths.length === 0) return null;
    return calculateNextMonth(availableMonths[0]);
  }, [availableMonths]);

  const currentIndex = useMemo(
    () => availableMonths.indexOf(currentMonth),
    [availableMonths, currentMonth]
  );

  const canGoNext = currentIndex > 0;
  const canGoPrev = currentIndex < availableMonths.length - 1;

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
    if (suggestedNextMonth && !availableMonths.includes(suggestedNextMonth)) {
      setNewMonthValue(suggestedNextMonth);
    }
  }, [suggestedNextMonth, availableMonths]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setNewMonthValue("");
    setCopyPrevious(false);
  }, []);

  const handleCreateMonth = useCallback(() => {
    if (!newMonthValue || isMonthDuplicate) return;

    createNewMonth(newMonthValue, copyPrevious);
    setCurrentMonth(newMonthValue);
    handleCloseModal();
  }, [
    newMonthValue,
    isMonthDuplicate,
    copyPrevious,
    createNewMonth,
    setCurrentMonth,
    handleCloseModal,
  ]);

  const goToNextMonth = useCallback(() => {
    if (canGoNext) {
      setCurrentMonth(availableMonths[currentIndex - 1]);
    }
  }, [canGoNext, currentIndex, availableMonths, setCurrentMonth]);

  const goToPrevMonth = useCallback(() => {
    if (canGoPrev) {
      setCurrentMonth(availableMonths[currentIndex + 1]);
    }
  }, [canGoPrev, currentIndex, availableMonths, setCurrentMonth]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isMonthDuplicate && newMonthValue) {
        handleCreateMonth();
      }
    },
    [isMonthDuplicate, newMonthValue, handleCreateMonth]
  );

  return (
    <>
      {/* Barra de navegação de meses */}
      <nav
        className="d-flex align-items-center justify-content-end mb-3 p-3 gap-3"
        aria-label="Navegação de meses"
      >
        <div className="d-flex align-items-center gap-2">
          <NavigationButton
            direction="prev"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
          />

          <MonthBadge
            currentMonth={currentMonth}
            onClick={() => setShowMonthPicker(true)} // << NOVO
          />

          <NavigationButton
            direction="next"
            onClick={goToNextMonth}
            disabled={!canGoNext}
          />
        </div>

        {/* Botão Novo Mês com o MESMO background roxo do badge */}
        <PrimaryButton
          onClick={handleOpenModal}
          icon={<FiPlus size={16} />}
          ariaLabel="Criar novo mês"
        >
          Novo Mês
        </PrimaryButton>
      </nav>

      {/* Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        data-bs-theme="dark"
        aria-labelledby="modal-title"
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <Modal.Title id="modal-title" className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center me-2"
              style={{
                width: 40,
                height: 40,
                backgroundColor: COLORS.primary,
                borderRadius: 12,
              }}
              aria-hidden="true"
            >
              <FiCalendar className="text-white" size={20} />
            </div>
            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
              Criar Novo Mês
            </span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          className="p-4"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
          }}
        >
          {/* Label com o mesmo “peso visual” do botão */}
          <Form.Group className="mb-4">
            <Form.Label
              htmlFor="month-input"
              className="mb-2"
              style={{
                color: "var(--foreground)",
                fontWeight: 600,
                fontSize: "0.95rem",
                letterSpacing: 0.2,
                textTransform: "uppercase",
              }}
            >
              Selecione o Mês
            </Form.Label>

            <Form.Control
              id="month-input"
              type="month"
              value={newMonthValue}
              onChange={(e) => setNewMonthValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                border: isMonthDuplicate
                  ? "2px solid #dc3545"
                  : "2px solid var(--border-color)",
                padding: "12px",
                backgroundColor: "var(--input-bg)",
                color: "var(--foreground)",
                fontSize: "1rem",
                borderRadius: 8,
                transition: ANIMATION_CONFIG.transition,
              }}
              isInvalid={isMonthDuplicate}
              autoFocus
              aria-describedby="month-validation"
            />

            <div id="month-validation">
              <ValidationMessage
                isValid={!!newMonthValue && !isMonthDuplicate}
                isDuplicate={!!isMonthDuplicate}
                monthValue={newMonthValue}
              />
            </div>
          </Form.Group>

          <CopyPreviousOption
            checked={copyPrevious}
            onChange={setCopyPrevious}
          />
          <MonthStats totalMonths={availableMonths.length} />
        </Modal.Body>

        <Modal.Footer
          style={{
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--card-bg)",
            gap: 12,
          }}
        >
          {/* Botão cancelar reutilizável com cor #1a202c */}
          <SecondaryButton
            onClick={handleCloseModal}
            ariaLabel="Cancelar criação de mês"
          >
            Cancelar
          </SecondaryButton>

          {/* Botão criar reutilizável estilo primário */}
          <PrimaryButton
            onClick={handleCreateMonth}
            disabled={!newMonthValue || !!isMonthDuplicate}
            icon={<FiPlus size={18} />}
            ariaLabel="Confirmar criação de mês"
          >
            Criar Mês
          </PrimaryButton>
        </Modal.Footer>
      </Modal>

      {/* Modal Seletor de Meses */}
      <Modal
        show={showMonthPicker}
        onHide={() => setShowMonthPicker(false)}
        centered
        data-bs-theme="dark"
        aria-labelledby="month-picker-title"
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <Modal.Title
            id="month-picker-title"
            className="d-flex align-items-center gap-2"
          >
            <FiCalendar size={20} />
            <span style={{ fontWeight: 600 }}>Selecionar Mês</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          className="p-3"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
          }}
        >
          {availableMonths.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>
              Nenhum mês cadastrado ainda.
            </p>
          ) : (
            <div
              className="d-flex flex-wrap gap-2"
              aria-label="Lista de meses disponíveis"
            >
              {availableMonths.map((month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(month);
                    setShowMonthPicker(false);
                  }}
                  className="px-3 py-2"
                  style={{
                    borderRadius: 999,
                    border:
                      month === currentMonth
                        ? "2px solid #ffffff"
                        : "1px solid var(--border-color)",
                    backgroundColor:
                      month === currentMonth
                        ? COLORS.primary
                        : "var(--input-bg)",
                    color:
                      month === currentMonth ? "#ffffff" : "var(--foreground)",
                    fontWeight: month === currentMonth ? 700 : 500,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    transition: ANIMATION_CONFIG.transition,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-1px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 3px 8px rgba(0, 0, 0, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "none";
                  }}
                  aria-label={`Ir para ${formatMonth(month, "long")}`}
                >
                  {formatMonth(month)}
                </button>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
