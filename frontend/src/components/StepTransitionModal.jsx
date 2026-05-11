import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * StepTransitionModal
 * 
 * Modal central premium que aparece durante a transição entre steps do pipeline.
 * Exibe: backdrop blur + stepper minimalista no topo + ícone central animado + texto narrativo.
 * 
 * Props:
 *   open        — boolean: exibe o modal
 *   stepIndex   — number: step atual (0-indexed)
 *   steps       — array: [{ label, icon, sublabel }]
 *   onDone      — callback: chamado após a animação completar (fechar modal)
 *   autoClose   — ms para fechar automaticamente (default 1800, 0 = manual)
 */
export default function StepTransitionModal({ open, stepIndex = 0, steps = [], onDone, autoClose = 1800 }) {
  const current = steps[stepIndex] ?? { label: '', icon: 'circle', sublabel: '' }
  const progress = steps.length > 1 ? stepIndex / (steps.length - 1) : 0

  // Fechar automaticamente após `autoClose` ms
  useEffect(() => {
    if (!open || autoClose === 0) return
    const t = setTimeout(() => { onDone?.() }, autoClose)
    return () => clearTimeout(t)
  }, [open, stepIndex, autoClose, onDone])

  return (
    <AnimatePresence>
      {open && (
        // ── Backdrop ──────────────────────────────────────────────────
        <motion.div
          key="stm-backdrop"
          className="stm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {/* ── Card central ─────────────────────────────────────────── */}
          <motion.div
            className="stm-card"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.9 }}
          >
            {/* ── Barra de progresso no topo ────────────────────────── */}
            <div className="stm-progress-track">
              <motion.div
                className="stm-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Brilho na ponta da barra */}
              <motion.div
                className="stm-progress-glow"
                initial={{ left: 0 }}
                animate={{ left: `${progress * 100}%` }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* ── Stepper de steps ──────────────────────────────────── */}
            <div className="stm-stepper">
              {/* Linha dos nós + conectores */}
              <div className="stm-nodes-row">
                {steps.map((step, i) => {
                  const isDone = i < stepIndex
                  const isActive = i === stepIndex
                  return (
                    <div key={step.label} className="stm-node-cell">
                      <div className={`stm-node ${isActive ? 'stm-node--active' : isDone ? 'stm-node--done' : 'stm-node--idle'}`}>
                        <AnimatePresence mode="wait" initial={false}>
                          {isDone ? (
                            <motion.span
                              key="check"
                              className="material-symbols-rounded stm-node-icon"
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                            >check</motion.span>
                          ) : isActive ? (
                            <motion.span
                              key="active"
                              className="material-symbols-rounded stm-node-icon"
                              initial={{ scale: 0.4, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.4, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                            >{step.icon}</motion.span>
                          ) : (
                            <motion.span
                              key="idle"
                              className="material-symbols-rounded stm-node-icon stm-idle-icon"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >{step.icon}</motion.span>
                          )}
                        </AnimatePresence>
                        {/* Anel pulsante no step ativo */}
                        {isActive && (
                          <motion.div
                            className="stm-node-ring"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                          />
                        )}
                      </div>
                      {/* Conector à direita do nó, exceto no último */}
                      {i < steps.length - 1 && (
                        <div className="stm-connector-track">
                          <motion.div
                            className="stm-connector-fill"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: isDone ? 1 : 0 }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            style={{ originX: 0 }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Linha dos labels */}
              <div className="stm-labels-row">
                {steps.map((step, i) => {
                  const isDone = i < stepIndex
                  const isActive = i === stepIndex
                  return (
                    <span
                      key={step.label}
                      className={`stm-label ${isActive ? 'stm-label--active' : isDone ? 'stm-label--done' : 'stm-label--idle'}`}
                    >
                      {step.label}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* ── Separador ────────────────────────────────────────── */}
            <div className="stm-divider" />

            {/* ── Área central: ícone + texto ───────────────────────── */}
            <div className="stm-body">
              {/* Orb animada */}
              <div className="stm-orb-wrap">
                {/* Anel externo pulsante */}
                <motion.div
                  className="stm-orb-ring stm-orb-ring--outer"
                  animate={{ scale: [1, 1.55, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                />
                {/* Anel médio girando */}
                <motion.div
                  className="stm-orb-ring stm-orb-ring--mid"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
                />
                {/* Core */}
                <motion.div
                  className="stm-orb-core"
                  animate={{
                    scale: [1, 1.07, 1],
                    boxShadow: [
                      '0 0 18px color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      '0 0 38px color-mix(in srgb, var(--color-primary) 35%, transparent)',
                      '0 0 18px color-mix(in srgb, var(--color-primary) 15%, transparent)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={stepIndex}
                      className="material-symbols-rounded stm-orb-icon"
                      initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.4, opacity: 0, rotate: 20 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    >
                      {current.icon}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Texto narrativo */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  className="stm-text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <p className="stm-headline">{current.label}</p>
                  {current.sublabel && (
                    <p className="stm-sublabel">{current.sublabel}</p>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Dots de loading */}
              <motion.div className="stm-dots">
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="stm-dot"
                    style={{ width: i === 1 || i === 2 ? '7px' : '4px', height: i === 1 || i === 2 ? '7px' : '4px' }}
                    animate={{ y: [0, -9, 0], opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 0.75, delay: i * 0.12, ease: 'easeInOut' }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
