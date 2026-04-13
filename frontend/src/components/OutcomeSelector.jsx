import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * OutcomeSelector — Passo 0 obrigatório antes da análise.
 * Exibe as colunas do arquivo e pede ao usuário que escolha o desfecho.
 */
export default function OutcomeSelector({ columns, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null)

  // Inicializa com a sugestão do backend se ainda não selecionou
  const suggested = columns.find(c => c.suggested)?.name

  const typeColor = (type) => {
    if (type === 'Numérico') return { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#a5b4fc' }
    if (type === 'Binário') return { bg: 'rgba(34,197,94,0.15)', border: '#22c55e', text: '#86efac' }
    return { bg: 'rgba(251,146,60,0.15)', border: '#fb923c', text: '#fdba74' }
  }

  const handleConfirm = () => {
    if (selected) onConfirm(selected)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '20px',
            padding: '32px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
          }}
        >
          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <span className="material-icons" style={{ color: '#fff', fontSize: '20px' }}>track_changes</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                  Qual é a variável desfecho?
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Selecione a variável principal que será analisada em relação a todas as outras
                </p>
              </div>
            </div>
            {suggested && !selected && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '10px', padding: '8px 12px', marginTop: '12px'
              }}>
                <span className="material-icons" style={{ color: '#818cf8', fontSize: '16px' }}>auto_awesome</span>
                <span style={{ fontSize: '12px', color: '#a5b4fc' }}>
                  Sugerido automaticamente: <strong style={{ color: '#c7d2fe' }}>{suggested}</strong> — clique para selecionar ou escolha outra
                </span>
              </div>
            )}
          </div>

          {/* Grid de colunas */}
          <div style={{
            overflowY: 'auto',
            flexGrow: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px',
            paddingRight: '4px'
          }}>
            {columns.map((col) => {
              const isSelected = selected === col.name
              const isSuggested = col.suggested
              const colors = typeColor(col.type)

              return (
                <motion.button
                  key={col.name}
                  onClick={() => setSelected(col.name)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))'
                      : 'rgba(30,41,59,0.8)',
                    border: isSelected
                      ? '2px solid #6366f1'
                      : isSuggested
                        ? '1px dashed rgba(99,102,241,0.5)'
                        : '1px solid rgba(100,116,139,0.2)',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.2), 0 4px 16px rgba(99,102,241,0.15)' : 'none',
                  }}
                >
                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                      borderRadius: '20px', background: colors.bg, color: colors.text,
                      border: `1px solid ${colors.border}40`, letterSpacing: '0.5px'
                    }}>{col.type}</span>
                    {isSuggested && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '20px', background: 'rgba(250,204,21,0.15)',
                        color: '#fde68a', border: '1px solid rgba(250,204,21,0.3)',
                        letterSpacing: '0.5px'
                      }}>⭐ Sugerido</span>
                    )}
                    {isSelected && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '20px', background: 'rgba(99,102,241,0.3)',
                        color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.4)',
                        letterSpacing: '0.5px'
                      }}>✓ Selecionado</span>
                    )}
                  </div>

                  {/* Nome da coluna */}
                  <div style={{
                    fontSize: '13px', fontWeight: 600,
                    color: isSelected ? '#e0e7ff' : '#cbd5e1',
                    marginBottom: '6px',
                    wordBreak: 'break-word'
                  }}>
                    {col.name}
                  </div>

                  {/* Amostra de valores */}
                  {col.sample?.length > 0 && (
                    <div style={{
                      fontSize: '11px', color: '#64748b',
                      background: 'rgba(15,23,42,0.5)',
                      borderRadius: '6px', padding: '4px 8px',
                      fontFamily: 'monospace'
                    }}>
                      {col.sample.join(', ')}
                      {col.unique_count > 3 && <span style={{ color: '#475569' }}> …{col.unique_count} únicos</span>}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(100,116,139,0.15)', paddingTop: '20px' }}>
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(100,116,139,0.3)',
                  background: 'transparent', color: '#94a3b8', fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Cancelar
              </button>
            )}
            <motion.button
              onClick={handleConfirm}
              disabled={!selected}
              whileHover={selected ? { scale: 1.03 } : {}}
              whileTap={selected ? { scale: 0.97 } : {}}
              style={{
                padding: '10px 28px', borderRadius: '10px',
                background: selected
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(99,102,241,0.15)',
                border: selected ? 'none' : '1px solid rgba(99,102,241,0.2)',
                color: selected ? '#fff' : '#6366f1',
                fontSize: '14px', fontWeight: 600,
                cursor: selected ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: selected ? '0 4px 16px rgba(99,102,241,0.35)' : 'none'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>track_changes</span>
              Confirmar Desfecho
              {selected && (
                <span style={{
                  background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
                  padding: '1px 8px', fontSize: '12px', maxWidth: '120px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {selected}
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
