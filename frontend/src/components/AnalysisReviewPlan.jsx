import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DataQualityBanner from './DataQualityBanner'
import DatasetEditorModal from './DatasetEditorModal'

// ─── Helpers ────────────────────────────────────────────────────────────────
const isDesfecho = (rationale = '') => rationale.includes('[DESFECHO]')
const cleanRationale = (rationale = '') => rationale.replace('⭐ [DESFECHO] ', '')

// ─── Tooltip de Rationale ────────────────────────────────────────────────────
const RationaleTooltip = ({ text, isDesfecho: desfecho }) => (
  <div className="arv-tooltip-wrap">
    <span
      className={`material-symbols-rounded arv-info-icon ${desfecho ? 'arv-info-desfecho' : 'arv-info-default'}`}
    >
      info
    </span>
    <div className="arv-tooltip">
      <p>{text}</p>
    </div>
  </div>
)

// ─── Item inside a Drawer ────────────────────────────────────────────────────
const AnalysisItem = ({ item, onOptionChange, onToggleSelection }) => {
  const desfecho = isDesfecho(item.rationale)
  const selected = item.is_selected

  return (
    <div className={`arv-item ${selected ? (desfecho ? 'arv-item--desfecho' : 'arv-item--selected') : 'arv-item--optional'}`}>
      {/* Priority stripe */}
      {selected && <div className={`arv-stripe ${desfecho ? 'arv-stripe--desfecho' : 'arv-stripe--default'}`} />}

      {/* Linha principal */}
      <div className="arv-item-row">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelection(item.originalIdx)}
          className={`arv-checkbox ${selected
            ? desfecho ? 'arv-checkbox--desfecho' : 'arv-checkbox--selected'
            : 'arv-checkbox--empty'
          }`}
        >
          {selected && <span className="material-symbols-rounded" style={{ fontSize: 14 }}>check</span>}
        </button>

        {/* Nome + badges */}
        <div className="arv-item-meta">
          <span className="arv-item-name">{item.name}</span>
          <div className="arv-badges">
            {desfecho && (
              <span className="arv-badge arv-badge--desfecho">⭐ DESFECHO</span>
            )}
            <span className="arv-badge arv-badge--type">{item.type}</span>
            {!selected && <span className="arv-badge arv-badge--optional">opcional</span>}
          </div>
        </div>

        {/* Rationale tooltip */}
        <RationaleTooltip text={cleanRationale(item.rationale)} isDesfecho={desfecho} />

        {/* Seletor de teste */}
        <div className="arv-select-wrap">
          <select
            disabled={!selected}
            value={item.recommended_test}
            onChange={(e) => onOptionChange(item.originalIdx, e.target.value)}
            className={`arv-select ${!selected ? 'arv-select--disabled' : desfecho ? 'arv-select--desfecho' : 'arv-select--default'}`}
          >
            {item.test_options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span className={`material-symbols-rounded arv-select-icon ${!selected ? 'opacity-20' : desfecho ? 'arv-icon-desfecho' : 'arv-icon-default'}`}>
            stat_minus_1
          </span>
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
    <div className={`arv-drawer ${isOpen
      ? hasDesfecho ? 'arv-drawer--desfecho-open' : 'arv-drawer--open'
      : 'arv-drawer--closed'
    }`}>
      <button onClick={onToggleGroup} className="arv-drawer-header">
        {/* Ícone de grupo */}
        <div className={`arv-drawer-icon ${isOpen
          ? hasDesfecho ? 'arv-drawer-icon--desfecho' : 'arv-drawer-icon--active'
          : 'arv-drawer-icon--idle'
        }`}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
            {hasDesfecho ? 'target' : relevance > 80 ? 'star' : relevance > 60 ? 'trending_up' : 'analytics'}
          </span>
        </div>

        {/* Título e info */}
        <div className="arv-drawer-title-wrap">
          <div className="arv-drawer-title-row">
            <h3 className={`arv-drawer-title ${isOpen ? (hasDesfecho ? 'arv-title--desfecho' : 'arv-title--active') : 'arv-title--idle'}`}>
              {groupName}
            </h3>
            {hasDesfecho && (
              <span className="arv-badge arv-badge--desfecho">⭐ Desfecho</span>
            )}
            <span className="arv-count-badge">
              <span className="arv-count-dot" />
              {items.length} testes
            </span>
          </div>

          {/* Barra de relevância */}
          <div className="arv-relevance-bar-wrap">
            <div className="arv-relevance-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${relevance}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`arv-relevance-fill ${hasDesfecho ? 'arv-rel-desfecho' : 'arv-rel-default'}`}
              />
            </div>
            <span className="arv-relevance-label">{relevance}%</span>
          </div>
        </div>

        {/* Chevron */}
        <div className={`arv-chevron ${isOpen ? (hasDesfecho ? 'arv-chevron--desfecho' : 'arv-chevron--active') : 'arv-chevron--idle'}`}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>expand_more</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="arv-drawer-body"
          >
            <div className="arv-drawer-content">
              {selectedItems.map((item) => (
                <AnalysisItem key={item.id} item={item} onOptionChange={onOptionChange} onToggleSelection={onToggleSelection} />
              ))}

              {selectedItems.length > 0 && optionalItems.length > 0 && (
                <div className="arv-optional-divider">
                  <div className="arv-divider-line" />
                  <span className="arv-divider-label">Opcionais</span>
                  <div className="arv-divider-line" />
                </div>
              )}

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
const AnalysisReviewPlan = ({ protocol, meta, onOptionChange, onConfirm, outcome, onOutcomeChange, outcomeOptions, onToggleSelection, dataQuality, pendingFile, onDatasetCorrected }) => {
  // Abrir apenas o grupo com desfecho por padrão
  const defaultOpen = useMemo(() => {
    if (!protocol) return null
    const groups = {}
    protocol.forEach((item, idx) => {
      const groupKey = item.variable_group || 'Outros'
      if (!groups[groupKey]) groups[groupKey] = { hasDesfecho: false }
      if (isDesfecho(item.rationale)) groups[groupKey].hasDesfecho = true
    })
    const desfechoGroup = Object.entries(groups).find(([_, g]) => g.hasDesfecho)
    return desfechoGroup ? desfechoGroup[0] : null
  }, [protocol])

  const [expandedGroup, setExpandedGroup] = useState(defaultOpen)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorFocusCol, setEditorFocusCol] = useState(null)

  const hasQualityIssues = !!(dataQuality && dataQuality.summary?.overall_status !== 'ok')
  const totalIssues = (dataQuality?.summary?.cols_critical ?? 0) + (dataQuality?.summary?.cols_warning ?? 0)

  const handleConfirmClick = () => {
    if (hasQualityIssues && pendingFile) {
      handleEditRequest(null)
      return
    }
    onConfirm()
  }

  const handleEditRequest = (focusCol) => {
    setEditorFocusCol(focusCol || null)
    setEditorOpen(true)
  }

  const handleEditorSave = (correctedFile, newQuality) => {
    setEditorOpen(false)
    if (onDatasetCorrected) onDatasetCorrected(correctedFile, newQuality)
  }

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
    return Object.values(groups).sort((a, b) => {
      if (a.hasSelected !== b.hasSelected) return a.hasSelected ? -1 : 1
      return b.maxRelevance - a.maxRelevance
    })
  }, [protocol])

  if (!protocol || protocol.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="arv-root"
    >
      {/* Glow decorativo */}
      <div className="arv-glow" />

      {/* ── HEADER COMPACTO ─────────────────────────────────────────── */}
      <div className="arv-header">
        <div className="arv-header-left">
          {/* Label */}
          <span className="arv-header-label">
            <span className="material-symbols-rounded" style={{ fontSize: 13 }}>checklist</span>
            Revisão de Variáveis
          </span>

          {/* Chips de stat */}
          <div className="arv-stat-chips">
            <div className="arv-chip arv-chip--vars">
              <span className="arv-chip-dot" />
              <strong>{protocol.length}</strong> variáveis
            </div>
            <div className="arv-chip arv-chip--selected">
              <span className="material-symbols-rounded" style={{ fontSize: 12 }}>check_circle</span>
              <strong>{selectedCount}</strong> ativas
            </div>
            {optionalCount > 0 && (
              <div className="arv-chip arv-chip--optional">
                <strong>{optionalCount}</strong> opcionais
              </div>
            )}
            {/* Seletor de desfecho inline */}
            <div className="arv-chip arv-chip--outcome">
              <span className="material-symbols-rounded" style={{ fontSize: 12 }}>target</span>
              {outcomeOptions && outcomeOptions.length > 1 ? (
                <select
                  value={outcome}
                  onChange={(e) => onOutcomeChange(e.target.value)}
                  className="arv-outcome-select"
                >
                  {outcomeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <span className="arv-outcome-text">{outcome}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BANNER DE QUALIDADE ──────────────────────────────────────── */}
      {dataQuality && (
        <div className="arv-quality-wrap">
          <DataQualityBanner
            dataQuality={dataQuality}
            onEditRequest={pendingFile ? handleEditRequest : undefined}
          />
        </div>
      )}

      {/* ── CTA HERO ────────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConfirmClick}
        className={`arv-cta ${hasQualityIssues ? 'arv-cta--warn' : 'arv-cta--default'}`}
      >
        <div className="arv-cta-inner">
          <div className="arv-cta-left">
            <span className={`material-symbols-rounded arv-cta-icon ${hasQualityIssues ? '' : 'arv-cta-icon-pulse'}`}>
              {hasQualityIssues ? 'edit_note' : 'rocket_launch'}
            </span>
            <div>
              <p className="arv-cta-title">
                {hasQualityIssues ? `Corrigir dados (${totalIssues} coluna${totalIssues !== 1 ? 's' : ''})` : 'Iniciar Análise Completa'}
              </p>
              <p className="arv-cta-sub">
                {hasQualityIssues
                  ? 'Corrija as inconsistências antes de executar'
                  : `${selectedCount} análises · Protocolo APA-7 gerado automaticamente`}
              </p>
            </div>
          </div>
          <span className="material-symbols-rounded arv-cta-arrow">arrow_forward</span>
        </div>
      </motion.button>

      {/* Editor modal */}
      <DatasetEditorModal
        isOpen={editorOpen}
        pendingFile={pendingFile}
        dataQuality={dataQuality}
        focusColumn={editorFocusCol}
        onSave={handleEditorSave}
        onClose={() => setEditorOpen(false)}
      />

      {/* ── GRUPOS COLAPSÁVEIS ───────────────────────────────────────── */}
      <div className="arv-groups">
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

      {/* ── RODAPÉ CIENTÍFICO (compacto) ────────────────────────────── */}
      <div className="arv-footer">
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--color-primary)', flexShrink: 0 }}>tips_and_updates</span>
        <p className="arv-footer-text">
          O Paper Metrics prioriza análises do <strong style={{ color: '#f59e0b' }}>⭐ Desfecho principal</strong> e variáveis com maior completitude.
          As análises recomendadas estão <strong style={{ color: 'var(--color-primary)' }}>pré-selecionadas</strong> — as opcionais ficam disponíveis para inclusão manual.
        </p>
      </div>
    </motion.div>
  )
}

export default AnalysisReviewPlan
