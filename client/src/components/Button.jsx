function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles =
    variant === 'outline'
      ? 'border border-slate-500 bg-transparent hover:border-accent-cyan hover:text-accent-cyan'
      : 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-glow hover:brightness-110';

  return (
    <button
      className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
