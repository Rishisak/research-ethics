import AnswerCard from './AnswerCard'
import { AlertOctagon } from 'lucide-react'

export default function MessageBubble({ message }) {
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex flex-col items-end gap-1 max-w-[78%]">
          <div className="bubble-user">
            <p className="text-sm text-slate-100 leading-relaxed">{message.content}</p>
          </div>
          <div className="text-xs text-slate-700 pr-1">{time}</div>
        </div>
      </div>
    )
  }

  if (message.role === 'error') {
    return (
      <div className="flex items-start gap-3 animate-fade-in">
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertOctagon size={13} className="text-red-400" />
        </div>
        <div className="flex-1 px-4 py-3.5 rounded-2xl rounded-tl-sm"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="text-xs font-semibold text-red-400 mb-1">Connection Error</p>
          <p className="text-sm text-slate-400 whitespace-pre-line">{message.content}</p>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      {/* AI avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(129,140,248,0.2))',
          border: '1px solid rgba(34,211,238,0.25)',
          boxShadow: '0 0 8px rgba(34,211,238,0.15)',
        }}>
        <div className="w-2.5 h-2.5 rounded-full"
          style={{ background: 'linear-gradient(135deg, #22d3ee, #818cf8)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <AnswerCard message={message} />
        <div className="text-xs text-slate-700 mt-1 ml-1">{time}</div>
      </div>
    </div>
  )
}
