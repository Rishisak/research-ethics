import { useState } from 'react'
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import SourceModal from './SourceModal'

export default function SourceCard({ source, index }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <div className="source-card p-3.5 animate-slide-up" style={{ animationDelay: `${index * 0.08}s` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <FileText size={13} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{source.document}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {source.section && source.section !== 'N/A' && (
                  <span className="text-xs text-slate-500">§ {source.section}</span>
                )}
                {source.page && (
                  <span className="text-xs text-slate-600">p. {source.page}</span>
                )}
                {source.organization && (
                  <span className="text-xs text-slate-600 truncate">{source.organization}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded text-slate-600 hover:text-slate-400 transition-colors"
              title="Preview excerpt"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-cyan-400 transition-all"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,211,238,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,211,238,0.08)'}
            >
              <ExternalLink size={11} />
              View
            </button>
          </div>
        </div>

        {/* Expandable excerpt */}
        {expanded && source.excerpt && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 italic">
              "{source.excerpt.slice(0, 280)}{source.excerpt.length > 280 ? '...' : ''}"
            </p>
          </div>
        )}
      </div>

      {modalOpen && (
        <SourceModal source={source} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
