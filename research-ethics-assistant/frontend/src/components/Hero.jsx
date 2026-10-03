import { ArrowDown, Sparkles, CheckSquare } from 'lucide-react'

// CSS-based abstract visual: rings + orb + nodes
function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center w-full h-80 md:h-96 select-none" aria-hidden="true">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.4) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Outer ring */}
      <div className="absolute w-72 h-72 rounded-full"
        style={{
          border: '1px solid rgba(34,211,238,0.12)',
          animation: 'spin 25s linear infinite',
        }}>
        {/* Node on ring */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
          style={{ background: 'rgba(34,211,238,0.6)', boxShadow: '0 0 8px rgba(34,211,238,0.8)' }} />
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: 'rgba(129,140,248,0.5)', boxShadow: '0 0 6px rgba(129,140,248,0.7)' }} />
      </div>

      {/* Middle ring */}
      <div className="absolute w-52 h-52 rounded-full"
        style={{
          border: '1px solid rgba(129,140,248,0.15)',
          animation: 'spin 18s linear infinite reverse',
        }}>
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{ background: 'rgba(167,139,250,0.7)', boxShadow: '0 0 8px rgba(167,139,250,0.8)' }} />
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: 'rgba(34,211,238,0.4)' }} />
      </div>

      {/* Inner ring */}
      <div className="absolute w-36 h-36 rounded-full"
        style={{ border: '1px dashed rgba(34,211,238,0.1)', animation: 'spin 12s linear infinite' }} />

      {/* Central orb */}
      <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(34,211,238,0.25), rgba(129,140,248,0.15), rgba(15,23,42,0.8))',
          border: '1px solid rgba(34,211,238,0.3)',
          boxShadow: '0 0 30px rgba(34,211,238,0.2), inset 0 0 20px rgba(34,211,238,0.05)',
          backdropFilter: 'blur(12px)',
        }}>
        <div className="w-8 h-8 rounded-full"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.6), rgba(129,140,248,0.5))', boxShadow: '0 0 16px rgba(34,211,238,0.4)' }} />
      </div>

      {/* Floating document nodes */}
      {[
        { label: 'Consent', x: '-60%', y: '-70%', color: 'cyan' },
        { label: 'Privacy', x: '55%', y: '-65%', color: 'violet' },
        { label: 'Ethics', x: '-65%', y: '55%', color: 'indigo' },
        { label: 'Review', x: '50%', y: '60%', color: 'cyan' },
      ].map((node, i) => (
        <div key={i}
          className="absolute text-xs font-medium px-2.5 py-1.5 rounded-lg"
          style={{
            left: `calc(50% + ${node.x})`,
            top: `calc(50% + ${node.y})`,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid rgba(${node.color === 'cyan' ? '34,211,238' : node.color === 'violet' ? '139,92,246' : '99,102,241'},0.2)`,
            color: node.color === 'cyan' ? 'rgba(34,211,238,0.8)' : node.color === 'violet' ? 'rgba(167,139,250,0.8)' : 'rgba(129,140,248,0.8)',
            backdropFilter: 'blur(8px)',
            animation: `float ${4 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
            whiteSpace: 'nowrap',
          }}>
          {node.label}
        </div>
      ))}

      {/* Connecting lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" style={{ overflow: 'visible' }}>
        <line x1="50%" y1="50%" x2="25%" y2="20%" stroke="rgba(34,211,238,0.5)" strokeWidth="0.5" strokeDasharray="3,4" />
        <line x1="50%" y1="50%" x2="75%" y2="22%" stroke="rgba(129,140,248,0.5)" strokeWidth="0.5" strokeDasharray="3,4" />
        <line x1="50%" y1="50%" x2="22%" y2="75%" stroke="rgba(99,102,241,0.5)" strokeWidth="0.5" strokeDasharray="3,4" />
        <line x1="50%" y1="50%" x2="76%" y2="76%" stroke="rgba(34,211,238,0.5)" strokeWidth="0.5" strokeDasharray="3,4" />
      </svg>
    </div>
  )
}

export default function Hero({ onStartChat, onOpenChecklist }) {
  return (
    <section className="relative px-4 pt-8 pb-16 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <div className="animate-fade-in">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(34,211,238,0.06)',
              border: '1px solid rgba(34,211,238,0.18)',
            }}>
            <span className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
            <span className="text-xs font-semibold tracking-widest text-slate-300 uppercase">AI Guidance System</span>
          </div>

          <div className="text-xs font-medium text-cyan-400/70 tracking-widest uppercase mb-3">
            Evidence-grounded · Human-in-the-loop
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Research guidance,{' '}
            <span className="text-gradient">grounded in evidence.</span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-lg">
            Find trusted research ethics guidance from approved sources — with transparent citations
            and human escalation when decisions require expert review.
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={onStartChat} className="btn-send flex items-center gap-2">
              <Sparkles size={15} />
              Ask a Question
            </button>
            <button
              onClick={onOpenChecklist}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center gap-2 shadow-sm shadow-cyan-500/10"
            >
              <CheckSquare size={14} />
              Ethics Checklists
            </button>
            <a href="#categories" className="btn-primary flex items-center gap-2">
              Browse Categories
              <ArrowDown size={14} />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-4 mt-8">
            {['Citation-first', 'Evidence-grounded', 'Human-in-the-loop', 'Source-verified'].map(tag => (
              <div key={tag} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Visual */}
        <div className="animate-fade-in hidden md:block" style={{ animationDelay: '0.2s' }}>
          <HeroVisual />
        </div>
      </div>

      {/* Knowledge base label */}
      <div className="mt-12 flex justify-center">
        <div className="px-4 py-2.5 rounded-full text-xs font-medium text-cyan-400/90 flex items-center gap-2"
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Research Ethics Guidelines Knowledge Base · 8 Provided Documents (250 Pages)
        </div>
      </div>
    </section>
  )
}
