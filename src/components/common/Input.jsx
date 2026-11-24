import React from 'react';

/**
 * Strict Tri-Color Input Component
 */
const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div style={{ marginBottom: '1rem', width: '100%' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '0.4rem',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'var(--color-black)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label} {required && '*'}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`pr3-input ${className}`}
        {...props}
      />
      {error && (
        <p
          style={{
            marginTop: '0.3rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-black)',
            borderLeft: '2px solid var(--color-black)',
            paddingLeft: '0.4rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;

