export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      {/* AI avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(129,140,248,0.2))',
          border: '1px solid rgba(34,211,238,0.25)',
        }}>
        <div className="w-2.5 h-2.5 rounded-full"
          style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)' }} />
      </div>

      {/* Typing bubble */}
      <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
        <div className="flex items-center gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <div className="text-xs text-slate-600 mt-2">Searching knowledge base...</div>
      </div>
    </div>
  )
}
