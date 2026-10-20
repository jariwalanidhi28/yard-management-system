import React from 'react';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  options = [],
  rows = 3,
  disabled = false,
  helperText,
}) => {
  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={name} className="form-label small fw-semibold text-secondary">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`form-select ${error ? 'is-invalid' : ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`form-control ${error ? 'is-invalid' : ''}`}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`form-control ${error ? 'is-invalid' : ''}`}
        />
      )}

      {error ? (
        <div className="invalid-feedback d-block">{error}</div>
      ) : helperText ? (
        <div className="form-text text-muted small">{helperText}</div>
      ) : null}
    </div>
  );
};

export default FormField;
