function EmptyState({ title = 'No Data', description = 'Nothing to display yet.' }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center">
      <h4 className="text-base font-semibold text-slate-100">{title}</h4>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export default EmptyState;
