import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sendChatMessage } from '../lib/api'
import { Mic, MicOff, Send, MessageCircle, Volume2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }

const LANG_CODES: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' }
const LANG_LABELS: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
]

let msgCounter = 0
const uid = () => `msg-${++msgCounter}`

export default function Chatbot() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const scanId = (location.state as { scanId?: string })?.scanId
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: 'Hello! I am KisanAI, your intelligent farming assistant. Ask me about crop diseases, treatments, farming practices, weather advisories, or market information. You can type or use voice input.',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [language, setLanguage] = useState(i18n.language.startsWith('hi') ? 'hi' : i18n.language.startsWith('te') ? 'te' : 'en')
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg: Message = { id: uid(), role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await sendChatMessage(msg, language, conversationId, scanId)
      if (data.conversation_id) setConversationId(data.conversation_id)

      const assistantMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])

      // TTS
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(data.response)
        utter.lang = LANG_CODES[language] || 'en-IN'
        utter.rate = 0.9
        window.speechSynthesis.speak(utter)
      }
    } catch {
      toast.error('Failed to get response. Check that backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser. Use Chrome.')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = LANG_CODES[language] || 'en-IN'
    recognition.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      setInput(e.results[0][0].transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const speakLast = () => {
    const last = [...messages].reverse().find(m => m.role === 'assistant')
    if (!last || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(last.content)
    utter.lang = LANG_CODES[language] || 'en-IN'
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 flex flex-col h-[calc(100vh-7rem)]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('chatbot.title')}</h1>
        <p className="text-gray-500 mt-0.5 text-sm">{t('chatbot.subtitle')}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {LANG_LABELS.map(l => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                language === l.code ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {scanId && (
          <span className="bg-primary-100 text-primary-700 px-3 py-1.5 rounded-xl text-xs font-medium">
            Context: Scan #{scanId.slice(0, 8)}
          </span>
        )}
        <button
          onClick={speakLast}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
        >
          <Volume2 size={14} /> Read Aloud
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <MessageCircle size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-700 text-white rounded-br-sm'
                : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center mr-2 mt-0.5">
              <MessageCircle size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex gap-2 shadow-sm">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder={t('chatbot.placeholder')}
          className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
          disabled={loading}
        />
        <button
          onClick={listening ? stopListening : startListening}
          className={`p-2 rounded-xl transition-colors ${listening ? 'bg-red-500 text-white' : 'hover:bg-gray-100 text-gray-500'}`}
          title={listening ? 'Stop listening' : 'Voice input'}
        >
          {listening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="btn-primary py-2 px-4 flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} /> {t('chatbot.send')}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">{t('chatbot.disclaimer')}</p>
    </div>
  )
}
