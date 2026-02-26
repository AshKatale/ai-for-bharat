function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center gap-3 py-8 text-slate-300">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      <span>{label}</span>
    </div>
  );
}

export default Loader;
