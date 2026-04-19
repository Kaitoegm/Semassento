import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function OutcomeSelector({ columns, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null)

  const suggested = columns.find(c => c.suggested)?.name

  const typeBadge = (type) => {
    if (type === 'Numérico') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    if (type === 'Binário') return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="bg-surface w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border-subtle shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-primary text-xl">target</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-main">
                  Qual é a variável desfecho?
                </h2>
                <p className="text-xs text-text-muted">
                  Selecione a variável principal que será analisada em relação a todas as outras
                </p>
              </div>
            </div>

            {suggested && !selected && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15">
                <span className="material-symbols-rounded text-primary text-sm">auto_awesome</span>
                <span className="text-xs text-text-muted">
                  Sugerido: <strong className="text-primary font-semibold">{suggested}</strong> — clique para selecionar ou escolha outra
                </span>
              </div>
            )}
          </div>

          {/* Grid de colunas */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {columns.map((col) => {
                const isSelected = selected === col.name
                const isSuggested = col.suggested

                return (
                  <button
                    key={col.name}
                    onClick={() => setSelected(col.name)}
                    className={`text-left p-3.5 rounded-lg border transition-all relative group
                      ${isSelected
                        ? 'bg-primary/8 border-primary/30 ring-1 ring-primary/20'
                        : isSuggested
                          ? 'bg-surface border-primary/15 border-dashed hover:border-primary/30 hover:bg-primary/5'
                          : 'bg-surface border-border-subtle hover:border-border-subtle hover:bg-white/[0.03]'
                      }`}
                  >
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge(col.type)}`}>
                        {col.type}
                      </span>
                      {isSuggested && !isSelected && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Sugerido
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                          Selecionado
                        </span>
                      )}
                    </div>

                    {/* Nome */}
                    <p className={`text-sm font-semibold mb-1.5 break-words ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                      {col.name}
                    </p>

                    {/* Amostra */}
                    {col.sample?.length > 0 && (
                      <p className="text-[10px] font-mono text-text-muted bg-background/60 rounded px-2 py-1 truncate">
                        {col.sample.join(', ')}
                        {col.unique_count > 3 && <span className="text-text-muted/60"> ...{col.unique_count} únicos</span>}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-border-subtle">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-lg border border-border-subtle text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface transition-all"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => selected && onConfirm(selected)}
              disabled={!selected}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${selected
                  ? 'bg-primary text-background hover:opacity-90 active:scale-[0.98]'
                  : 'bg-primary/10 text-primary/40 cursor-not-allowed'
                }`}
            >
              <span className="material-symbols-rounded text-base">check_circle</span>
              Confirmar Desfecho
              {selected && (
                <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs max-w-[120px] truncate">
                  {selected}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
