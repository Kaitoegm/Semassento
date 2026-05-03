import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Configuração dos níveis de status ───────────────────────────────────────
const STATUS_CONFIG = {
  ok:       { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', label: 'Dados em ordem', icon: 'check_circle' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Atenção recomendada', icon: 'warning' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  label: 'Problemas críticos', icon: 'error' },
}

// ─── Dot colorido por status ──────────────────────────────────────────────────
const StatusDot = ({ status, size = 8 }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ok
  return (
    <span
      style={{ width: size, height: size, background: cfg.color, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }}
    />
  )
}

// ─── Linha de coluna na lista expandida ──────────────────────────────────────
const ColumnRow = ({ col, onEditRequest }) => {
  const cfg = STATUS_CONFIG[col.status] || STATUS_CONFIG.ok
  const issues = []
  if (col.pct_missing > 0)    issues.push(`${col.pct_missing}% em branco`)
  if (col.outlier_count > 0)  issues.push(`${col.outlier_count} valor${col.outlier_count > 1 ? 'es' : ''} fora do padrão`)
  if (col.zero_variance)      issues.push('variância zero')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <StatusDot status={col.status} />
      <span style={{ flex: 1, fontSize: 11, color: col.status === 'ok' ? '#a8a29e' : '#e7e5e4', fontWeight: col.status !== 'ok' ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {col.name}
      </span>
      <span style={{ fontSize: 10, color: '#78716c', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {col.pct_valid}% válidos
      </span>
      {issues.length > 0 && (
        <span style={{ fontSize: 9, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
          {issues.join(' · ')}
        </span>
      )}
      {onEditRequest && col.status !== 'ok' && (
        <button
          onClick={e => { e.stopPropagation(); onEditRequest(col.name) }}
          style={{ fontSize: 9, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', flexShrink: 0 }}
        >
          Resolver
        </button>
      )}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
const DataQualityBanner = ({ dataQuality, onEditRequest }) => {
  const [expanded, setExpanded] = useState(false)

  if (!dataQuality) return null
  const { columns = [], summary = {} } = dataQuality
  const { overall_status = 'ok', total_rows = 0, rows_with_issues = 0, duplicate_rows = 0, cols_critical = 0, cols_warning = 0, cols_ok = 0 } = summary

  const cfg = STATUS_CONFIG[overall_status] || STATUS_CONFIG.ok
  const problemCols = columns.filter(c => c.status !== 'ok')

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        marginBottom: 28,
        overflow: 'hidden',
      }}
    >
      {/* Header do banner */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
        }}
      >
        {/* Ícone de status */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `rgba(${overall_status === 'ok' ? '16,185,129' : overall_status === 'warning' ? '245,158,11' : '239,68,68'},0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: cfg.color }}>{cfg.icon}</span>
        </div>

        {/* Texto central */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#78716c' }}>
            {total_rows} linha{total_rows !== 1 ? 's' : ''} ·{' '}
            {rows_with_issues > 0 ? `${rows_with_issues} com campos em branco · ` : ''}
            {duplicate_rows > 0 ? `${duplicate_rows} duplicadas · ` : ''}
            {cols_critical > 0 && <span style={{ color: '#ef4444' }}>{cols_critical} campo{cols_critical > 1 ? 's' : ''} crítico{cols_critical > 1 ? 's' : ''} · </span>}
            {cols_warning > 0  && <span style={{ color: '#f59e0b' }}>{cols_warning} precisando de revisão · </span>}
            {cols_ok} sem problemas
          </p>
        </div>

        {/* Pastilhas de contagem rápida */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          {cols_ok > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '3px 9px' }}>
              🟢 {cols_ok}
            </span>
          )}
          {cols_warning > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '3px 9px' }}>
              🟡 {cols_warning}
            </span>
          )}
          {cols_critical > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, padding: '3px 9px' }}>
              🔴 {cols_critical}
            </span>
          )}
        </div>

        {/* Botão Corrigir dataset */}
        {onEditRequest && overall_status !== 'ok' && (
          <button
            onClick={e => { e.stopPropagation(); onEditRequest() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit_note</span>
            Revisar meu arquivo
          </button>
        )}

        {/* Chevron de expansão */}
        {problemCols.length > 0 && (
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 18, color: '#78716c', transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            expand_more
          </span>
        )}
      </button>

      {/* Lista expandida de colunas com problema */}
      <AnimatePresence>
        {expanded && problemCols.length > 0 && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div style={{ padding: '8px 20px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '8px 0 4px' }}>
                Campos com problemas detectados
              </p>
              {problemCols.map(col => <ColumnRow key={col.name} col={col} onEditRequest={onEditRequest} />)}

              {/* Linha com colunas ok (colapsada por padrão) */}
              {cols_ok > 0 && (
                <p style={{ fontSize: 9, color: '#57534e', margin: '10px 0 0' }}>
                  + {cols_ok} campo{cols_ok > 1 ? 's' : ''} sem problemas (não exibidos)
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default DataQualityBanner
