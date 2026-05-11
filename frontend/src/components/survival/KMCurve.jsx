import { useMemo } from 'react'
import './survival.css'

/**
 * Interactive Kaplan-Meier curve with CI bands and group toggles.
 * Expects kmData array from the backend response.
 */
export default function KMCurve({ kmData, groups, groupColors, hiddenGroups, onToggleGroup, maxTime }) {
  const W = 760
  const H = 380
  const PAD = { top: 20, right: 30, bottom: 50, left: 60 }

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const tMax = maxTime || Math.max(...(kmData.flatMap((d) => d.curve.map((p) => p.time))))
  const xScale = (t) => PAD.left + (t / tMax) * plotW
  const yScale = (s) => PAD.top + (1 - s) * plotH

  // Build step path with CI bands
  const buildPath = (curve) => {
    if (!curve || curve.length === 0) return ''
    let d = `M ${xScale(0)} ${yScale(1)}`
    for (const pt of curve) {
      d += ` H ${xScale(pt.time)} V ${yScale(pt.survival)}`
    }
    d += ` H ${xScale(tMax)}`
    return d
  }

  const buildCIArea = (curve) => {
    if (!curve || curve.length === 0) return ''
    // Upper bound
    let d = `M ${xScale(0)} ${yScale(1)}`
    for (const pt of curve) {
      d += ` H ${xScale(pt.time)} V ${yScale(pt.ci_upper || pt.survival)}`
    }
    // Lower bound (reverse)
    const reversed = [...curve].reverse()
    for (const pt of reversed) {
      d += ` H ${xScale(pt.time)} V ${yScale(pt.ci_lower || pt.survival)}`
    }
    d += ' Z'
    return d
  }

  const activeGroups = groups.filter((g) => !hiddenGroups.has(g.name))

  // Grid lines
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0]
  const xTicks = useMemo(() => {
    const step = Math.ceil(tMax / 6)
    const ticks = []
    for (let v = 0; v <= tMax; v += step) {
      ticks.push(v)
    }
    if (ticks[ticks.length - 1] < tMax) ticks.push(tMax)
    return ticks
  }, [tMax])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="sa-chart-svg"
      role="img"
      aria-label={`Curvas de sobrevivência Kaplan-Meier com ${kmData.length} grupo${kmData.length !== 1 ? 's' : ''}`}
      focusable="false"
    >
      <title>Curvas de Kaplan-Meier</title>
      <desc>Gráfico de sobrevivência step-function com intervalos de confiança de 95%</desc>
      {/* Grid */}
      {yTicks.map((v) => (
        <g key={`yg-${v}`}>
          <line
            x1={PAD.left}
            y1={yScale(v)}
            x2={W - PAD.right}
            y2={yScale(v)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={yScale(v) + 4}
            textAnchor="end"
            className="sa-axis-text"
            fill="#a8a29e"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {xTicks.map((v) => (
        <g key={`xg-${v}`}>
          <line
            x1={xScale(v)}
            y1={PAD.top}
            x2={xScale(v)}
            y2={H - PAD.bottom}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <text
            x={xScale(v)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            fill="#a8a29e"
            fontSize="10"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      <text
        x={PAD.left + plotW / 2}
        y={H - 6}
        textAnchor="middle"
        fill="#a8a29e"
        fontSize="11"
        fontWeight="600"
      >
        Tempo (meses)
      </text>
      <text
        x={14}
        y={PAD.top + plotH / 2}
        textAnchor="middle"
        fill="#a8a29e"
        fontSize="11"
        fontWeight="600"
        transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}
      >
        Sobrevivência
      </text>

      {/* CI bands */}
      {kmData.map((kd, i) => {
        const color = groupColors?.[i] || '#5eead4'
        return (
          <path
            key={`ci-${i}`}
            d={buildCIArea(kd.curve)}
            fill={color}
            opacity={0.08}
            stroke="none"
          />
        )
      })}

      {/* Step curves */}
      {kmData.map((kd, i) => {
        const color = groupColors?.[i] || '#5eead4'
        const hidden = hiddenGroups?.has(kd.name)
        if (hidden) return null
        return (
          <path
            key={`km-${i}`}
            d={buildPath(kd.curve)}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}

      {/* Censor ticks */}
      {kmData.map((kd, i) => {
        const color = groupColors?.[i] || '#5eead4'
        const hidden = hiddenGroups?.has(kd.name)
        if (hidden) return null
        return kd.curve
          .filter((pt) => pt.censored)
          .map((pt, j) => (
            <line
              key={`tick-${i}-${j}`}
              x1={xScale(pt.time)}
              y1={yScale(pt.survival) - 5}
              x2={xScale(pt.time)}
              y2={yScale(pt.survival) + 5}
              stroke={color}
              strokeWidth="2"
              opacity={0.6}
            />
          ))
      })}

      {/* Group end markers */}
      {kmData.map((kd, i) => {
        const color = groupColors?.[i] || '#5eead4'
        const hidden = hiddenGroups?.has(kd.name)
        if (hidden) return null
        const last = kd.curve[kd.curve.length - 1]
        if (!last) return null
        return (
          <circle
            key={`dot-${i}`}
            cx={xScale(last.time)}
            cy={yScale(last.survival)}
            r={3}
            fill={color}
            stroke="var(--surface)"
            strokeWidth={1.5}
          />
        )
      })}

      {/* Legend */}
      <g transform={`translate(${PAD.left}, 8)`}>
        {kmData.map((kd, i) => {
          const color = groupColors?.[i] || '#5eead4'
          const hidden = hiddenGroups?.has(kd.name)
          return (
            <g
              key={`leg-${i}`}
              transform={`translate(${i * 130}, 0)`}
              opacity={hidden ? 0.3 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => onToggleGroup && onToggleGroup(kd.name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleGroup && onToggleGroup(kd.name) } }}
              tabIndex={0}
              role="button"
              aria-pressed={!hidden}
              aria-label={`${hidden ? 'Mostrar' : 'Ocultar'} grupo ${kd.name}`}
            >
              <line x1="0" y1="0" x2="18" y2="0" stroke={color} strokeWidth="2.5" />
              <circle cx="9" cy="0" r="3" fill={color} stroke="var(--surface)" strokeWidth={1} />
              <text x="24" y="4" fill="var(--text-muted)" fontSize="10" fontWeight="600">
                {kd.name}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}