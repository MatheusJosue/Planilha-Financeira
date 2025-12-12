import { Card, Button, Row, Col } from "react-bootstrap";
import { ReactNode } from "react";

interface GradientCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: string;
  buttonGradient?: string;
  onClick: () => void;
  colProps?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  iconBgGradient?: string;
}

export const GradientCard = ({
  icon,
  title,
  description,
  buttonText,
  buttonVariant = "primary",
  buttonGradient,
  onClick,
  colProps = { xs: 12, lg: 6 },
  iconBgGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
}: GradientCardProps) => {
  return (
    <Col {...colProps}>
      <Card
        className="border-0 shadow-card h-100"
        style={{ overflow: "hidden" }}
      >
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "12px",
                background: iconBgGradient,
              }}
            >
              {icon}
            </div>
            <div>
              <h5 className="mb-0 fw-bold">{title}</h5>
            </div>
          </div>
          <Card.Text className="text-muted mb-3">
            {description}
          </Card.Text>
          <Button
            onClick={onClick}
            className="w-100 shadow d-flex align-items-center justify-content-center gap-2"
            style={{
              background: buttonGradient || buttonVariant,
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              fontWeight: "600",
            }}
          >
            {buttonText}
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
};