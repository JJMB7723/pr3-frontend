import React from 'react';

/**
 * Modern Button Component with Oxblood Red & Apricot Glow Palette
 * Variants:
 *  - 'coral' / 'oxblood': High-impact Primary Action CTA (#4A0F14)
 *  - 'apricot' / 'gold': Warm Apricot Glow Action (#F6B27A)
 *  - 'primary': Sleek Dark Black / Deep Oxblood Action
 *  - 'secondary': Clean White Outline
 *  - 'sage': Production & Manufacturing Action (#5A7855)
 */
const Button = ({
  children,
  type = 'button',
  variant = 'coral',
  onClick,
  disabled = false,
  className = '',
  style = {},
  ...props
}) => {
  let variantClass = 'pr3-btn-coral';
  if (variant === 'primary' || variant === 'oxblood') variantClass = 'pr3-btn-oxblood';
  if (variant === 'apricot' || variant === 'gold') variantClass = 'pr3-btn-apricot';
  if (variant === 'secondary') variantClass = 'pr3-btn-secondary';
  if (variant === 'sage') variantClass = 'pr3-btn-sage';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`pr3-btn ${variantClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
