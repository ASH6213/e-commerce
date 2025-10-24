import { ChangeEvent } from "react";

type Props = {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
  helpText?: string;
};

const FormInput: React.FC<Props> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  options,
  rows,
  min,
  max,
  step,
  disabled = false,
  helpText,
}) => {
  const baseInputClasses =
    "w-full px-4 py-2 border border-gray300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent disabled:bg-gray100 disabled:cursor-not-allowed";

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray500 mb-2">
        {label} {required && <span className="text-red">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          rows={rows || 4}
          disabled={disabled}
          className={baseInputClasses}
          placeholder={placeholder}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={baseInputClasses}
          placeholder={placeholder}
        />
      )}

      {helpText && <p className="text-xs text-gray400 mt-1">{helpText}</p>}
    </div>
  );
};

export default FormInput;
