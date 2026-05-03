import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Papa from 'papaparse'

// ── Constants ────────────────────────────────────────────────────────────────
const ROWS_PER_PAGE = 50

const PROB = {
  missing:       { bg: 'rgba(239,68,68,0.15)',  border: '#ef4444', text: '#ef4444', label: 'Em branco' },
  outlier:       { bg: 'rgba(245,158,11,0.13)', border: '#f59e0b', text: '#f59e0b', label: 'Fora do padrão' },
  duplicate:     { bg: 'rgba(139,92,246,0.13)', border: '#8b5cf6', text: '#8b5cf6', label: 'Duplicado' },
  zero_variance: { bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', text: '#ef4444', label: 'Constante' },
}

// ── Utility: compute per-column numeric stats ─────────────────────────────────
function computeColStats(rows, colName) {
  const vals = []
  rows.forEach(r => {
    const raw = r[colName]
    if (raw === null || raw === undefined || String(raw).trim() === '') return
    const n = parseFloat(String(raw).replace(',', '.'))
    if (!isNaN(n)) vals.push(n)
  })
  if (!vals.length) return null
  const sorted = [...vals].sort((a, b) => a - b)
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  const freq = {}
  vals.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  const mode = parseFloat(Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0])
  const variance = vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / vals.length
  return { mean, median, mode, std: Math.sqrt(variance), n: vals.length }
}

// ── Utility: detect cell-level problems ──────────────────────────────────────
export function detectCellProblems(rows, dataQuality) {
  const problems = {}
  if (!dataQuality?.columns || !rows?.length) return problems

  // Duplicate rows
  const sigs = rows.map(r => JSON.stringify(r))
  const sigCount = {}
  sigs.forEach(s => { sigCount[s] = (sigCount[s] || 0) + 1 })
  rows.forEach((_, i) => {
    if (sigCount[sigs[i]] > 1) {
      const key = `${i}:__row__`
      if (!problems[key]) problems[key] = []
      problems[key].push({ type: 'duplicate' })
    }
  })

  for (const col of dataQuality.columns) {
    if (col.status === 'ok') continue
    const name = col.name

    // Missing
    if (col.pct_missing > 0) {
      rows.forEach((row, i) => {
        const v = row[name]
        if (v === null || v === undefined || String(v).trim() === '') {
          const key = `${i}:${name}`
          if (!problems[key]) problems[key] = []
          problems[key].push({ type: 'missing' })
        }
      })
    }

    // Outliers
    if (col.outlier_count > 0 && col.type === 'contínua') {
      const stats = computeColStats(rows, name)
      if (stats && stats.std > 1e-9) {
        rows.forEach((row, i) => {
          const n = parseFloat(String(row[name] ?? '').replace(',', '.'))
          if (!isNaN(n) && Math.abs((n - stats.mean) / stats.std) > 3) {
            const key = `${i}:${name}`
            if (!problems[key]) problems[key] = []
            problems[key].push({ type: 'outlier', z: Math.abs((n - stats.mean) / stats.std).toFixed(1), value: n, mean: stats.mean, std: stats.std })
          }
        })
      }
    }
  }
  return problems
}

