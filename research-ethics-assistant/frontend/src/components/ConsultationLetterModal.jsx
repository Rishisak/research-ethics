import { useState, useEffect } from 'react'
import { X, FileText, Copy, Check, Download, Printer, Users, ShieldAlert, Sparkles } from 'lucide-react'

export default function ConsultationLetterModal({ question, guidance, reason, sources = [], onClose }) {
  const [copied, setCopied] = useState(false)
  const [committeeName, setCommitteeName] = useState('Institutional Review Board (IRB) / Research Ethics Committee')
  const [piName, setPiName] = useState('[Principal Investigator Name]')
  const [projectTitle, setProjectTitle] = useState('[Research Study Title / Protocol Name]')
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const sourcesCitationText = sources.length > 0
    ? sources.map(s => `- **${s.document}** (Section ${s.section || 'General'}, Page ${s.page || 'N/A'}, ${s.organization || 'Institution'})\n  *Relevant Policy:* "${(s.excerpt || '').slice(0, 150)}..."`).join('\n')
    : '- Institutional Research Ethics Guidelines & Standard Operating Procedures'

  const letterText = `MEMORANDUM / FORMAL CONSULTATION REQUEST

DATE: ${currentDate}
TO: ${committeeName}
FROM: ${piName}
SUBJECT: Formal Ethics Guidance & Review Request — ${projectTitle}

1. PURPOSE OF INQUIRY
This memorandum requests formal ethics consultation and determination regarding a specific protocol question identified during ethical planning for the study titled "${projectTitle}".

2. SPECIFIC RESEARCH QUESTION / DILEMMA
${question || 'Case-specific protocol question regarding research ethics compliance.'}

3. PRELIMINARY POLICY REVIEW & REFERENCED GUIDANCE
Based on preliminary screening against institutional research ethics guidance:
${guidance ? guidance.replace(/###\s+/g, '').replace(/\*\*/g, '').slice(0, 450) + '...' : 'General institutional research ethics principles apply.'}

Relevant Referenced Documentation:
${sourcesCitationText}

4. KEY DETERMINATIONS REQUESTED FROM ETHICS COMMITTEE
We respectfully request the Committee's formal guidance on the following points:
a) Does the proposed approach meet institutional and statutory ethical standards?
b) Is formal protocol amendment, expedited review, or full committee hearing required?
c) What additional participant safeguarding, consent modification, or data governance measures are mandated?

5. RESEARCHER ATTESTATION
The investigator team affirms that no participants will be enrolled or impacted under this specific variation until written review or clearance is issued by the Committee.

Respectfully submitted,

___________________________________
${piName}
Principal Investigator / Study Team
`

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    const blob = new Blob([letterText], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IRB_Consultation_Request_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ethics Committee Consultation Request</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #111; }
              pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
            </style>
          </head>
          <body>
            <pre>${letterText}</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden animate-slide-up flex flex-col"
        style={{
          background: 'rgba(10, 15, 35, 0.96)',
          border: '1px solid rgba(245,158,11,0.3)',
          backdropFilter: 'blur(36px)',
          boxShadow: '0 0 60px rgba(245,158,11,0.1), 0 32px 64px rgba(0,0,0,0.6)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Users size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
                Human-in-the-Loop Escalation
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Draft Ethics Committee Consultation Letter
              </h2>
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick custom fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Target Ethics Authority</label>
              <input
                type="text"
                value={committeeName}
                onChange={(e) => setCommitteeName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Study / Protocol Name</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>

          {/* Letter preview */}
          <div
            className="p-5 rounded-xl font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-amber-400/30"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '340px',
            }}
          >
            {letterText}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 p-3 rounded-lg border border-amber-500/15">
            <ShieldAlert size={14} className="flex-shrink-0" />
            <span>
              This letter follows standard institutional review submission formats. Always check with your local IRB office for any additional mandatory forms.
            </span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-900/40 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
            >
              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Letter'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <Download size={13} />
              Download .md
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
            >
              <Printer size={13} />
              Print / PDF
            </button>
          </div>
          <button onClick={onClose} className="btn-secondary text-xs px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
