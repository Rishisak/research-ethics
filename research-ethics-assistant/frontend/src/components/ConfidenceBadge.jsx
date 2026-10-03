export default function ConfidenceBadge({ confidence }) {
  const configs = {
    High: {
      dot: '#4ade80',
      text: 'text-green-400',
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.2)',
      glow: '0 0 8px rgba(34,197,94,0.3)',
      label: 'HIGH',
    },
    Medium: {
      dot: '#fbbf24',
      text: 'text-amber-400',
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      glow: '0 0 8px rgba(245,158,11,0.25)',
      label: 'MEDIUM',
    },
    Insufficient: {
      dot: '#f87171',
      text: 'text-red-400',
      bg: 'rgba(239,68,68,0.08)',
      border: 'rgba(239,68,68,0.2)',
      glow: '0 0 8px rgba(239,68,68,0.25)',
      label: 'INSUFFICIENT',
    },
  }

  const cfg = configs[confidence] || configs.Insufficient

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: cfg.glow }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: cfg.dot, boxShadow: `0 0 4px ${cfg.dot}` }} />
      <span className={`text-xs font-bold tracking-widest ${cfg.text}`}>
        {cfg.label}
      </span>
    </div>
  )
}
