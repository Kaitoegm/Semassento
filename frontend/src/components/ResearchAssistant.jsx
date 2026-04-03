import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSciStat } from '../SciStatContext'
import { useAuth } from '../AuthContext'

const PAGE_NAMES = {
  '/': 'Dashboard',
  '/clinical-trials': 'Ensaios Clínicos',
  '/survival-analysis': 'Análise de Sobrevivência',
  '/meta-analysis': 'Metanálise',
  '/visualizations': 'Visualizações',
  '/power-calculator': 'Cálculo de Poder',
  '/archive': 'Arquivo Histórico',
  '/profile': 'Perfil',
  '/settings': 'Ajustes',
}

export default function ResearchAssistant({ isOpen, setIsOpen }) {
  const { trials, history, notifications } = useSciStat()
  const { session } = useAuth()
  const location = useLocation()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Sou o SciStat AI, seu assistente de bioestatística. Posso ajudar com testes estatísticos, interpretação de resultados, sugestões de análise e muito mais. Como posso ajudar?',
      needsUpload: false
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const chatRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  const currentPage = PAGE_NAMES[location.pathname] || location.pathname

  const buildContext = () => {
    const trialsSummary = trials.length > 0
      ? trials.slice(0, 5).map(t => `- "${t.title}" (Fase ${t.phase}, ${t.status}, ${t.n_actual}/${t.n_target} pacientes)`).join('\n')
      : 'Nenhum ensaio clínico cadastrado.'

    const historySummary = history.length > 0
      ? history.slice(0, 5).map(h => `- "${h.filename}" (Desfecho: ${h.outcome || 'N/A'}, ${new Date(h.created_at).toLocaleDateString('pt-BR')})`).join('\n')
      : 'Nenhuma análise realizada ainda.'

    return { trialsSummary, historySummary }
  }

  const sendMessage = async () => {
    if (!input.trim() && !attachedFile) return
    const userMsg = input.trim()
    const file = attachedFile
    setInput('')
    setAttachedFile(null)

    const userMessage = {
      role: 'user',
      content: userMsg || (file ? `📎 ${file.name}` : ''),
      fileName: file?.name || null
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const { trialsSummary, historySummary } = buildContext()
      const convHistory = messages.map(m => ({ role: m.role, content: m.content }))

      const formData = new FormData()
      formData.append('message', userMsg || `Analise o arquivo anexado: ${file?.name}`)
      formData.append('page', currentPage)
      formData.append('trials_summary', trialsSummary)
      formData.append('history_summary', historySummary)
      formData.append('conversation_history', JSON.stringify(convHistory.slice(-10)))
      if (file) {
        formData.append('file', file)
      }

      const API_URL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.sessionToken}` },
        body: formData
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Erro na resposta do assistente.')
      }

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'Não consegui processar sua pergunta.',
        needsUpload: data.needs_upload || false
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Erro: ${error.message}. Verifique se o servidor está rodando e tente novamente.`,
        needsUpload: false
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleFileAttach = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAttachedFile(file)
    }
    e.target.value = ''
  }

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, loading])

  const quickSuggestions = [
    'Qual teste usar para comparar 2 grupos?',
    'Interpretar valor p < 0.05',
    'Calcular tamanho amostral',
    'Sugerir análise para meu dataset',
  ]

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-background rounded-full shadow-[0_10px_30px_rgba(0,255,163,0.3)] flex items-center justify-center z-[90] hover:scale-110 active:scale-95 transition-all group"
          >
            <span className="material-symbols-rounded text-3xl font-black group-hover:rotate-12 transition-transform">smart_toy</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 w-[420px] h-[650px] z-[100] glass-card rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-primary/20 flex flex-col overflow-hidden"
          >
            <div className="bg-primary/10 px-8 py-5 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00FFA3]"></div>
                <div>
                  <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">SciStat AI</span>
                  <span className="text-[9px] text-slate-500 ml-2">{currentPage}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all group"
                  title="Anexar arquivo"
                >
                  <span className="material-symbols-rounded text-[18px] text-slate-400 group-hover:text-primary transition-colors">attach_file</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2">
                  <span className="material-symbols-rounded text-[20px]">close</span>
                </button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileAttach} className="hidden" />

            <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] rounded-[1.5rem] p-4 text-xs leading-relaxed font-medium ${
                    msg.role === 'user'
                      ? 'bg-primary text-background'
                      : 'bg-white/5 text-slate-300 border border-white/5'
                  }`}>
                    {msg.fileName && (
                      <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${msg.role === 'user' ? 'border-background/20' : 'border-white/10'}`}>
                        <span className="material-symbols-rounded text-[14px]">description</span>
                        <span className="text-[10px] font-bold truncate">{msg.fileName}</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.needsUpload && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`mt-3 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                          msg.role === 'user'
                            ? 'bg-background/20 text-background hover:bg-background/30'
                            : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
                        }`}
                      >
                        <span className="material-symbols-rounded text-[14px] mr-1 align-middle">upload_file</span>
                        Anexar Arquivo
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-[1.5rem] p-4 flex gap-1.5 items-center border border-white/5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}

              {messages.length <= 1 && !loading && (
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-1">Sugestões rápidas</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-left text-[11px] text-slate-400 hover:text-primary bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all border border-transparent hover:border-primary/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {attachedFile && (
              <div className="px-6 py-2 border-t border-white/5 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-[16px]">description</span>
                  <span className="text-[10px] font-bold text-white truncate max-w-[200px]">{attachedFile.name}</span>
                  <span className="text-[9px] text-slate-500">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-slate-500 hover:text-rose-400 transition-colors">
                  <span className="material-symbols-rounded text-[16px]">close</span>
                </button>
              </div>
            )}

            <div className="p-4 border-t border-white/5 bg-white/2">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="relative flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-slate-500 hover:text-primary hover:bg-white/5 rounded-xl transition-all shrink-0"
                  title="Anexar arquivo CSV/Excel"
                >
                  <span className="material-symbols-rounded text-[20px]">upload_file</span>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Perguntar sobre estatística..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 transition-all text-white placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !attachedFile)}
                  className="p-2.5 bg-primary text-background rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <span className="material-symbols-rounded text-[18px] font-black">send</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
