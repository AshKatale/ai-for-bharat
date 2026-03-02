// Loader.jsx — Centered spinner / skeleton loader
function Loader({ size = 'md', text = '' }) {
  const sz = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className={`${sz} rounded-full border-2 border-brand/20 border-t-brand animate-spin`} />
      {text && <p className="text-sm text-slate-500 animate-pulse">{text}</p>}
    </div>
  );
}

export default Loader;
