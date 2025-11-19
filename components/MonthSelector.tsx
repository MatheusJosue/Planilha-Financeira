"use client";

import { useState } from "react";
import { Button, Modal, Form, Badge } from "react-bootstrap";
import {
  FiCalendar,
  FiPlus,
  FiCopy,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useFinanceStore } from "@/store/financeStore";

export function MonthSelector() {
  const {
    currentMonth,
    setCurrentMonth,
    createNewMonth,
    getAvailableMonths,
    monthsData,
  } = useFinanceStore();
  const [showModal, setShowModal] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState("");
  const [copyPrevious, setCopyPrevious] = useState(false);

  const availableMonths = getAvailableMonths();

  console.log("📅 Current month:", currentMonth);
  console.log("📋 Available months:", availableMonths);
  console.log("🗂️ Months data keys:", Object.keys(monthsData || {}));

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return `${months[parseInt(monthNum) - 1]}/${year}`;
  };

  const handleCreateMonth = () => {
    if (newMonthValue) {
      if (availableMonths.includes(newMonthValue)) {
        alert("Este mês já foi criado!");
        return;
      }

      createNewMonth(newMonthValue, copyPrevious);
      setShowModal(false);
      setNewMonthValue("");
      setCopyPrevious(false);
    }
  };

  const currentIndex = availableMonths.indexOf(currentMonth);
  const canGoNext = currentIndex > 0;
  const canGoPrev = currentIndex < availableMonths.length - 1;

  const goToNextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(availableMonths[currentIndex - 1]);
    }
  };

  const goToPrevMonth = () => {
    if (canGoPrev) {
      setCurrentMonth(availableMonths[currentIndex + 1]);
    }
  };

  return (
    <>
      <div
        className="d-flex align-items-center justify-content-between mb-4 p-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
          borderRadius: "12px",
          border: "2px solid rgba(102, 126, 234, 0.2)",
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="light"
            size="sm"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            style={{
              borderRadius: "8px",
              border: "none",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiChevronLeft size={18} />
          </Button>

          <Badge
            pill
            className="d-flex align-items-center justify-content-center gap-2"
            style={{
              cursor: "default",
              padding: "10px 20px",
              fontSize: "1rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              minWidth: "140px",
            }}
          >
            <FiCalendar size={16} />
            <span>{formatMonth(currentMonth)}</span>
          </Badge>

          <Button
            variant="light"
            size="sm"
            onClick={goToNextMonth}
            disabled={!canGoNext}
            style={{
              borderRadius: "8px",
              border: "none",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiChevronRight size={18} />
          </Button>
        </div>

        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="d-flex align-items-center"
          style={{
            borderRadius: "10px",
            background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
            border: "none",
            padding: "8px 16px",
            fontWeight: "600",
            whiteSpace: "nowrap",
          }}
        >
          <FiPlus className="me-1" size={16} />
          Novo Mês
        </Button>
      </div>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        data-bs-theme="dark"
      >
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <div
              className="d-flex align-items-center justify-content-center me-2"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <FiCalendar className="text-white" size={20} />
            </div>
            <span style={{ color: "var(--foreground)" }}>Criar Novo Mês</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-4"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--foreground)",
          }}
        >
          <Form.Group className="mb-4">
            <Form.Label
              className="fw-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Selecione o Mês
            </Form.Label>
            <Form.Control
              type="month"
              value={newMonthValue}
              onChange={(e) => setNewMonthValue(e.target.value)}
              style={{
                borderRadius: "10px",
                border:
                  newMonthValue && availableMonths.includes(newMonthValue)
                    ? "2px solid #dc3545"
                    : "2px solid var(--border-color)",
                padding: "12px",
                backgroundColor: "var(--input-bg)",
                color: "var(--foreground)",
              }}
              isInvalid={
                !!(newMonthValue && availableMonths.includes(newMonthValue))
              }
            />
            {newMonthValue && availableMonths.includes(newMonthValue) && (
              <Form.Text
                className="d-block mt-2"
                style={{ color: "#dc3545", fontWeight: "500" }}
              >
                ⚠️ Este mês já foi criado!
              </Form.Text>
            )}
            {newMonthValue && !availableMonths.includes(newMonthValue) && (
              <Form.Text
                className="text-success d-block mt-2"
                style={{ fontWeight: "500" }}
              >
                ✓ Mês disponível para criação
              </Form.Text>
            )}
          </Form.Group>

          <div
            className="p-3"
            style={{
              background: "rgba(17, 153, 142, 0.1)",
              borderRadius: "10px",
              border: "2px solid rgba(17, 153, 142, 0.3)",
            }}
          >
            <Form.Group className="mb-0">
              <Form.Check
                type="checkbox"
                id="copyPrevious"
                label={
                  <div className="d-flex align-items-center gap-2">
                    <FiCopy size={18} />
                    <span
                      className="fw-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      Copiar transações do mês anterior
                    </span>
                  </div>
                }
                checked={copyPrevious}
                onChange={(e) => setCopyPrevious(e.target.checked)}
                style={{ fontSize: "1rem", color: "var(--foreground)" }}
              />
              <Form.Text
                className="ms-4 d-block mt-2"
                style={{ color: "var(--text-muted)" }}
              >
                💡 As transações serão duplicadas com as datas atualizadas para
                o novo mês. Útil para contas fixas mensais.
              </Form.Text>
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTop: "1px solid var(--border-color)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <Button
            variant="light"
            onClick={() => setShowModal(false)}
            style={{ borderRadius: "10px", padding: "10px 20px" }}
          >
            Cancelar
          </Button>
          <Button
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: "600",
            }}
            onClick={handleCreateMonth}
            disabled={!newMonthValue || availableMonths.includes(newMonthValue)}
          >
            <FiPlus className="me-2" size={18} />
            Criar Mês
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
