import { Form } from "react-bootstrap";
import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
  labelStyle?: React.CSSProperties;
}

export function FormField({ label, children, className = "mb-3", labelStyle }: FormFieldProps) {
  return (
    <Form.Group className={className}>
      <Form.Label style={labelStyle}>{label}</Form.Label>
      {children}
    </Form.Group>
  );
}
