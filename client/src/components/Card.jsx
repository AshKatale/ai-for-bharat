// Card.jsx — Thin wrapper around glass-card utility
function Card({ title, children, className = '' }) {
  return (
    <div className={`glass-card p-5 ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>}
      {children}
    </div>
  );
}

export default Card;
