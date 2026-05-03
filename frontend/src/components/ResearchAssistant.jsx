import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSciStat } from '../SciStatContext'
import { useAuth } from '../AuthContext'

const PAGE_NAMES = {
  '/': 'Dashboard',
  '/clinical-trials': 'Ensaios Clínicos',
  '/survival-analysis': 'Análise de Sobrevivência',
  '/meta-analysis': 'Metanálise',
  '/visualizations': 'Visualizações',
  '/power-calculator': 'Cálculo de Poder',
  '/archive': 'Meus Projetos',
  '/profile': 'Perfil',
  '/settings': 'Ajustes',
}

const TEST_COLORS = {
  DESCRITIVA: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  CORRELAÇÃO: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300' },
  REGRESSÃO: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  COMPARAÇÃO: { bg: 'bg-teal-400/15', text: 'text-teal-300', border: 'border-teal-400/30', badge: 'bg-teal-400/20 text-teal-200' },
  PAREADO: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300' },
  NORMALIDADE: { bg: 'bg-stone-500/15', text: 'text-stone-400', border: 'border-stone-500/30', badge: 'bg-stone-500/20 text-stone-300' },
}

// ─── Action block icons ────────────────────────────────────────────────────────
const ACTION_ICONS = {
  navigate: 'open_in_new',
  open_analysis: 'analytics',
  export: 'download',
}

// ─── Action block parser ───────────────────────────────────────────────────────
/**
 * Extracts and removes <action>{...}</action> blocks from a response string.
 * Returns { text: string, action: object|null }
 */
function parseActionBlock(raw) {
  if (!raw) return { text: raw, action: null }
  const regex = /<action>([\s\S]*?)<\/action>/i
  const match = raw.match(regex)
  if (!match) return { text: raw, action: null }

  let action = null
  try {
    action = JSON.parse(match[1].trim())
  } catch {
    action = null
  }

  const text = raw.replace(regex, '').trim()
  return { text, action }
}

// ─── Markdown helpers ──────────────────────────────────────────────────────────
function parseColoredTags(text) {
  if (!text) return text
  const tagRegex = /\[\[(DESCRITIVA|CORRELAÇÃO|REGRESSÃO|COMPARAÇÃO|PAREADO|NORMALIDADE)\]\](.*?)\[\[\/\1\]\]/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = tagRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    const colorKey = match[1]
    const content = match[2]
    const colors = TEST_COLORS[colorKey] || TEST_COLORS.DESCRITIVA
    parts.push({ type: 'colored', content, colors, key: colorKey })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }]
}

