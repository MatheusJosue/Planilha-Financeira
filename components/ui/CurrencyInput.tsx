import { Form, InputGroup } from "react-bootstrap";
import { FormField } from "./FormField";

interface CurrencyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  id?: string;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = "Ex: 45,00 ou 45.00",
  required = false,
  className = "mb-3",
  style,
  labelStyle,
  id,
}: CurrencyInputProps) {
  return (
    <FormField label={label} className={className} labelStyle={labelStyle}>
      <InputGroup>
        <InputGroup.Text style={style}>
          R$
        </InputGroup.Text>
        <Form.Control
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={style}
        />
      </InputGroup>
    </FormField>
  );
}
