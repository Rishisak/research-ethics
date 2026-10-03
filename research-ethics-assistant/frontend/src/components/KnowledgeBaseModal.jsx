import { useState, useEffect } from 'react'
import { X, BookOpen, Shield, FileCheck, Users, Award, ExternalLink, Search, CheckCircle2, Database } from 'lucide-react'

const CATEGORY_ICONS = {
  'Informed Consent': FileCheck,
  'Data Handling & Privacy': Shield,
  'Authorship': Users,
  'Publication Ethics': BookOpen,
  'Research Integrity': Award,
}

export default function KnowledgeBaseModal({ onClose }) {
  const [sourcesData, setSourcesData] = useState({ sources: [], total_chunks: 112, total_sources: 5 })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:8000/sources')
      .then(res => res.json())
      .then(data => {
        setSourcesData(data)
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const filteredSources = (sourcesData.sources || []).filter(src => {
    const srcCats = Array.isArray(src.categories) ? src.categories : [src.category || '']
    const matchesCat = selectedCategory === 'All' || srcCats.includes(selectedCategory) || src.category === selectedCategory
    const searchLower = search.toLowerCase()
    const matchesSearch = !search ||
      (src.document || '').toLowerCase().includes(searchLower) ||
      srcCats.join(' ').toLowerCase().includes(searchLower) ||
      (src.organization || '').toLowerCase().includes(searchLower) ||
      (src.filename || '').toLowerCase().includes(searchLower)
    return matchesCat && matchesSearch
  })

  const categories = ['All', 'Informed Consent', 'Data Handling & Privacy', 'Authorship', 'Publication Ethics', 'Research Integrity']

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden animate-slide-up flex flex-col"
        style={{
          background: 'rgba(10, 15, 35, 0.96)',
          border: '1px solid rgba(34,211,238,0.25)',
          backdropFilter: 'blur(36px)',
          boxShadow: '0 0 60px rgba(34,211,238,0.1), 0 32px 64px rgba(0,0,0,0.6)',
          maxHeight: '88vh',
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <Database size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Knowledge Base Registry</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                  {sourcesData.total_chunks || 789} Chunks Indexed · 250 Pages
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Provided Research Ethics Guidelines</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-6 border-b border-white/5 space-y-4 bg-slate-900/20">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search registered policies, categories, or institutions..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs text-slate-200 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* Categories Pill Selector */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Source List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading knowledge base sources...</div>
          ) : filteredSources.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No policy documents match your criteria.</div>
          ) : (
            filteredSources.map((source, idx) => {
              const IconComp = CATEGORY_ICONS[source.category] || BookOpen
              return (
                <div
                  key={idx}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                        <IconComp size={15} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{source.document}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {source.publication_year ? `${source.publication_year}` : (source.total_pages ? `${source.total_pages} Pages` : 'PDF')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {source.organization && <span>Organization: <span className="text-slate-300 font-medium">{source.organization}</span> · </span>}
                          Pages: <span className="text-cyan-400 font-medium">{source.total_pages || 'N/A'}</span>
                        </p>
                        {source.description && (
                          <p className="text-xs text-slate-400/90 mt-1.5 leading-relaxed">{source.description}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1.5 font-mono">{source.filename}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1 text-[11px] text-green-400 font-medium">
                        <CheckCircle2 size={12} />
                        <span>Active</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Vector Indexed</span>
                    </div>
                  </div>

                  {source.note && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-amber-400/80">⚠ {source.note}</span>
                      <span className="text-slate-500">Embedding: all-MiniLM-L6-v2</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-900/40 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            All answers cite these verified documents. Semantic search uses cosine similarity.
          </div>
          <button onClick={onClose} className="btn-primary text-xs px-4 py-2">
            Close Registry
          </button>
        </div>
      </div>
    </div>
  )
}
