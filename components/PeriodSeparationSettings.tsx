import { Card, Row, Col, Form, Button, Badge } from "react-bootstrap";
import { FiCalendar } from "react-icons/fi";
import { useUserSettings } from "@/components/UserSettingsProvider";
import { showSuccess, showError } from "@/lib/sweetalert";

export const PeriodSeparationSettings = () => {
  const {
    periodSeparationEnabled,
    period1End,
    period2Start,
    dashboardCards,
    setPeriodSeparationEnabled,
    setPeriod1End,
    setPeriod2Start,
    setDashboardCards,
    saveUserSettings
  } = useUserSettings();

  return (
    <Card className="border-0 shadow-card">
      <Card.Body className="p-3 p-md-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <FiCalendar size={24} className="text-white" />
          </div>
          <div>
            <h5 className="mb-0 fw-bold">Períodos de Pagamento</h5>
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex align-items-center gap-2">
            <input
              type="checkbox"
              id="periodSeparationToggle"
              checked={periodSeparationEnabled}
              onChange={(e) =>
                setPeriodSeparationEnabled(e.target.checked)
              }
              className="form-check-input"
              style={{
                width: "20px",
                height: "20px",
                cursor: "pointer",
                borderColor: "#667eea",
              }}
            />
            <label
              htmlFor="periodSeparationToggle"
              className="mb-0 fw-semibold d-flex align-items-center gap-2"
              style={{ cursor: "pointer" }}
            >
              📅 Separar contas em 2 períodos de pagamento
              {periodSeparationEnabled && (
                <Badge
                  bg="success"
                  style={{ fontSize: "0.7rem", fontWeight: "normal" }}
                >
                  Ativado ✓
                </Badge>
              )}
            </label>
          </div>
          <small className="text-muted ms-4 ps-2 d-block mt-1">
            {periodSeparationEnabled
              ? "Organize suas transações em dois períodos mensais diferentes (ex: dia 10 e dia 20)"
              : "Ative para organizar suas contas em dois períodos mensais diferentes"}
          </small>
        </div>

        {periodSeparationEnabled && (
          <div
            className="p-3 mt-3"
            style={{
              background: "rgba(102, 126, 234, 0.05)",
              borderRadius: "12px",
              border: "2px solid rgba(102, 126, 234, 0.2)",
            }}
          >
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted mb-2">
                    1º Período: até dia
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="31"
                    value={period1End}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= 31) {
                        setPeriod1End(val);
                        if (val < 31) {
                          setPeriod2Start(val + 1);
                        }
                      }
                    }}
                    className="text-center fw-bold"
                    style={{
                      borderRadius: "10px",
                      border: "2px solid #667eea",
                      padding: "12px",
                      fontSize: "1.1rem",
                    }}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted mb-2">
                    2º Período: a partir do dia
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="31"
                    value={period2Start}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= 31 && val > period1End) {
                        setPeriod2Start(val);
                      }
                    }}
                    className="text-center fw-bold"
                    style={{
                      borderRadius: "10px",
                      border: "2px solid #667eea",
                      padding: "12px",
                      fontSize: "1.1rem",
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Opção para exibir cards por período */}
            <div
              className="mt-3 p-3"
              style={{
                background: "rgba(79, 172, 254, 0.05)",
                borderRadius: "10px",
                border: "2px solid rgba(79, 172, 254, 0.2)",
              }}
            >
              <Form.Check
                type="checkbox"
                id="dashboard-periods"
                label="📅 Exibir finanças separadamente no dashboard"
                checked={dashboardCards.periodCards}
                onChange={(e) =>
                  setDashboardCards({
                    ...dashboardCards,
                    periodCards: e.target.checked,
                  })
                }
                className="fw-semibold"
              />
              <small className="text-muted ms-4 d-block mt-1">
                Exibe cards com informações financeiras separadas por período de pagamento
              </small>
            </div>

            <div className="text-center mt-3">
              <Button
                onClick={saveUserSettings}
                className="shadow"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  fontWeight: "600",
                }}
              >
                💾 Salvar Configurações
              </Button>
            </div>
            <small className="text-muted d-block mt-3 text-center">
              💡 Exemplo: Se você recebe no dia 10 e no dia 20, configure
              o 1º período até dia 10 e o 2º período a partir do dia 11
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};