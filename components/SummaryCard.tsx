import { Card, Row, Col } from "react-bootstrap";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  colProps?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  iconColor?: string;
  valueColor?: string;
  cardStyle?: React.CSSProperties;
}

export const SummaryCard = ({
  icon,
  title,
  value,
  subtitle,
  colProps = { xs: 12, md: 4 },
  iconColor = "text-muted",
  valueColor = "text-muted",
  cardStyle = { borderRadius: "12px" }
}: SummaryCardProps) => {
  return (
    <Col {...colProps}>
      <Card
        className="text-center shadow-sm h-100"
        style={cardStyle}
      >
        <Card.Body>
          <div className="d-flex align-items-center justify-content-center mb-2">
            <div className={iconColor}>
              {icon}
            </div>
            <h6 className="text-muted mb-0">{title}</h6>
          </div>
          <h3 className={valueColor}>
            {value}
          </h3>
          <small className="text-muted">
            {subtitle}
          </small>
        </Card.Body>
      </Card>
    </Col>
  );
};