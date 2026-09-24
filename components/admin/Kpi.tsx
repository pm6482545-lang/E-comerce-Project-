export default function Kpi({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-600' : 'text-stone-900'
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <p className="text-sm text-stone-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  )
}
