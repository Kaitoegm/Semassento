import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Helpers ────────────────────────────────────────────────────────────────
const isDesfecho = (rationale = '') => rationale.includes('[DESFECHO]')

const cleanRationale = (rationale = '') => rationale.replace('⭐ [DESFECHO] ', '')

// ─── Item inside a Drawer ────────────────────────────────────────────────────
const AnalysisItem = ({ item, onOptionChange, onToggleSelection }) => {
  const desfecho = isDesfecho(item.rationale)
  const selected = item.is_selected

  return (
    <div className={`flex flex-col lg:flex-row gap-6 p-6 rounded-2xl border transition-all group/item relative
      ${selected
        ? desfecho
          ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/30'
          : 'bg-primary/[0.03] border-primary/15 hover:border-primary/25'
        : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]'
      }`}
    >
      {/* Priority stripe */}
      {selected && (
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full ${desfecho ? 'bg-amber-400/60' : 'bg-primary/40'}`} />
      )}

      <div className="flex items-start gap-4 flex-1 pl-2">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelection(item.originalIdx)}
          className={`mt-1 w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all
            ${selected
              ? desfecho ? 'bg-amber-400 border-amber-400 text-black' : 'bg-primary border-primary text-background'
              : 'bg-transparent border-white/10 hover:border-primary/40'
            }`}
        >
          {selected && <span className="material-symbols-rounded text-base font-black">check</span>}
        </button>

        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm font-black text-white truncate">{item.name}</span>

            {desfecho && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-black text-amber-400 uppercase tracking-widest shrink-0">
                ⭐ DESFECHO
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-black text-slate-500 border border-white/5 uppercase tracking-tighter shrink-0">
              {item.type}
            </span>

            {!selected && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-slate-600 border border-white/5 uppercase tracking-widest shrink-0">
                opcional
              </span>
            )}
          </div>

          {/* Rationale */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-black/20 p-3 rounded-xl border border-white/5">
            <span className={`material-symbols-rounded text-xs mt-0.5 ${desfecho ? 'text-amber-400/60' : 'text-primary/60'}`}>info</span>
            <p>{cleanRationale(item.rationale)}</p>
          </div>
        </div>
      </div>

      {/* Test selector */}
      <div className="w-full lg:w-64 space-y-3 shrink-0">
        <div className="relative">
          <select
            disabled={!selected}
            value={item.recommended_test}
            onChange={(e) => onOptionChange(item.originalIdx, e.target.value)}
            className={`appearance-none w-full bg-slate-950 border text-white text-[10px] font-black uppercase tracking-widest py-3 px-4 pr-10 rounded-xl focus:outline-none transition-all cursor-pointer
              ${!selected ? 'opacity-25 pointer-events-none border-white/5' : desfecho ? 'border-amber-500/20 hover:border-amber-500/40 focus:border-amber-400' : 'border-white/10 hover:border-primary/40 focus:border-primary'}`}
          >
            {item.test_options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity ${!selected ? 'opacity-10' : desfecho ? 'text-amber-400' : 'text-primary'}`}>
            <span className="material-symbols-rounded text-lg">stat_minus_1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Group Drawer ────────────────────────────────────────────────────────────
const VariableDrawer = ({ groupName, items, onOptionChange, onToggleSelection, isOpen, onToggleGroup, relevance }) => {
  const selectedItems = items.filter(i => i.is_selected)
  const optionalItems = items.filter(i => !i.is_selected)
  const hasDesfecho = items.some(i => isDesfecho(i.rationale))

  return (
    <div className={`mb-4 rounded-3xl border transition-all duration-500 overflow-hidden
      ${isOpen
        ? hasDesfecho
          ? 'bg-amber-500/[0.02] border-amber-500/20 shadow-[0_20px_50px_-20px_rgba(245,158,11,0.1)]'
          : 'bg-white/[0.03] border-primary/30 shadow-[0_20px_50px_-20px_rgba(0,255,163,0.15)]'
        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
      }`}
    >
      <button onClick={onToggleGroup} className="w-full text-left px-8 py-6 flex items-center justify-between group">
        <div className="flex items-center gap-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500
            ${isOpen
              ? hasDesfecho ? 'bg-amber-400 text-black border-amber-400' : 'bg-primary text-background border-primary'
              : 'bg-white/5 text-slate-400 border-white/10 group-hover:border-primary/40'
            }`}
          >
            <span className="material-symbols-rounded text-2xl font-black">
              {hasDesfecho ? 'target' : relevance > 80 ? 'star' : relevance > 60 ? 'trending_up' : 'analytics'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className={`text-lg font-black transition-colors ${isOpen ? (hasDesfecho ? 'text-amber-400' : 'text-primary') : 'text-white'}`}>
                {groupName}
              </h3>
              {hasDesfecho && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  ⭐ Desfecho
                </span>
              )}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                <div className="w-1 h-1 rounded-full bg-primary/60"></div>
                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">{items.length} Testes</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Relevância Estatística</div>
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${relevance}%` }}
                  className={`h-full shadow-[0_0_10px_rgba(0,255,163,0.5)] ${hasDesfecho ? 'bg-amber-400' : 'bg-primary'}`}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all
          ${isOpen
            ? hasDesfecho ? 'rotate-180 bg-amber-500/10 border-amber-500/20 text-amber-400' : 'rotate-180 bg-primary/10 border-primary/20 text-primary'
            : 'bg-white/5 border-white/10 text-slate-600'
          }`}
        >
          <span className="material-symbols-rounded">expand_more</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-8 space-y-3">
              {/* Selected analyses */}
              {selectedItems.map((item) => (
                <AnalysisItem key={item.id} item={item} onOptionChange={onOptionChange} onToggleSelection={onToggleSelection} />
              ))}

              {/* Divider: optional section */}
              {selectedItems.length > 0 && optionalItems.length > 0 && (
                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Opcionais</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
              )}

              {/* Optional analyses */}
              {optionalItems.map((item) => (
                <AnalysisItem key={item.id} item={item} onOptionChange={onOptionChange} onToggleSelection={onToggleSelection} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
const AnalysisReviewPlan = ({ protocol, meta, onOptionChange, onConfirm, outcome, onOutcomeChange, outcomeOptions, onToggleSelection }) => {
  const [expandedGroup, setExpandedGroup] = useState(null)

  const selectedCount = useMemo(() => protocol?.filter(v => v.is_selected).length ?? 0, [protocol])
  const optionalCount = useMemo(() => protocol?.filter(v => !v.is_selected).length ?? 0, [protocol])

  const groupedProtocol = useMemo(() => {
    if (!protocol) return []
    const groups = {}
    protocol.forEach((item, idx) => {
      const groupKey = item.variable_group || 'Outros'
      if (!groups[groupKey]) {
        groups[groupKey] = { name: groupKey, items: [], maxRelevance: 0, hasSelected: false }
      }
      groups[groupKey].items.push({ ...item, originalIdx: idx })
      groups[groupKey].maxRelevance = Math.max(groups[groupKey].maxRelevance, item.relevance || 0)
      if (item.is_selected) groups[groupKey].hasSelected = true
    })
    // Groups with selected items first, then by relevance desc
    return Object.values(groups).sort((a, b) => {
      if (a.hasSelected !== b.hasSelected) return a.hasSelected ? -1 : 1
      return b.maxRelevance - a.maxRelevance
    })
  }, [protocol])

  if (!protocol || protocol.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[3.5rem] p-12 max-w-6xl mx-auto border border-white/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-10 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-1 rounded-full bg-primary/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Intelligent Protocol</span>
          </div>
          <h2 className="text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
            Review do Plano <br /> de Análise
          </h2>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-black tracking-widest uppercase">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span><strong className="text-white">{protocol.length}</strong> Variáveis</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <span className="material-symbols-rounded text-sm">check_circle</span>
              <span><strong>{selectedCount}</strong> Selecionadas</span>
            </div>

            {optionalCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-500">
                <span className="material-symbols-rounded text-sm">radio_button_unchecked</span>
                <span><strong className="text-slate-400">{optionalCount}</strong> Opcionais</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-400">
              <span className="text-slate-500">Desfecho:</span>
              {outcomeOptions && outcomeOptions.length > 1 ? (
                <select
                  value={outcome}
                  onChange={(e) => onOutcomeChange(e.target.value)}
                  className="appearance-none bg-transparent text-primary focus:outline-none cursor-pointer pr-4 font-black"
                >
                  {outcomeOptions.map(opt => (
                    <option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>
                  ))}
                </select>
              ) : (
                <span className="text-primary">{outcome}</span>
              )}
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 20px 70px rgba(0, 255, 163, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          className="bg-primary text-background font-black text-xs uppercase tracking-[0.3em] px-14 py-7 rounded-[2rem] shadow-[0_25px_50px_-15px_rgba(0,255,163,0.3)] transition-all flex items-center gap-5 group shrink-0"
        >
          Iniciar Análise Full
          <span className="material-symbols-rounded text-xl group-hover:rotate-12 transition-transform">rocket_launch</span>
        </motion.button>
      </div>

      {/* Grouped protocol */}
      <div className="space-y-4">
        {groupedProtocol.map((group) => (
          <VariableDrawer
            key={group.name}
            groupName={group.name}
            items={group.items}
            relevance={group.maxRelevance}
            isOpen={expandedGroup === group.name}
            onToggleGroup={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
            onOptionChange={onOptionChange}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>

      {/* Scientific guideline footer */}
      <div className="mt-20 p-10 rounded-[3rem] bg-gradient-to-br from-slate-950 to-slate-900 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <span className="material-symbols-rounded text-9xl">science</span>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="w-16 h-16 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <span className="material-symbols-rounded text-2xl">tips_and_updates</span>
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white mb-3">Diretriz de Rigor Científico</h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-4xl">
              O SciStat prioriza automaticamente análises ligadas ao <strong className="text-amber-400">⭐ Desfecho principal</strong> e variáveis com maior <strong className="text-slate-300">completitude de dados</strong>.
              As análises recomendadas estão <strong className="text-primary">já selecionadas</strong> — as opcionais ficam disponíveis para inclusão manual conforme seu julgamento clínico.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AnalysisReviewPlan