function cleanMarkdown(text) {
  if (!text) return ''
  let cleaned = text
  cleaned = cleaned.replace(/`\.?`/g, '')
  cleaned = cleaned.replace(/```\s*\n?\s*```/g, '')
  cleaned = cleaned.replace(/\*\*\s*\*\*/g, '')
  cleaned = cleaned.replace(/\*\s{2,}\*/g, '')
  cleaned = cleaned.replace(/`([^`]{0,2})`/g, '$1')
  return cleaned
}

const markdownComponents = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-[11px] leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-stone-100">{children}</strong>,
  em: ({ children }) => <em className="text-stone-200 not-italic font-medium">{children}</em>,
  code: ({ children, className }) => {
    const isInline = !className
    if (isInline) {
      return <span className="bg-white/10 text-stone-100 px-1.5 py-0.5 rounded text-[11px] font-semibold">{children}</span>
    }
    return <code className="block bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] font-mono text-stone-300 overflow-x-auto my-2">{children}</code>
  },
  h1: ({ children }) => <h1 className="text-sm font-bold text-primary mb-2 mt-3">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[12px] font-bold text-primary mb-1.5 mt-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[11px] font-semibold text-teal-300 mb-1 mt-2">{children}</h3>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/30 pl-3 text-[11px] text-stone-400 italic my-2">{children}</blockquote>,
  hr: () => <hr className="border-white/10 my-3" />,
  a: ({ children, href }) => <a href={href} className="text-primary underline hover:text-teal-200 transition-colors">{children}</a>,
}

function MarkdownContent({ content }) {
  const cleaned = cleanMarkdown(content)
  const parsedParts = useMemo(() => parseColoredTags(cleaned), [cleaned])

  const hasColoredTags = Array.isArray(parsedParts) && parsedParts.some(p => p.type === 'colored')

  if (!hasColoredTags) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {cleaned}
      </ReactMarkdown>
    )
  }

  return (
    <div className="space-y-2">
      {parsedParts.map((part, i) => {
        if (part.type === 'colored') {
          return (
            <span
              key={i}
              className={`inline-block px-2 py-1 rounded-lg text-[11px] font-bold ${part.colors.badge}`}
            >
              {part.content}
            </span>
          )
        }
        return (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {part.content}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}

// ─── Action button component ───────────────────────────────────────────────────
function ActionButton({ action, onAction }) {
  if (!action || !action.type) return null
  const icon = ACTION_ICONS[action.type] || 'play_arrow'
  const label = action.label || action.type

  return (
    <motion.button
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      onClick={() => onAction(action)}
      className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/15 border border-primary/25
                 text-primary text-[11px] font-semibold hover:bg-primary/25 active:scale-95 transition-all w-full"
    >
      <span className="material-symbols-rounded text-[16px]">{icon}</span>
      {label}
    </motion.button>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ResearchAssistant({ isOpen, setIsOpen, onExport }) {
  const { trials, history, projects, activeProjectId } = useSciStat()
  const { session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! 👋 Sou o **Kai**, seu assistente pessoal de bioestatística.\n\nPosso te ajudar a:\n- Escolher o **teste estatístico** ideal para seus dados\n- **Interpretar resultados** de análises\n- Sugerir o melhor caminho na plataforma\n- Explicar conceitos de forma simples\n\nComo posso ajudar hoje?',
      needsUpload: false,
      action: null,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const chatRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  const currentPage = PAGE_NAMES[location.pathname] || location.pathname
  const currentRoute = location.pathname

  // ── Build system context ──────────────────────────────────────────────────
  const buildSystemContext = useCallback(() => {
    // Active project details
    const activeProject = projects?.find(p => String(p.id) === String(activeProjectId))
    const activeProjectLabel = activeProject
      ? `"${activeProject.title || activeProject.name}" (id: ${activeProject.id})`
      : 'Nenhum projeto ativo'

    // Last analysis
    const lastEntry = history?.[0]
    const lastAnalysisLabel = lastEntry
      ? `${lastEntry.test_name || lastEntry.outcome || 'Análise'} executado em ${new Date(lastEntry.created_at).toLocaleDateString('pt-BR')}, status: ${lastEntry.status || 'sem resultado'}`
      : 'Nenhuma análise recente'

    return [
      '[CONTEXTO DO SISTEMA]',
      `current_page: ${currentRoute}`,
      `active_project: ${activeProjectLabel}`,
      `last_analysis: ${lastAnalysisLabel}`,
      '[FIM DO CONTEXTO]',
    ].join('\n')
  }, [currentRoute, activeProjectId, projects, history])

  // ── Legacy context for sidebar fields ────────────────────────────────────
  const buildLegacyContext = useCallback(() => {
    const trialsSummary = trials.length > 0
      ? trials.slice(0, 5).map(t => `- "${t.title}" (Fase ${t.phase}, ${t.status}, ${t.n_actual}/${t.n_target} pacientes)`).join('\n')
      : 'Nenhum ensaio clínico cadastrado.'

    const historySummary = history.length > 0
      ? history.slice(0, 5).map(h => `- "${h.filename}" (Desfecho: ${h.outcome || 'N/A'}, ${new Date(h.created_at).toLocaleDateString('pt-BR')})`).join('\n')
      : 'Nenhuma análise realizada ainda.'

    return { trialsSummary, historySummary }
  }, [trials, history])

  // ── Action handler ────────────────────────────────────────────────────────
  const handleAction = useCallback((action) => {
    if (!action) return
    switch (action.type) {
      case 'navigate':
        if (action.route) {
          navigate(action.route)
          setIsOpen(false)
        }
        break
      case 'open_analysis':
        if (action.id) {
          navigate(`/archive?open=${action.id}`)
          setIsOpen(false)
        }
        break
      case 'export':
        if (typeof onExport === 'function') {
          onExport(action)
        }
        break
      default:
        console.warn('[Kai] Ação desconhecida:', action.type)
    }
  }, [navigate, setIsOpen, onExport])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() && !attachedFile) return
    const userMsg = input.trim()
    const file = attachedFile
    setInput('')
    setAttachedFile(null)

    const userMessage = {
      role: 'user',
      content: userMsg || (file ? `📎 ${file.name}` : ''),
      fileName: file?.name || null,
      action: null,
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const systemContext = buildSystemContext()
      const { trialsSummary, historySummary } = buildLegacyContext()
      const convHistory = messages.map(m => ({ role: m.role, content: m.content }))

      // Prepend invisible system context to the user message
      const enrichedMessage = `${systemContext}\n\n${userMsg || `Analise o arquivo anexado: ${file?.name}`}`

      const formData = new FormData()
      formData.append('message', enrichedMessage)
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
        headers: { 'Authorization': `Bearer ${session?.token}` },
        body: formData
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Erro na resposta do assistente.')
      }

      const data = await response.json()
      const rawContent = data.response || 'Não consegui processar sua pergunta.'

      // Extract action block before rendering
      const { text: displayContent, action } = parseActionBlock(rawContent)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: displayContent,
        needsUpload: data.needs_upload || false,
        action,
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Erro: ${error.message}. Verifique se o servidor está rodando e tente novamente.`,
        needsUpload: false,
        action: null,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleFileAttach = (e) => {
    const file = e.target.files[0]
    if (file) setAttachedFile(file)
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
            className="fixed bottom-20 lg:bottom-8 right-4 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 bg-primary text-background rounded-full flex items-center justify-center z-[90] hover:scale-110 active:scale-95 transition-all group"
          >
            <span className="material-symbols-rounded text-3xl group-hover:rotate-12 transition-transform">smart_toy</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full sm:w-[420px] h-[100dvh] sm:h-[650px] z-[100] glass-card sm:rounded-xl border-primary/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/10 px-8 py-5 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                <div>
                  <span className="text-[11px] font-semibold text-primary tracking-wide">Kai</span>
                  <span className="text-[9px] text-stone-500 ml-2">{currentPage}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all group"
                  title="Anexar arquivo"
                >
                  <span className="material-symbols-rounded text-[18px] text-stone-400 group-hover:text-primary transition-colors">attach_file</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="text-stone-500 hover:text-white transition-colors p-2">
                  <span className="material-symbols-rounded text-[20px]">close</span>
                </button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileAttach} className="hidden" />

            {/* Message list */}
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
                      : 'bg-white/5 text-stone-300 border border-white/5'
                  }`}>
                    {msg.fileName && (
                      <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${msg.role === 'user' ? 'border-background/20' : 'border-white/10'}`}>
                        <span className="material-symbols-rounded text-[14px]">description</span>
                        <span className="text-[10px] font-bold truncate">{msg.fileName}</span>
                      </div>
                    )}

                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <MarkdownContent content={msg.content} />
                    )}

                    {/* Upload prompt */}
                    {msg.needsUpload && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`mt-3 w-full py-2.5 rounded-xl text-[10px] font-semibold tracking-wide transition-all active:scale-95 ${
                          msg.role === 'user'
                            ? 'bg-background/20 text-background hover:bg-background/30'
                            : 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20'
                        }`}
                      >
                        <span className="material-symbols-rounded text-[14px] mr-1 align-middle">upload_file</span>
                        Anexar Arquivo
                      </button>
                    )}

                    {/* Contextual action button */}
                    {msg.role === 'assistant' && msg.action && (
                      <ActionButton action={msg.action} onAction={handleAction} />
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
                  <p className="text-[9px] font-bold text-stone-600 tracking-wide px-1">Sugestões rápidas</p>
                  <div className="grid grid-cols-1 gap-2">
                    {quickSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-left text-[11px] text-stone-400 hover:text-primary bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl transition-all border border-transparent hover:border-primary/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attached file preview */}
            {attachedFile && (
              <div className="px-6 py-2 border-t border-white/5 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-primary text-[16px]">description</span>
                  <span className="text-[10px] font-bold text-white truncate max-w-[200px]">{attachedFile.name}</span>
                  <span className="text-[9px] text-stone-500">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-stone-500 hover:text-stone-400 transition-colors">
                  <span className="material-symbols-rounded text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Input area */}
            <div className="p-4 border-t border-white/5 bg-white/2">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="relative flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-stone-500 hover:text-primary hover:bg-white/5 rounded-xl transition-all shrink-0"
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
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 transition-all text-white placeholder:text-stone-600"
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !attachedFile)}
                  className="p-2.5 bg-primary text-background rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <span className="material-symbols-rounded text-[18px]">send</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
