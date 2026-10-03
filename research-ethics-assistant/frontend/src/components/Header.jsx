import { Microscope, BookOpen, CheckSquare, MessageSquare } from 'lucide-react'

export default function Header({ systemStatus, onOpenKnowledgeBase, onOpenChecklist }) {
  const isOnline = systemStatus?.status === 'online'
  const ragReady = systemStatus?.rag_ready

  return (
    <header className="sticky top-0 z-40 px-4 py-4">
      <nav className="max-w-7xl mx-auto glass flex items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(129,140,248,0.25))', border: '1px solid rgba(34,211,238,0.3)' }}>
            <Microscope size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase leading-none">Research Ethics</div>
            <div className="text-sm font-bold text-white leading-tight tracking-tight">Guidance Assistant</div>
          </div>
        </div>

        {/* Nav items */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={onOpenKnowledgeBase}
            className="text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <BookOpen size={13} className="text-cyan-400" />
            Knowledge Base
          </button>

          <button
            onClick={onOpenChecklist}
            className="text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <CheckSquare size={13} className="text-cyan-400" />
            Ethics Checklists
          </button>

          <a
            href="#chat"
            className="text-xs font-medium text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <MessageSquare size={13} className="text-cyan-400" />
            Ask Question
          </a>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: isOnline
                ? 'rgba(34, 197, 94, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${isOnline ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: isOnline ? '#4ade80' : '#f87171',
            }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block"
              style={{
                background: isOnline ? '#4ade80' : '#f87171',
                boxShadow: isOnline ? '0 0 6px #4ade80' : '0 0 6px #f87171',
                animation: 'pulse 2s infinite',
              }} />
            {isOnline
              ? ragReady
                ? `Online · ${systemStatus.knowledge_base_docs} chunks`
                : 'Online · KB not indexed'
              : 'System Offline'}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onOpenKnowledgeBase}
            className="p-1.5 rounded text-slate-300 hover:text-white"
            title="Knowledge Base"
          >
            <BookOpen size={16} />
          </button>
          <span className="w-2 h-2 rounded-full"
            style={{ background: isOnline ? '#4ade80' : '#f87171', boxShadow: isOnline ? '0 0 6px #4ade80' : '0 0 6px #f87171' }} />
        </div>
      </nav>
    </header>
  )
}
