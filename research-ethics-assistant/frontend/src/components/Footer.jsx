import { Microscope, Github, Shield } from 'lucide-react'

export default function Footer({ onOpenKnowledgeBase }) {
  return (
    <footer className="px-4 py-8 mt-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <Microscope size={13} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Research Ethics Guidance Assistant</div>
                <div className="text-xs text-slate-600">Citation-first · Evidence-grounded · Human-in-the-loop</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-600">
              <button
                onClick={onOpenKnowledgeBase}
                className="hover:text-cyan-400 transition-colors"
              >
                Knowledge Base Registry
              </button>
              <span className="hidden md:inline">·</span>
              <div className="flex items-center gap-1.5">
                <Shield size={11} className="text-green-500/60" />
                <span>Answers grounded in provided guidelines</span>
              </div>
              <span className="hidden md:inline">·</span>
              <span className="text-cyan-400/70">Provided Research Ethics Guidelines · 8 Active Documents</span>
            </div>

            <div className="text-xs text-slate-700">
              Built for Research Ethics Hackathon · 2026
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
