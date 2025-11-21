import { Form } from "react-bootstrap";
import { FormField } from "./FormField";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  className = "mb-3",
  style,
  labelStyle,
}: SelectFieldProps) {
  return (
    <FormField label={label} className={className} labelStyle={labelStyle}>
      <Form.Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={style}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
    </FormField>
  );
}
