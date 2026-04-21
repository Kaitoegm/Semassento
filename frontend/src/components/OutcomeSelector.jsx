import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
const TYPE_FILTERS = ['Todos', 'Numérico', 'Binário', 'Categórico', 'Derivado']

const typeBadgeStyle = (type, isDerived) => {
  if (isDerived) return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  if (type === 'Numérico') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (type === 'Binário') return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
}

const typeIcon = (type, isDerived) => {
  if (isDerived) return 'calculate'
  if (type === 'Numérico') return 'bar_chart'
  if (type === 'Binário') return 'toggle_on'
  return 'category'
}

// ──────────────────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────────────────
export default function OutcomeSelector({ columns, onConfirm, onCancel }) {
  const suggested = columns.find(c => c.suggested)?.name
  const [selected, setSelected] = useState(suggested || null)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const searchRef = useRef(null)

  // Focar busca ao abrir
  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 150)
    return () => clearTimeout(timer)
  }, [])

  // Colunas filtradas por busca + tipo
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return columns.filter(col => {
      const matchSearch = !q || col.name.toLowerCase().includes(q) ||
        col.sample?.some(s => String(s).toLowerCase().includes(q))
      const colType = col.isDerived ? 'Derivado' : col.type
      const matchFilter = activeFilter === 'Todos' || colType === activeFilter
      return matchSearch && matchFilter
    })
  }, [columns, query, activeFilter])

  // Contagem por filtro
  const counts = useMemo(() => {
    const c = { Todos: columns.length, Numérico: 0, Binário: 0, Categórico: 0, Derivado: 0 }
    columns.forEach(col => {
      const t = col.isDerived ? 'Derivado' : col.type
      if (c[t] !== undefined) c[t]++
    })
    return c
  }, [columns])

  const handleConfirm = () => {
    if (selected) onConfirm(selected)
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#0d1625] w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/8 shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.05)' }}
        >

          {/* ── Header ── */}
          <div className="p-5 pb-4 border-b border-white/6">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <span className="material-symbols-rounded text-indigo-400 text-xl">target</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white leading-tight">
                  Qual é a variável desfecho?
                </h2>
                <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                  Selecione a variável principal que será o foco da análise estatística
                </p>
              </div>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-white/30 hover:text-white/60 transition-colors shrink-0 mt-0.5"
                >
                  <span className="material-symbols-rounded text-lg">close</span>
                </button>
              )}
            </div>

            {/* Sugestão ativa */}
            {suggested && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 cursor-pointer"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.3)' }}
                onClick={() => setSelected(suggested)}
              >
                <span className="material-symbols-rounded text-indigo-400 text-sm">auto_awesome</span>
                <span className="text-[11px] text-white/50 flex-1">
                  Sugestão automática:&nbsp;
                  <strong className="text-indigo-300 font-semibold">{suggested}</strong>
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selected === suggested ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                  {selected === suggested ? '✓ Selecionado' : 'Usar esta'}
                </span>
              </motion.div>
            )}

            {/* Barra de busca */}
            <div className="relative">
              <span
                className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-white/25 text-base pointer-events-none"
                style={{ fontSize: '17px' }}
              >
                search
              </span>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar variável…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white/80 placeholder-white/25 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  <span className="material-symbols-rounded text-sm">close</span>
                </button>
              )}
            </div>

            {/* Filtros de tipo */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {TYPE_FILTERS.map(f => (
                counts[f] > 0 || f === 'Todos' ? (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      activeFilter === f
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-white/3 text-white/35 border-white/8 hover:bg-white/6 hover:text-white/55'
                    }`}
                  >
                    {f === 'Derivado' ? '⚡ Derivado' : f}
                    <span className="ml-1 opacity-60">{counts[f]}</span>
                  </button>
                ) : null
              ))}
            </div>
          </div>

          {/* ── Grid de colunas ── */}
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <span className="material-symbols-rounded text-4xl text-white/15">search_off</span>
                <p className="text-sm text-white/30">Nenhuma variável encontrada para "<span className="text-white/50">{query}</span>"</p>
                <button onClick={() => { setQuery(''); setActiveFilter('Todos') }} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <AnimatePresence mode="popLayout">
                  {filtered.map((col) => {
                    const isSelected = selected === col.name
                    const isSuggested = col.suggested
                    const isDerived = col.isDerived

                    return (
                      <motion.button
                        layout
                        key={col.name}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setSelected(col.name)}
                        className={`text-left p-3.5 rounded-xl border transition-all relative group ${
                          isSelected
                            ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
                            : isSuggested
                              ? 'border-indigo-400/20 border-dashed hover:border-indigo-400/40'
                              : isDerived
                                ? 'border-violet-500/20 hover:border-violet-500/40'
                                : 'border-white/6 hover:border-white/14'
                        }`}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))'
                            : isDerived
                              ? 'rgba(168,85,247,0.05)'
                              : 'rgba(255,255,255,0.025)',
                        }}
                      >
                        {/* Glow para selecionado */}
                        {isSelected && (
                          <div
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{ boxShadow: '0 0 20px rgba(99,102,241,0.15) inset' }}
                          />
                        )}

                        {/* Linha 1: badges */}
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="material-symbols-rounded text-sm"
                            style={{ fontSize: '14px', color: isDerived ? '#a78bfa' : isSelected ? '#818cf8' : 'rgba(255,255,255,0.3)' }}>
                            {typeIcon(col.type, isDerived)}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${typeBadgeStyle(col.type, isDerived)}`}>
                            {isDerived ? 'Derivado' : col.type}
                          </span>
                          {isSuggested && !isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-400/20">
                              ★ Sugerido
                            </span>
                          )}
                          {isSelected && (
                            <span className="ml-auto">
                              <span className="material-symbols-rounded text-indigo-400" style={{ fontSize: '16px' }}>check_circle</span>
                            </span>
                          )}
                        </div>

                        {/* Nome da variável */}
                        <p className={`text-sm font-semibold mb-1.5 break-words leading-snug ${
                          isSelected ? 'text-indigo-200' : isDerived ? 'text-violet-300' : 'text-white/80'
                        }`}>
                          {col.name}
                        </p>

                        {/* Amostra */}
                        {col.sample?.length > 0 && (
                          <p className="text-[10px] font-mono leading-relaxed truncate"
                            style={{ color: 'rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '3px 7px' }}>
                            {col.sample.slice(0, 3).join(' · ')}
                            {col.unique_count > 3 && (
                              <span style={{ color: 'rgba(255,255,255,0.15)' }}> +{col.unique_count - 3}</span>
                            )}
                          </p>
                        )}
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-3 p-4 border-t border-white/6"
            style={{ background: 'rgba(0,0,0,0.2)' }}>
            {/* Info de seleção */}
            <div className="text-[11px] text-white/30 min-w-0">
              {selected
                ? <><span className="text-white/50 font-medium">{selected}</span> selecionada</>
                : <span>Selecione uma variável para continuar</span>
              }
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 border border-white/6 hover:border-white/12 transition-all"
                >
                  Cancelar
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                disabled={!selected}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selected
                    ? 'text-white hover:brightness-110 active:scale-[0.98] shadow-lg'
                    : 'cursor-not-allowed opacity-35'
                }`}
                style={selected ? {
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                } : {
                  background: 'rgba(99,102,241,0.1)',
                }}
              >
                <span className="material-symbols-rounded text-base">check_circle</span>
                Confirmar Desfecho
              </motion.button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
