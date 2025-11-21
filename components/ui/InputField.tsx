import { Form } from "react-bootstrap";
import { FormField } from "./FormField";

interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
}

export function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "mb-3",
  style,
  labelStyle,
}: InputFieldProps) {
  return (
    <FormField label={label} className={className} labelStyle={labelStyle}>
      <Form.Control
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={style}
      />
    </FormField>
  );
}