// ── Utility: recalculate dataQuality locally after edits ─────────────────────
export function recalcDataQuality(rows, originalQuality) {
  if (!originalQuality?.columns) return originalQuality
  const total = rows.length
  if (!total) return originalQuality

  const cols = originalQuality.columns.map(colMeta => {
    const name = colMeta.name
    const nMissing = rows.filter(r => {
      const v = r[name]
      return v === null || v === undefined || String(v).trim() === ''
    }).length
    const pctMissing = Math.round(nMissing / total * 1000) / 10

    let outlierCount = 0, outlierPct = 0, zeroVariance = false
    if (colMeta.type === 'contínua') {
      const stats = computeColStats(rows, name)
      if (stats) {
        zeroVariance = stats.std < 1e-9
        if (!zeroVariance) {
          const nonNull = rows.filter(r => { const v = r[name]; return !(v === null || v === undefined || String(v).trim() === '') })
          rows.forEach(r => {
            const v = parseFloat(String(r[name] ?? '').replace(',', '.'))
            if (!isNaN(v) && Math.abs((v - stats.mean) / stats.std) > 3) outlierCount++
          })
          outlierPct = nonNull.length > 0 ? Math.round(outlierCount / nonNull.length * 1000) / 10 : 0
        }
      }
    }

    let status = 'ok'
    if (pctMissing > 30 || (colMeta.type === 'contínua' && zeroVariance) || outlierPct > 15) status = 'critical'
    else if (pctMissing > 10 || outlierPct > 5) status = 'warning'

    return { ...colMeta, pct_missing: pctMissing, n_missing: nMissing, pct_valid: Math.round((100 - pctMissing) * 10) / 10, outlier_count: outlierCount, outlier_pct: outlierPct, zero_variance: zeroVariance, status }
  })

  const cCrit = cols.filter(c => c.status === 'critical').length
  const cWarn = cols.filter(c => c.status === 'warning').length
  const sigs = rows.map(r => JSON.stringify(r))
  const sigCnt = {}
  sigs.forEach(s => { sigCnt[s] = (sigCnt[s] || 0) + 1 })

  return {
    columns: cols,
    summary: {
      overall_status: cCrit > 0 ? 'critical' : cWarn > 0 ? 'warning' : 'ok',
      total_rows: total,
      rows_with_issues: rows.filter(r => cols.some(c => { const v = r[c.name]; return v === null || v === undefined || String(v).trim() === '' })).length,
      duplicate_rows: sigs.filter(s => sigCnt[s] > 1).length,
      cols_critical: cCrit,
      cols_warning: cWarn,
      cols_ok: cols.length - cCrit - cWarn,
    }
  }
}

// ── ToastUndo ────────────────────────────────────────────────────────────────
function ToastUndo({ message, onUndo, onDismiss }) {
  const [secs, setSecs] = useState(5)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => { if (s <= 1) { clearInterval(t); onDismiss(); return 0 } return s - 1 }), 1000)
    return () => clearInterval(t)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
      style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10010, background: '#1c1917', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', minWidth: 340 }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#10b981' }}>check_circle</span>
      <span style={{ flex: 1, fontSize: 12, color: '#e7e5e4' }}>{message}</span>
      <button onClick={onUndo} style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
        Desfazer ({secs}s)
      </button>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#57534e', lineHeight: 0 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
      </button>
    </motion.div>
  )
}

