// Button.jsx — Reusable button component
function Button({ children, variant = 'primary', className = '', disabled = false, type = 'button', onClick }) {
  const base = variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-ghost';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${className} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
}

export default Button;
