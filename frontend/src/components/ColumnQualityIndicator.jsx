import React, { useState, useRef } from 'react'

// ─── Configuração dos níveis de status ───────────────────────────────────────
const STATUS_CONFIG = {
  ok:       { color: '#10b981', label: 'Dados em ordem', emoji: '🟢' },
  warning:  { color: '#f59e0b', label: 'Atenção',        emoji: '🟡' },
  critical: { color: '#ef4444', label: 'Crítico',        emoji: '🔴' },
}

/**
 * ColumnQualityIndicator
 *
 * Props:
 *   colQuality: { name, status, type, pct_missing, n_missing, pct_valid, outlier_pct, outlier_count, zero_variance }
 *   size: número (tamanho do dot em px, default 8)
 *
 * Renderiza um dot colorido com tooltip de detalhamento ao hover.
 * Projetado para ser inserido em cabeçalhos de tabela ou labels de coluna.
 */
const ColumnQualityIndicator = ({ colQuality, size = 9 }) => {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const dotRef = useRef(null)

  if (!colQuality) return null

  const { status = 'ok', type, pct_missing = 0, n_missing = 0, pct_valid = 100, outlier_count = 0, outlier_pct = 0, zero_variance = false } = colQuality
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.ok

  const issues = []
  if (pct_missing > 0)   issues.push({ icon: 'data_missing', text: `${pct_missing}% em branco (${n_missing} células)`, color: pct_missing > 30 ? '#ef4444' : '#f59e0b' })
  if (outlier_count > 0) issues.push({ icon: 'warning', text: `${outlier_count} valor${outlier_count > 1 ? 'es' : ''} fora do padrão via z-score (${outlier_pct}%)`, color: outlier_pct > 15 ? '#ef4444' : '#f59e0b' })
  if (zero_variance)     issues.push({ icon: 'commit', text: 'Variância zero — coluna constante', color: '#ef4444' })

  const handleEnter = () => {
    if (dotRef.current) {
      const rect = dotRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX })
    }
    setShow(true)
  }

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Dot clicável */}
      <span
        ref={dotRef}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        title={cfg.label}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: cfg.color,
          display: 'inline-block',
          cursor: 'default',
          flexShrink: 0,
          boxShadow: status !== 'ok' ? `0 0 6px ${cfg.color}55` : 'none',
          transition: 'box-shadow 0.2s',
        }}
      />

      {/* Tooltip flutuante */}
      {show && (
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: '#1c1917',
            border: `1px solid rgba(255,255,255,0.1)`,
            borderRadius: 10,
            padding: '10px 13px',
            minWidth: 210,
            maxWidth: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {/* Header do tooltip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
          </div>

          {/* Linha de tipo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10, color: '#78716c' }}>
            <span>Tipo de dado</span>
            <span style={{ color: '#a8a29e', fontWeight: 600 }}>{type || '—'}</span>
          </div>

          {/* Linha de completitude */}
          <div style={{ marginBottom: issues.length > 0 ? 8 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#78716c', marginBottom: 4 }}>
              <span>Completitude</span>
              <span style={{ color: pct_valid >= 90 ? '#10b981' : pct_valid >= 70 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                {pct_valid}%
              </span>
            </div>
            {/* Barra de completitude */}
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct_valid}%`,
                background: pct_valid >= 90 ? '#10b981' : pct_valid >= 70 ? '#f59e0b' : '#ef4444',
                borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>

          {/* Lista de problemas */}
          {issues.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {issues.map((issue, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 12, color: issue.color, marginTop: 1, flexShrink: 0 }}>
                    {issue.icon}
                  </span>
                  <span style={{ fontSize: 10, color: '#a8a29e', lineHeight: 1.4 }}>{issue.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé para ok */}
          {issues.length === 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 9, color: '#57534e' }}>
              Nenhum problema detectado neste campo.
            </p>
          )}
        </div>
      )}
    </span>
  )
}

export default ColumnQualityIndicator
