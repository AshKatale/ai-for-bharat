function Card({ title, children, className = '' }) {
  return (
    <div className={`glass rounded-2xl p-5 shadow-xl shadow-black/20 ${className}`}>
      {title ? <h3 className="mb-4 text-base font-semibold text-slate-100">{title}</h3> : null}
      {children}
    </div>
  );
}

export default Card;
