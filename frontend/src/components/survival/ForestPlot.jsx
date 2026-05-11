import { useMemo, useRef } from 'react'
import './survival.css'

/**
 * Forest plot for Cox regression hazard ratios.
 * Adapted from the MetaAnalysis forest plot pattern.
 */
export default function ForestPlot({ coxResult, endpointLabel = 'Event' }) {
  const forestRef = useRef(null)

  const hazardRatios = coxResult?.hazard_ratios || []
  if (hazardRatios.length === 0) {
    return (
      <div className="sa-forest-card">
        <div className="sa-chart-title">
          <span className="sa-chart-title-icon">📈</span>
          Forest Plot — Hazard Ratios
        </div>
        <p className="text-[12px] text-text-muted italic" style={{ padding: 40, textAlign: 'center' }}>
          Nenhuma covariável disponível. Execute a análise com variáveis de grupo ou covariáveis adicionais.
        </p>
      </div>
    )
  }

  // Compute scale
  const allVals = []
  hazardRatios.forEach(hr => {
    if (hr.ci_lower != null) allVals.push(hr.ci_lower)
    if (hr.ci_upper != null) allVals.push(hr.ci_upper)
    if (hr.hr != null) allVals.push(hr.hr)
  })
  const dataMin = Math.min(...allVals, 0.5)
  const dataMax = Math.max(...allVals, 1.5)
  const pad = (dataMax - dataMin) * 0.15 || 0.3
  const scaleMin = Math.max(0, dataMin - pad)
  const scaleMax = dataMax + pad
  const nullValue = 1

  const svgW = 800
  const leftMargin = 160
  const rightMargin = 180
  const plotLeft = leftMargin
  const plotRight = svgW - rightMargin
  const plotWidth = plotRight - plotLeft

  const toX = (v) => {
    const ratio = (v - scaleMin) / (scaleMax - scaleMin)
    return plotLeft + ratio * plotWidth
  }

  const rowH = Math.min(32, Math.max(20, 300 / hazardRatios.length))
  const topPad = 48
  const bottomPad = 60
  const svgH = topPad + hazardRatios.length * rowH + bottomPad

  function exportForestPng() {
    if (!forestRef.current) return
    const svgEl = forestRef.current.querySelector('svg')
    if (!svgEl) return

    const clone = svgEl.cloneNode(true)
    const colorMap = {
      'rgba(255,255,255,0.35)': 'rgba(0,0,0,0.5)',
      'rgba(255,255,255,0.08)': 'rgba(0,0,0,0.1)',
    }

    clone.querySelectorAll('*').forEach(el => {
      const stroke = el.getAttribute('stroke')
      if (stroke && colorMap[stroke]) el.setAttribute('stroke', colorMap[stroke])
      const fill = el.getAttribute('fill')
      if (fill && colorMap[fill]) el.setAttribute('fill', colorMap[fill])
    })

    clone.querySelectorAll('rect[fill="#5eead4"], polygon[fill="#5eead4"]').forEach(el => {
      el.setAttribute('fill', '#059669')
    })
    clone.querySelectorAll('rect[fill="#ef4444"], polygon[fill="#ef4444"]').forEach(el => {
      el.setAttribute('fill', '#dc2626')
    })

    clone.querySelectorAll('[filter]').forEach(el => el.removeAttribute('filter'))

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    style.textContent = `
      text { fill: #1e293b !important; font-family: Arial, Helvetica, sans-serif !important; }
      .fill-muted { fill: #64748b !important; }
    `
    clone.insertBefore(style, clone.firstChild)

    const svgData = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const scale = 3
      const plotW = 800
      const plotH = svgH
      const footerH = 40
      const canvas = document.createElement('canvas')
      canvas.width = plotW * scale
      canvas.height = (plotH + footerH) * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, plotW, plotH)
      URL.revokeObjectURL(url)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '12px Arial, Helvetica, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Feito com PaperMetrics ©', plotW / 2, plotH + 26)
      const link = document.createElement('a')
      link.download = `forest_plot_cox_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = url
  }

  return (
    <div className="sa-forest-card" ref={forestRef}>
      <div className="sa-chart-header">
<div className="sa-chart-title">
            <span className="sa-chart-title-icon">&#x1F4C8;</span>
            Forest Plot — Hazard Ratios (Modelo de Cox)
        </div>
        <button
          onClick={exportForestPng}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[10px] font-semibold hover:bg-primary/20 transition-all"
        >
          <span className="material-symbols-rounded text-[14px]">download</span>
          PNG
        </button>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="sa-forest-svg" role="img" aria-label={`Forest plot com ${hazardRatios.length} hazard ratios do modelo de Cox`} focusable="false">
        <title>Forest Plot — Hazard Ratios</title>
        <desc>Diamantes representam hazard ratios pontuais, linhas horizontais os intervalos de confiança de 95%. Linha tracejada vertical em HR=1.00 indica ausência de efeito.</desc>
        <defs>
          <filter id="glow-forest" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Header */}
        <text x={plotLeft - 10} y={topPad - 22} textAnchor="end" fill="#a8a29e" fontSize="9" fontWeight="700" fontFamily="var(--font-sans)">COVARIÁVEL</text>
        <text x={plotLeft + plotWidth / 2} y={topPad - 22} textAnchor="middle" fill="#a8a29e" fontSize="9" fontWeight="700" fontFamily="var(--font-sans)">HR (IC 95%)</text>
        <text x={svgW - rightMargin + 10} y={topPad - 22} textAnchor="start" fill="#a8a29e" fontSize="9" fontWeight="700" fontFamily="var(--font-sans)">P-valor</text>

        {/* Null line */}
        <line
          x1={toX(nullValue)}
          y1={topPad - 8}
          x2={toX(nullValue)}
          y2={topPad + hazardRatios.length * rowH + 8}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="4 3"
          strokeWidth="1"
        />
        <text
          x={toX(nullValue)}
          y={topPad + hazardRatios.length * rowH + 24}
          textAnchor="middle"
          fill="#a8a29e"
          fontSize="9"
          fontFamily="var(--font-mono)"
        >1.00</text>

        {/* Axis ticks */}
        {(() => {
          const range = scaleMax - scaleMin
          const step = Math.pow(10, Math.floor(Math.log10(range)))
          const ticks = []
          let t = Math.ceil(scaleMin / step) * step
          while (t <= scaleMax) {
            ticks.push(parseFloat(t.toFixed(4)))
            t += step
          }
          return ticks.map(tick => (
            <g key={`tick-${tick}`}>
              <line
                x1={toX(tick)}
                y1={topPad + hazardRatios.length * rowH + 4}
                x2={toX(tick)}
                y2={topPad + hazardRatios.length * rowH + 9}
                stroke="rgba(255,255,255,0.1)"
              />
              <text
                x={toX(tick)}
                y={topPad + hazardRatios.length * rowH + 24}
                textAnchor="middle"
                fill="#a8a29e"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >{tick.toFixed(2)}</text>
            </g>
          ))
        })()}

        {/* Study rows */}
        {hazardRatios.map((hr, i) => {
          const y = topPad + i * rowH + rowH / 2
          const ciLowX = toX(hr.hr_ci_lower != null ? hr.hr_ci_lower : scaleMin)
          const ciHighX = toX(hr.hr_ci_upper != null ? hr.hr_ci_upper : scaleMax)
          const hrX = toX(hr.hr != null ? hr.hr : nullValue)
          const sigColor = hr.p_value != null && hr.p_value < 0.05 ? '#5eead4' : 'rgba(255,255,255,0.3)'
          const isSig = hr.significance && hr.significance !== ''
          const markerSize = Math.max(4, Math.min(12, 2 + 8 * (i + 1) / hazardRatios.length))

          return (
            <g key={hr.variable || i}>
              {/* Alternating row bg */}
              <rect x="0" y={topPad + i * rowH} width={svgW} height={rowH} fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'} />

              {/* Variable name */}
              <text x={plotLeft - 10} y={y + 4} textAnchor="end" fill={isSig ? '#5eead4' : '#a8a29e'} fontSize="10" fontWeight="600" fontFamily="var(--font-sans)">
                {hr.variable}
              </text>

              {/* CI line */}
              <line x1={ciLowX} y1={y} x2={ciHighX} y2={y} stroke={sigColor} strokeWidth="1.5" />

              {/* CI whiskers */}
              <line x1={ciLowX} y1={y - 3} x2={ciLowX} y2={y + 3} stroke={sigColor} strokeWidth="1" />
              <line x1={ciHighX} y1={y - 3} x2={ciHighX} y2={y + 3} stroke={sigColor} strokeWidth="1" />

              {/* HR diamond */}
              <polygon
                points={`${hrX},${y - markerSize} ${hrX + markerSize},${y} ${hrX},${y + markerSize} ${hrX - markerSize},${y}`}
                fill={isSig ? '#5eead4' : 'rgba(255,255,255,0.2)'}
                stroke={isSig ? '#134e4a' : 'rgba(255,255,255,0.15)'}
                strokeWidth="1"
              />

              {/* HR value */}
              <text x={plotRight + 10} y={y + 4} textAnchor="start" fill={isSig ? '#5eead4' : '#a8a29e'} fontSize="10" fontFamily="var(--font-mono)">
                {hr.hr?.toFixed?.(2) || '—'} [{hr.hr_ci_lower?.toFixed?.(2) || ''}–{hr.hr_ci_upper?.toFixed?.(2) || ''}]
              </text>

              {/* P-value */}
              <text x={svgW - 10} y={y + 4} textAnchor="end" fill={hr.p_value != null && hr.p_value < 0.05 ? '#fbbf24' : '#a8a29e'} fontSize="9" fontFamily="var(--font-mono)">
                {hr.p_value != null ? (hr.p_value < 0.001 ? '<0.001' : hr.p_value.toFixed(3)) : '—'}
              </text>
            </g>
          )
        })}

        {/* Scale label */}
        <text x={plotLeft + plotWidth / 2} y={svgH - 8} textAnchor="middle" fill="#a8a29e" fontSize="9" fontFamily="var(--font-sans)">
          Hazard Ratio (Escala Log)
        </text>
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-[10px] text-text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block w-12 h-0.5" style={{ background: 'rgba(255,255,255,0.35)' }}></span>
          Intervalo de Confiança 95%
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rotate-45" style={{ background: '#5eead4' }}></span>
          HR significante (p&lt;0.05)
        </div>
      </div>
    </div>
  )
}