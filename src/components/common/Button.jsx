import Icon from './Icon';

/**
 * Reusable Button component with accessible focus states, variants, and icon support.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={`fw-btn fw-btn-${variant} fw-btn-${size} ${loading ? 'fw-btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="fw-spinner" aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && (
        <Icon name={icon} size={size === 'sm' ? 14 : 16} className="fw-btn-icon" />
      )}
      <span className="fw-btn-content">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <Icon name={icon} size={size === 'sm' ? 14 : 16} className="fw-btn-icon" />
      )}
    </button>
  );
}
