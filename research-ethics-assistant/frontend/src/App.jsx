import { useState, useRef, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import CategoryCards from './components/CategoryCards'
import ChatInterface from './components/ChatInterface'
import Footer from './components/Footer'
import KnowledgeBaseModal from './components/KnowledgeBaseModal'
import EthicsChecklistModal from './components/EthicsChecklistModal'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState({ status: 'checking', rag_ready: false, knowledge_base_docs: 0 })
  const [showKbModal, setShowKbModal] = useState(false)
  const [showChecklistModal, setShowChecklistModal] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`)
      if (res.ok) {
        const data = await res.json()
        setSystemStatus(data)
      }
    } catch {
      setSystemStatus({ status: 'offline', rag_ready: false, knowledge_base_docs: 0 })
    }
  }

  const scrollToChat = () => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
    scrollToChat()
  }

  const handleSendMessage = async (question, category) => {
    if (!question.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, category: category || selectedCategory }),
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        userQuestion: question,
        content: data.answer,
        confidence: data.confidence,
        escalation_required: data.escalation_required,
        escalation_reason: data.escalation_reason,
        question_type: data.question_type,
        sources: data.sources || [],
        category: data.category,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'error',
        content: `Unable to reach the guidance system. Please ensure the backend is running on port 8000.\n\nError: ${err.message}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([])
    setSelectedCategory(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        systemStatus={systemStatus}
        onOpenKnowledgeBase={() => setShowKbModal(true)}
        onOpenChecklist={() => setShowChecklistModal(true)}
      />

      <main className="flex-1">
        <Hero
          onStartChat={scrollToChat}
          onOpenChecklist={() => setShowChecklistModal(true)}
        />

        <section id="categories" className="px-4 py-12 max-w-7xl mx-auto">
          <CategoryCards
            selectedCategory={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </section>

        <section ref={chatRef} id="chat" className="px-4 pb-16 max-w-5xl mx-auto">
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            selectedCategory={selectedCategory}
            onSend={handleSendMessage}
            onCategoryChange={setSelectedCategory}
            onClear={handleClearChat}
            systemStatus={systemStatus}
            onOpenKnowledgeBase={() => setShowKbModal(true)}
          />
        </section>
      </main>

      <Footer onOpenKnowledgeBase={() => setShowKbModal(true)} />

      {/* Modals */}
      {showKbModal && (
        <KnowledgeBaseModal onClose={() => setShowKbModal(false)} />
      )}

      {showChecklistModal && (
        <EthicsChecklistModal onClose={() => setShowChecklistModal(false)} />
      )}
    </div>
  )
}
