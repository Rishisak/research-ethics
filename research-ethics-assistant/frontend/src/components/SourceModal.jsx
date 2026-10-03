import { X, FileText, Shield, BookOpen, Quote } from 'lucide-react'
import { useEffect } from 'react'

export default function SourceModal({ source, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl animate-slide-up rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10, 15, 35, 0.95)',
          border: '1px solid rgba(34,211,238,0.2)',
          backdropFilter: 'blur(32px)',
          boxShadow: '0 0 60px rgba(34,211,238,0.08), 0 32px 64px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
              <FileText size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-cyan-400/70 uppercase">Source Evidence</div>
              <div className="text-sm font-bold text-white">Citation Details</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Document info grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Document" value={source.document} />
            <InfoField label="Organization" value={source.organization || 'Verified Ethics Guideline'} />
            <InfoField
              label="Section"
              value={source.section && source.section !== 'N/A' ? `§ ${source.section}` : 'General'}
            />
            <InfoField label="Page" value={source.page ? `Page ${source.page}` : 'N/A'} />
            {source.category && (
              <InfoField label="Category" value={source.category} />
            )}
          </div>

          {/* Excerpt */}
          {source.excerpt && (
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Quote size={13} className="text-cyan-400/60" />
                <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Relevant Excerpt</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "{source.excerpt}"
              </p>
            </div>
          )}

          {/* Trust badge */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <Shield size={14} className="text-green-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-green-400">Retrieved from Provided Research Ethics Guidelines</div>
              <div className="text-xs text-slate-500 mt-0.5">
                This excerpt was retrieved via semantic similarity search from the 8 indexed research ethics guideline documents.
              </div>
            </div>
          </div>

          {/* Guidelines label */}
          <div className="text-xs text-cyan-400/70 text-center">
            Research Ethics Guidelines Knowledge Base · 8 Provided Documents (250 Pages)
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="btn-primary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-lg px-3.5 py-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-xs text-slate-600 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-200">{value}</div>
    </div>
  )
}
