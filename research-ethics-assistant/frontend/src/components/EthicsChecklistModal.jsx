import { useState, useEffect } from 'react'
import { X, CheckSquare, Users, Shield, FileCheck, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'

export default function EthicsChecklistModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('irb')

  // IRB Checklist State
  const [irbAnswers, setIrbAnswers] = useState({
    humanSubjects: true,
    vulnerablePopulations: false,
    moreThanMinimalRisk: false,
    identifiablePrivateInfo: true,
    interventionsOrTreatments: false,
    secondaryDataOnly: false,
  })

  // Authorship Checklist State
  const [authorshipAnswers, setAuthorshipAnswers] = useState({
    contribution: true,
    drafting: true,
    approval: true,
    accountability: true,
  })

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // IRB calculation
  const getIrbRecommendation = () => {
    if (!irbAnswers.humanSubjects) {
      return {
        level: 'Not Human Subjects Research',
        color: 'text-slate-300',
        badge: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
        desc: 'If the study does not involve living human individuals or their identifiable data/biospecimens, formal IRB review is typically not required.',
      }
    }
    if (irbAnswers.vulnerablePopulations || irbAnswers.moreThanMinimalRisk || irbAnswers.interventionsOrTreatments) {
      return {
        level: 'Full Board Review Mandated',
        color: 'text-amber-400',
        badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        desc: 'Greater than minimal risk, vulnerable populations (e.g. minors, prisoners, decisionally impaired), or active interventions require convened Full IRB Committee review.',
      }
    }
    if (irbAnswers.secondaryDataOnly && !irbAnswers.identifiablePrivateInfo) {
      return {
        level: 'Exempt Review Likely',
        color: 'text-green-400',
        badge: 'bg-green-500/10 border-green-500/20 text-green-400',
        desc: 'De-identified secondary data or benign survey research commonly qualifies for Exempt status under 45 CFR 46.104.',
      }
    }
    return {
      level: 'Expedited Review Likely',
      color: 'text-cyan-400',
      badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      desc: 'Minimal risk research involving standard non-invasive data collection, surveys with identifiers, or blood draws within limits qualifies for Expedited review.',
    }
  }

  // Authorship calculation
  const allAuthorshipPassed = Object.values(authorshipAnswers).every(Boolean)

  const irbResult = getIrbRecommendation()

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
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <CheckSquare size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Interactive Ethics Tool</div>
              <h2 className="text-lg font-bold text-white tracking-tight">Self-Assessment Checklists</h2>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-slate-900/20 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('irb')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'irb'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck size={14} />
            IRB Review Level Finder
          </button>
          <button
            onClick={() => setActiveTab('authorship')}
            className={`pb-3 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'authorship'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            ICMJE Authorship Criteria
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'irb' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Determine whether your research protocol requires Full Board Review, Expedited Review, or qualifies for Exemption under standard institutional oversight.
              </p>

              <div className="space-y-2.5">
                {[
                  { key: 'humanSubjects', label: 'Does the study involve human participants or their identifiable data/biospecimens?' },
                  { key: 'moreThanMinimalRisk', label: 'Does the research involve greater than minimal risk (more risk than everyday life)?' },
                  { key: 'vulnerablePopulations', label: 'Are vulnerable populations included (e.g., minors, prisoners, pregnant individuals, cognitive impairment)?' },
                  { key: 'identifiablePrivateInfo', label: 'Will private, personally identifiable information be collected or accessed?' },
                  { key: 'interventionsOrTreatments', label: 'Does the protocol involve physical interventions, drugs, devices, or invasive procedures?' },
                  { key: 'secondaryDataOnly', label: 'Is the research limited entirely to secondary analysis of existing data sets?' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-xs text-slate-200 pr-4">{label}</span>
                    <input
                      type="checkbox"
                      checked={irbAnswers[key]}
                      onChange={(e) => setIrbAnswers(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400/50 bg-slate-800 border-slate-600"
                    />
                  </label>
                ))}
              </div>

              {/* Result Box */}
              <div
                className="mt-4 p-4 rounded-xl border"
                style={{
                  background: 'rgba(34,211,238,0.04)',
                  borderColor: 'rgba(34,211,238,0.15)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Assessment:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${irbResult.badge}`}>
                    {irbResult.level}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{irbResult.desc}</p>
                <div className="mt-2 text-[11px] text-slate-500">
                  *Preliminary guidance only. Formal classification must be confirmed with your institutional IRB coordinator.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'authorship' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                The International Committee of Medical Journal Editors (ICMJE) requires that all 4 criteria be satisfied for an individual to qualify as a co-author.
              </p>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'contribution',
                    title: '1. Substantial Contribution',
                    desc: 'Substantial contributions to conception and design, acquisition of data, or analysis and interpretation of data.',
                  },
                  {
                    key: 'drafting',
                    title: '2. Drafting & Intellectual Revision',
                    desc: 'Drafting the article or revising it critically for important intellectual content (not solely editorial proofreading).',
                  },
                  {
                    key: 'approval',
                    title: '3. Final Approval',
                    desc: 'Final approval of the version to be published.',
                  },
                  {
                    key: 'accountability',
                    title: '4. Agreement to Accountability',
                    desc: 'Agreement to be accountable for all aspects of the work in ensuring questions related to accuracy or integrity are investigated.',
                  },
                ].map(({ key, title, desc }) => (
                  <label
                    key={key}
                    className="flex items-start justify-between p-3.5 rounded-xl cursor-pointer transition-colors"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="pr-4">
                      <div className="text-xs font-semibold text-white">{title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={authorshipAnswers[key]}
                      onChange={(e) => setAuthorshipAnswers(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400/50 bg-slate-800 border-slate-600 mt-1"
                    />
                  </label>
                ))}
              </div>

              {/* Authorship Verdict */}
              <div
                className="mt-4 p-4 rounded-xl border"
                style={{
                  background: allAuthorshipPassed ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)',
                  borderColor: allAuthorshipPassed ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {allAuthorshipPassed ? (
                    <CheckCircle2 size={16} className="text-green-400" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-400" />
                  )}
                  <span className={`text-xs font-bold ${allAuthorshipPassed ? 'text-green-400' : 'text-amber-400'}`}>
                    {allAuthorshipPassed
                      ? 'QUALIFIES FOR CO-AUTHORSHIP'
                      : 'LIST IN ACKNOWLEDGEMENTS SECTION ONLY'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {allAuthorshipPassed
                    ? 'All 4 ICMJE conditions are satisfied. The individual meets international publication ethics standards for co-authorship.'
                    : 'Individuals who do not meet all four criteria (e.g., funding acquisition, data collection alone, or general supervision) should be recognized in the Acknowledgements section to prevent gift or ghost authorship.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-900/40 flex justify-end">
          <button onClick={onClose} className="btn-primary text-xs px-4 py-2">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
