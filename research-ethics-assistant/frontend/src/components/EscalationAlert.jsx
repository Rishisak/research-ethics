import { useState } from 'react'
import { AlertTriangle, Users, FileSignature, ChevronRight } from 'lucide-react'
import SourceCard from './SourceCard'
import ConsultationLetterModal from './ConsultationLetterModal'

export default function EscalationAlert({ reason, sources = [], question = '', guidance = '' }) {
  const [showLetterModal, setShowLetterModal] = useState(false)

  return (
    <>
      <div className="escalation-card p-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-1">Human Review Required</div>
            <h3 className="text-base font-semibold text-white leading-tight">
              This question involves a case-specific ethics decision
            </h3>
          </div>
        </div>

        {/* Explanation */}
        <div className="pl-[52px] space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            The assistant can explain general principles from the approved knowledge base,
            but it <span className="text-amber-300 font-medium">cannot determine</span> whether
            your specific study should be approved or whether you may proceed.
          </p>

          {/* Recommended action box */}
          <div className="rounded-xl p-4 mt-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} className="text-amber-400" />
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">Recommended Action</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Consult your{' '}
              <span className="text-amber-300 font-semibold">Research Ethics Committee</span>,{' '}
              <span className="text-amber-300 font-semibold">Institutional Review Board (IRB)</span>, or{' '}
              <span className="text-amber-300 font-semibold">Independent Ethics Committee (IEC)</span>{' '}
              for a formal review of your specific situation.
            </p>

            <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-amber-400/90 font-medium">Need to submit a query to your IRB?</span>
              <button
                onClick={() => setShowLetterModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all shadow-sm shadow-amber-500/10"
              >
                <FileSignature size={13} />
                Draft Ethics Consultation Letter
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Sources if any */}
          {sources && sources.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase mb-2">
                Relevant General Guidance Sources
              </div>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <SourceCard key={i} source={source} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLetterModal && (
        <ConsultationLetterModal
          question={question}
          guidance={guidance}
          reason={reason}
          sources={sources}
          onClose={() => setShowLetterModal(false)}
        />
      )}
    </>
  )
}
