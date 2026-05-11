import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * PipelineStepper
 *
 * Barra de progresso horizontal persistente — aparece durante todo o fluxo
 * de análise (passos 0→4). Fica sticky no topo do conteúdo quando o
 * AnalysisReviewPlan está visível (step 3).
 *
 * Props:
 *   currentStep  {number}  0–4 — step atual
 *   steps        {Array}   mesma lista PIPELINE_STEPS do Dashboard
 *   sticky       {boolean} se true, aplica position:sticky (usar no Passo 3)
 */
export default function PipelineStepper({ currentStep = 0, steps = [], sticky = false }) {
  const prevStep = useRef(currentStep)

  useEffect(() => {
    prevStep.current = currentStep
  }, [currentStep])

  if (!steps.length) return null

  return (
    <div className={`pip-root${sticky ? ' pip-root--sticky' : ''}`}>
      <div className="pip-track">
        {steps.map((step, i) => {
          const isDone   = i < currentStep
          const isActive = i === currentStep
          const isIdle   = i > currentStep

          // O conector fica ENTRE os nós — só existe do índice 0 ao N-2
          const showConnector = i < steps.length - 1

          return (
            <div key={step.label} className="pip-cell">
              {/* Nó */}
              <div className="pip-node-wrap">
                <motion.div
                  className={`pip-node ${
                    isActive ? 'pip-node--active' :
                    isDone   ? 'pip-node--done'   :
                               'pip-node--idle'
                  }`}
                  animate={isActive ? {
                    boxShadow: [
                      '0 0 0 0px color-mix(in srgb, var(--color-primary) 25%, transparent)',
                      '0 0 0 6px color-mix(in srgb, var(--color-primary) 0%, transparent)',
                    ]
                  } : {}}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                >
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.span
                        key="check"
                        className="pip-node-icon material-symbols-rounded"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      >
                        check
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon"
                        className="pip-node-icon material-symbols-rounded"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {step.icon}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label abaixo do nó */}
                <span className={`pip-label ${
                  isActive ? 'pip-label--active' :
                  isDone   ? 'pip-label--done'   :
                             'pip-label--idle'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Conector horizontal */}
              {showConnector && (
                <div className="pip-connector-track">
                  <motion.div
                    className="pip-connector-fill"
                    initial={false}
                    animate={{ scaleX: isDone ? 1 : 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
