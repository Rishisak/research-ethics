import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, BookOpen, X, Tag, Trash2, ChevronDown } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

const SUGGESTED_QUESTIONS = [
  'What is informed consent?',
  'What principles should researchers follow when handling participant data?',
  'When should someone qualify for authorship?',
  'What is duplicate publication?',
  'Can our study proceed if some participants did not provide the required consent?',
  'Should our Ethics Committee approve my research?',
]

export default function ChatInterface({
  messages,
  isLoading,
  selectedCategory,
  onSend,
  onCategoryChange,
  onClear,
  systemStatus,
  onOpenKnowledgeBase,
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const isOnline = systemStatus?.status === 'online'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    onSend(input.trim(), selectedCategory)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (question) => {
    onSend(question, selectedCategory)
  }

  const handleTextareaInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }

  return (
    <div id="chat" className="animate-slide-up">
      {/* Chat panel */}
      <div className="glass-strong overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(34,211,238,0.05), 0 32px 64px rgba(0,0,0,0.3)' }}>

        {/* Chat header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-green-400"
                style={{ boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s infinite' }} />
              <span className="text-sm font-bold text-white tracking-wide">RESEARCH ETHICS ASSISTANT</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 ml-[18px]">
              Answers are generated from the approved knowledge base
              {systemStatus?.knowledge_base_docs > 0 && ` · ${systemStatus.knowledge_base_docs} chunks indexed`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCategory && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
                <Tag size={10} className="text-cyan-400" />
                <span className="text-cyan-400 font-medium max-w-28 truncate">{selectedCategory}</span>
                <button onClick={() => onCategoryChange(null)} className="text-slate-600 hover:text-slate-400 ml-1">
                  <X size={10} />
                </button>
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={onClear}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                title="Clear chat"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="h-[520px] overflow-y-auto px-6 py-5 space-y-5 flex flex-col">
          {messages.length === 0 && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(34,211,238,0.06)',
                  border: '1px solid rgba(34,211,238,0.12)',
                }}>
                <div className="w-6 h-6 rounded-full"
                  style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.5), rgba(129,140,248,0.5))' }} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Ready to assist</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Ask any question about research ethics. The assistant will search the approved knowledge base and provide evidence-grounded guidance with source citations.
              </p>
              {!isOnline && (
                <div className="mt-4 px-4 py-2.5 rounded-xl text-xs text-red-400"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  ⚠ Backend offline — start the FastAPI server on port 8000
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(q)}
                disabled={isLoading}
                className="pill text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {q.length > 50 ? q.slice(0, 48) + '…' : q}
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2">
          <div className="rounded-2xl p-3.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
            {/* Category indicator */}
            {selectedCategory && (
              <div className="flex items-center gap-1.5 mb-2">
                <Tag size={10} className="text-cyan-400/60" />
                <span className="text-xs text-cyan-400/60">Filtering by: {selectedCategory}</span>
              </div>
            )}

            <div className="flex items-end gap-3">
              {/* Knowledge base registry viewer */}
              <button
                type="button"
                onClick={onOpenKnowledgeBase}
                className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0 mb-0.5"
                title="Browse approved knowledge base documents"
              >
                <BookOpen size={16} />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedCategory
                    ? `Ask about ${selectedCategory.toLowerCase()}...`
                    : 'Ask about consent, data handling, authorship, publication ethics...'
                }
                className="glass-input flex-1 text-sm leading-relaxed"
                style={{ minHeight: '36px', maxHeight: '140px', height: '36px' }}
                rows={1}
                disabled={isLoading}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="btn-send flex items-center gap-1.5 flex-shrink-0"
              >
                <Send size={13} />
                Send
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <span className="text-xs text-slate-700">Enter to send · Shift+Enter for new line</span>
              <span className="text-xs text-slate-700">{input.length} chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
