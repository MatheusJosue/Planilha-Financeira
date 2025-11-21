import { Form } from "react-bootstrap";
import { FormField } from "./FormField";

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

export function DateInput({
  label,
  value,
  onChange,
  required = false,
  className = "mb-3",
  style,
  labelStyle,
}: DateInputProps) {
  return (
    <FormField label={label} className={className} labelStyle={labelStyle}>
      <Form.Control
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={style}
      />
    </FormField>
  );
}