// ── ProblemsNav (sidebar) ─────────────────────────────────────────────────────
function ProblemsNav({ cellProblems, columns, currentPage, onJumpTo }) {
  const items = useMemo(() => {
    const list = []
    Object.entries(cellProblems).forEach(([key, probs]) => {
      const [rowIdxStr, colName] = key.split(':')
      if (colName === '__row__') return
      const rowIdx = parseInt(rowIdxStr)
      probs.forEach(p => {
        list.push({ rowIdx, colName, type: p.type, key, page: Math.floor(rowIdx / ROWS_PER_PAGE) + 1 })
      })
    })
    return list.sort((a, b) => a.rowIdx - b.rowIdx)
  }, [cellProblems])

  if (!items.length) return (
    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
      <span className="material-symbols-rounded" style={{ fontSize: 32, color: '#10b981' }}>check_circle</span>
      <p style={{ fontSize: 11, color: '#78716c', marginTop: 8 }}>Nenhum problema detectado</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 16px 4px' }}>
        {items.length} problema{items.length !== 1 ? 's' : ''}
      </p>
      {items.map((item, i) => {
        const cfg = PROB[item.type] || PROB.missing
        const isActive = currentPage === item.page
        return (
          <button
            key={i}
            onClick={() => onJumpTo(item.rowIdx, item.colName)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: isActive ? 'rgba(255,255,255,0.04)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.text, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 10, color: '#e7e5e4', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.colName}</p>
              <p style={{ margin: 0, fontSize: 9, color: '#78716c' }}>Participante {item.rowIdx + 1} · {cfg.label}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── ColumnHeaderMenu ──────────────────────────────────────────────────────────
function ColumnHeaderMenu({ colName, colMeta, onBulkAction, onClose }) {
  const isContinuous = colMeta?.type === 'contínua'
  const hasMissing = (colMeta?.pct_missing ?? 0) > 0
  const hasOutliers = (colMeta?.outlier_count ?? 0) > 0

  return (
    <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 9999, background: '#1c1917', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '6px 0', minWidth: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {hasMissing && isContinuous && (
        <>
          <MenuSection label="Campos em branco" />
          <MenuItem label="Preencher campos em branco com a média" icon="avg_pace" onClick={() => { onBulkAction('fill_mean', colName); onClose() }} />
          <MenuItem label="Preencher campos em branco com a mediana" icon="align_center" onClick={() => { onBulkAction('fill_median', colName); onClose() }} />
          <MenuItem label="Preencher campos em branco com o valor mais comum" icon="bar_chart_4_bars" onClick={() => { onBulkAction('fill_mode', colName); onClose() }} />
          <MenuItem label="Remover participantes com este campo em branco" icon="delete_sweep" danger onClick={() => { onBulkAction('remove_missing', colName); onClose() }} />
        </>
      )}
      {hasMissing && !isContinuous && (
        <>
          <MenuSection label="Campos em branco" />
          <MenuItem label="Preencher campos em branco com o valor mais comum" icon="bar_chart_4_bars" onClick={() => { onBulkAction('fill_mode', colName); onClose() }} />
          <MenuItem label="Remover participantes com este campo em branco" icon="delete_sweep" danger onClick={() => { onBulkAction('remove_missing', colName); onClose() }} />
        </>
      )}
      {hasOutliers && (
        <>
          <MenuSection label="Valores fora do padrão" />
          <MenuItem label="Substituir valores fora do padrão pela mediana" icon="align_center" onClick={() => { onBulkAction('outlier_to_median', colName); onClose() }} />
          <MenuItem label="Remover participantes com valores fora do padrão" icon="delete_sweep" danger onClick={() => { onBulkAction('remove_outliers', colName); onClose() }} />
        </>
      )}
    </div>
  )
}

function MenuSection({ label }) {
  return <p style={{ margin: '4px 0 2px', padding: '2px 14px', fontSize: 9, fontWeight: 700, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
}

function MenuItem({ label, icon, danger, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', background: hov ? 'rgba(255,255,255,0.05)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <span className="material-symbols-rounded" style={{ fontSize: 14, color: danger ? '#ef4444' : '#78716c' }}>{icon}</span>
      <span style={{ fontSize: 11, color: danger ? '#ef4444' : '#e7e5e4' }}>{label}</span>
    </button>
  )
}

// ── EditorCell ────────────────────────────────────────────────────────────────
function EditorCell({ value, problems, isEditing, editMode, colName, rowIdx, onStartEdit, onCommit }) {
  const [draft, setDraft] = useState(String(value ?? ''))
  const inputRef = useRef(null)

  useEffect(() => { if (isEditing && inputRef.current) inputRef.current.focus() }, [isEditing])
  useEffect(() => { setDraft(String(value ?? '')) }, [value])

  const topProblem = problems?.[0]
  const cfg = topProblem ? (PROB[topProblem.type] || PROB.missing) : null
  const isEmpty = value === null || value === undefined || String(value).trim() === ''
  const canEdit = editMode === 'all' || (editMode === 'problems' && topProblem)

  const cellStyle = {
    padding: '0 10px',
    height: 36,
    verticalAlign: 'middle',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    background: cfg ? cfg.bg : 'transparent',
    borderBottom: cfg ? `1px solid ${cfg.border}33` : '1px solid rgba(255,255,255,0.04)',
    cursor: canEdit ? 'pointer' : 'default',
    position: 'relative',
    minWidth: 120,
    maxWidth: 200,
    transition: 'background 0.15s',
  }

  const commit = () => onCommit(rowIdx, colName, draft)

  if (isEditing) {
    return (
      <td style={{ ...cellStyle, background: 'rgba(99,102,241,0.15)', border: '1px solid #6366f1', padding: 0 }}>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCommit(rowIdx, colName, value) }}
          style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#e7e5e4', fontSize: 11, padding: '0 10px', fontFamily: 'inherit' }}
        />
      </td>
    )
  }

  return (
    <td
      onClick={() => canEdit && onStartEdit(rowIdx, colName)}
      title={topProblem?.type === 'outlier' ? `Fora do padrão: z=${topProblem.z} (média ${Number(topProblem.mean).toFixed(2)})` : undefined}
      style={cellStyle}
    >
      {isEmpty
        ? <span style={{ fontSize: 10, color: '#57534e', fontStyle: 'italic' }}>— vazio —</span>
        : <span style={{ fontSize: 11, color: cfg ? cfg.text : '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{String(value)}</span>
      }
      {topProblem?.type === 'missing' && <span className="material-symbols-rounded" style={{ fontSize: 10, color: '#ef4444', position: 'absolute', top: 4, right: 4 }}>error</span>}
      {topProblem?.type === 'outlier' && <span className="material-symbols-rounded" style={{ fontSize: 10, color: '#f59e0b', position: 'absolute', top: 4, right: 4 }}>warning</span>}
    </td>
  )
}

// ── EditorTable ───────────────────────────────────────────────────────────────
function EditorTable({ rows, columns, cellProblems, dataQuality, editingCell, editMode, page, highlightCell, onStartEdit, onCommit, onBulkAction }) {
  const [openMenu, setOpenMenu] = useState(null)
  const highlightRef = useRef(null)
  const pageRows = rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)
  const startIdx = (page - 1) * ROWS_PER_PAGE

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }, [highlightCell])

  const getColMeta = name => dataQuality?.columns?.find(c => c.name === name)

  const STATUS_DOT = { ok: '#10b981', warning: '#f59e0b', critical: '#ef4444' }

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#0c0a09' }} onClick={() => setOpenMenu(null)}>
      <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
          <tr>
            <th style={{ width: 52, minWidth: 52, background: '#161412', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 10px', height: 40, textAlign: 'center', fontSize: 9, color: '#57534e', fontWeight: 700, borderRight: '1px solid rgba(255,255,255,0.06)' }}>#</th>
            {columns.map(col => {
              const meta = getColMeta(col)
              const dotColor = STATUS_DOT[meta?.status ?? 'ok']
              const hasProblem = meta && meta.status !== 'ok'
              return (
                <th key={col} style={{ background: '#161412', borderBottom: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '0 10px', height: 40, whiteSpace: 'nowrap', position: 'relative', minWidth: 120, maxWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#e7e5e4', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col}</span>
                    {hasProblem && (
                      <button
                        onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === col ? null : col) }}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', color: '#818cf8', padding: '4px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        Corrigir automaticamente
                        <span className="material-symbols-rounded" style={{ fontSize: 12 }}>expand_more</span>
                      </button>
                    )}
                    {openMenu === col && (
                      <ColumnHeaderMenu colName={col} colMeta={meta} onBulkAction={onBulkAction} onClose={() => setOpenMenu(null)} />
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, pageRowIdx) => {
            const absIdx = startIdx + pageRowIdx
            const isDupe = !!(cellProblems[`${absIdx}:__row__`]?.length)
            const isHighlighted = highlightCell?.rowIdx === absIdx
            return (
              <tr
                key={absIdx}
                ref={isHighlighted ? highlightRef : null}
                style={{ background: isDupe ? 'rgba(139,92,246,0.06)' : isHighlighted ? 'rgba(99,102,241,0.08)' : 'transparent', outline: isHighlighted ? '1px solid rgba(99,102,241,0.4)' : 'none' }}
              >
                <td style={{ textAlign: 'center', fontSize: 9, color: isDupe ? '#8b5cf6' : '#44403c', borderRight: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0 10px', height: 36, fontVariantNumeric: 'tabular-nums' }}>
                  {isDupe && <span className="material-symbols-rounded" style={{ fontSize: 9, color: '#8b5cf6', verticalAlign: 'middle', marginRight: 2 }}>content_copy</span>}
                  {absIdx + 1}
                </td>
                {columns.map(col => {
                  const key = `${absIdx}:${col}`
                  const isEditing = editingCell?.rowIdx === absIdx && editingCell?.colName === col
                  return (
                    <EditorCell
                      key={col}
                      value={row[col]}
                      problems={cellProblems[key]}
                      isEditing={isEditing}
                      editMode={editMode}
                      colName={col}
                      rowIdx={absIdx}
                      onStartEdit={onStartEdit}
                      onCommit={onCommit}
                    />
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── DatasetEditorModal (main) ─────────────────────────────────────────────────
function DatasetEditorModal({ isOpen, pendingFile, dataQuality, focusColumn, onSave, onClose }) {
  const [rows, setRows] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState(null)
  const [editMode, setEditMode] = useState('problems')
  const [page, setPage] = useState(1)
  const [highlightCell, setHighlightCell] = useState(null)
  const [toast, setToast] = useState(null)
  const [undoRows, setUndoRows] = useState(null)
  const [hasEdits, setHasEdits] = useState(false)

  const cellProblems = useMemo(() => detectCellProblems(rows, dataQuality), [rows, dataQuality])
  const totalProblems = Object.keys(cellProblems).filter(k => !k.endsWith(':__row__')).length
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE))

  // Parse file on open
  useEffect(() => {
    if (!isOpen || !pendingFile) return
    setLoading(true)
    Papa.parse(pendingFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: res => {
        setRows(res.data)
        setColumns(res.meta.fields || [])
        setLoading(false)
        // Jump to focusColumn if provided
        if (focusColumn) {
          const firstProblemRow = Object.keys(detectCellProblems(res.data, dataQuality))
            .filter(k => k.endsWith(`:${focusColumn}`))
            .map(k => parseInt(k.split(':')[0]))
            .sort((a, b) => a - b)[0]
          if (firstProblemRow !== undefined) {
            const p = Math.floor(firstProblemRow / ROWS_PER_PAGE) + 1
            setPage(p)
            setHighlightCell({ rowIdx: firstProblemRow, colName: focusColumn })
          }
        }
      }
    })
  }, [isOpen, pendingFile])

  const handleJumpTo = useCallback((rowIdx, colName) => {
    const p = Math.floor(rowIdx / ROWS_PER_PAGE) + 1
    setPage(p)
    setHighlightCell({ rowIdx, colName })
    setTimeout(() => setHighlightCell(null), 2500)
  }, [])

  const handleCommit = useCallback((rowIdx, colName, newVal) => {
    setRows(prev => {
      const next = [...prev]
      next[rowIdx] = { ...next[rowIdx], [colName]: newVal }
      return next
    })
    setEditingCell(null)
    setHasEdits(true)
  }, [])

  const handleBulkAction = useCallback((action, colName) => {
    const prevRows = rows
    let nextRows = [...rows]
    const stats = computeColStats(rows, colName)

    if (action === 'fill_mean' && stats) {
      nextRows = nextRows.map(r => {
        const v = r[colName]
        return (v === null || v === undefined || String(v).trim() === '') ? { ...r, [colName]: stats.mean.toFixed(4) } : r
      })
    } else if (action === 'fill_median' && stats) {
      nextRows = nextRows.map(r => {
        const v = r[colName]
        return (v === null || v === undefined || String(v).trim() === '') ? { ...r, [colName]: stats.median.toFixed(4) } : r
      })
    } else if (action === 'fill_mode' && stats) {
      nextRows = nextRows.map(r => {
        const v = r[colName]
        return (v === null || v === undefined || String(v).trim() === '') ? { ...r, [colName]: String(stats.mode) } : r
      })
    } else if (action === 'remove_missing') {
      nextRows = nextRows.filter(r => { const v = r[colName]; return !(v === null || v === undefined || String(v).trim() === '') })
    } else if (action === 'outlier_to_median' && stats) {
      nextRows = nextRows.map(r => {
        const n = parseFloat(String(r[colName] ?? '').replace(',', '.'))
        if (!isNaN(n) && stats.std > 1e-9 && Math.abs((n - stats.mean) / stats.std) > 3) {
          return { ...r, [colName]: stats.median.toFixed(4) }
        }
        return r
      })
    } else if (action === 'remove_outliers' && stats) {
      nextRows = nextRows.filter(r => {
        const n = parseFloat(String(r[colName] ?? '').replace(',', '.'))
        return isNaN(n) || stats.std <= 1e-9 || Math.abs((n - stats.mean) / stats.std) <= 3
      })
    }

    const changed = nextRows.filter((r, i) => JSON.stringify(r) !== JSON.stringify(rows[i])).length
    setRows(nextRows)
    setHasEdits(true)
    setUndoRows(prevRows)
    setToast({ message: `${changed} célula(s) corrigida(s) em "${colName}". Desfazer?` })
  }, [rows])

  const handleUndo = useCallback(() => {
    if (undoRows) { setRows(undoRows); setUndoRows(null); setToast(null) }
  }, [undoRows])

  const handleSave = useCallback(() => {
    const csv = Papa.unparse(rows, { columns })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const correctedFile = new File([blob], pendingFile?.name || 'dataset_corrigido.csv', { type: 'text/csv' })
    const newQuality = recalcDataQuality(rows, dataQuality)
    onSave(correctedFile, newQuality)
  }, [rows, columns, pendingFile, dataQuality, onSave])

  const handleDownload = useCallback(() => {
    const csv = Papa.unparse(rows, { columns })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dataset_corrigido_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }, [rows, columns])

  const handleClose = useCallback(() => {
    if (hasEdits && !window.confirm('Você tem edições não salvas. Descartar?')) return
    onClose()
  }, [hasEdits, onClose])

  if (!isOpen) return null

  const solvedCount = totalProblems === 0 && hasEdits

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: '3%', zIndex: 9999, background: '#161412', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
          >
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#818cf8' }}>edit_note</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e7e5e4' }}>Revisão do Arquivo</p>
                <p style={{ margin: 0, fontSize: 10, color: '#78716c' }}>
                  {rows.length} participantes · {columns.length} campos · {totalProblems} problema{totalProblems !== 1 ? 's' : ''} detectado{totalProblems !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Edit mode toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 3 }}>
                {[['problems', 'Só problemáticas'], ['all', 'Editar todas']].map(([mode, lbl]) => (
                  <button key={mode} onClick={() => setEditMode(mode)} style={{ fontSize: 10, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: editMode === mode ? '#292524' : 'transparent', color: editMode === mode ? '#e7e5e4' : '#78716c', transition: 'all 0.15s' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: '#a8a29e', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 14px', cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>download</span>
                Baixar CSV
              </button>

              <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#57534e', lineHeight: 0 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Sidebar */}
              <div style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', flexShrink: 0 }}>
                <ProblemsNav cellProblems={cellProblems} columns={columns} currentPage={page} onJumpTo={handleJumpTo} />
              </div>

              {/* Table area */}
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 32, color: '#818cf8', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  <p style={{ fontSize: 11, color: '#78716c' }}>Carregando arquivo...</p>
                </div>
              ) : (
                <EditorTable
                  rows={rows} columns={columns} cellProblems={cellProblems}
                  dataQuality={dataQuality} editingCell={editingCell}
                  editMode={editMode} page={page} highlightCell={highlightCell}
                  onStartEdit={(ri, cn) => setEditingCell({ rowIdx: ri, colName: cn })}
                  onCommit={handleCommit} onBulkAction={handleBulkAction}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {/* Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: '#a8a29e', opacity: page <= 1 ? 0.4 : 1 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_left</span>
                </button>
                <span style={{ fontSize: 10, color: '#78716c', minWidth: 80, textAlign: 'center' }}>Pág {page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 10px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: '#a8a29e', opacity: page >= totalPages ? 0.4 : 1 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              </div>

              <div style={{ flex: 1 }} />

              <button onClick={handleClose} style={{ fontSize: 11, fontWeight: 600, color: '#78716c', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 20px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSave} style={{ fontSize: 11, fontWeight: 700, color: '#000', background: hasEdits ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(16,185,129,0.3)', border: 'none', borderRadius: 10, padding: '9px 24px', cursor: hasEdits ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 15 }}>check</span>
                Aplicar correções
              </button>
            </div>
          </motion.div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <ToastUndo key="toast" message={toast.message} onUndo={handleUndo} onDismiss={() => setToast(null)} />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}

export default DatasetEditorModal

