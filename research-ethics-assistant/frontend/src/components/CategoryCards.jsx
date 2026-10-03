import { FileCheck, Shield, Users, BookOpen, Award, ChevronRight } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'Informed Consent',
    icon: FileCheck,
    title: 'Informed Consent',
    description: 'Participant rights, consent processes, and documentation requirements',
    accent: 'rgba(34,211,238,',
    accentBorder: 'rgba(34,211,238,0.2)',
    accentGlow: 'rgba(34,211,238,0.08)',
  },
  {
    id: 'Data Handling & Privacy',
    icon: Shield,
    title: 'Data Handling & Privacy',
    description: 'Research data protection, anonymization, and storage standards',
    accent: 'rgba(99,102,241,',
    accentBorder: 'rgba(99,102,241,0.2)',
    accentGlow: 'rgba(99,102,241,0.08)',
  },
  {
    id: 'Authorship',
    icon: Users,
    title: 'Authorship',
    description: 'Authorship criteria, contribution standards, and attribution practices',
    accent: 'rgba(139,92,246,',
    accentBorder: 'rgba(139,92,246,0.2)',
    accentGlow: 'rgba(139,92,246,0.08)',
  },
  {
    id: 'Publication Ethics',
    icon: BookOpen,
    title: 'Publication Ethics',
    description: 'Publication standards, duplicate publication, and peer review conduct',
    accent: 'rgba(129,140,248,',
    accentBorder: 'rgba(129,140,248,0.2)',
    accentGlow: 'rgba(129,140,248,0.08)',
  },
  {
    id: 'Research Integrity',
    icon: Award,
    title: 'Research Integrity',
    description: 'Responsible conduct, misconduct definitions, and reporting procedures',
    accent: 'rgba(167,139,250,',
    accentBorder: 'rgba(167,139,250,0.2)',
    accentGlow: 'rgba(167,139,250,0.08)',
  },
]

export default function CategoryCards({ selectedCategory, onSelect }) {
  return (
    <div id="categories" className="animate-slide-up">
      <div className="mb-8">
        <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-2">Knowledge Base</div>
        <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
        <p className="text-slate-400 text-sm mt-1">Select a category to focus your question, or ask anything in the chat below.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isSelected ? null : cat.id)}
              className="text-left p-5 rounded-2xl transition-all duration-200 cursor-pointer group"
              style={{
                background: isSelected
                  ? `${cat.accent}0.1)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSelected ? cat.accentBorder : 'rgba(255,255,255,0.07)'}`,
                backdropFilter: 'blur(16px)',
                boxShadow: isSelected ? `0 0 24px ${cat.accentGlow}` : 'none',
                animationDelay: `${i * 0.07}s`,
                transform: 'translateY(0)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.background = `${cat.accent}0.07)`
                  e.currentTarget.style.borderColor = cat.accentBorder
                  e.currentTarget.style.boxShadow = `0 8px 32px ${cat.accentGlow}`
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `${cat.accent}0.12)`,
                  border: `1px solid ${cat.accentBorder}`,
                }}>
                <Icon size={18} style={{ color: `${cat.accent}0.9)` }} />
              </div>

              <div className="text-sm font-semibold text-white mb-1.5 leading-tight">{cat.title}</div>
              <div className="text-xs text-slate-500 leading-relaxed mb-3">{cat.description}</div>

              <div className="flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: `${cat.accent}0.8)` }}>
                {isSelected ? 'Clear filter' : 'Filter chat'}
                <ChevronRight size={11} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
