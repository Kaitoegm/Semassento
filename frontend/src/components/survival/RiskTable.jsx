import './survival.css'

/**
 * Number at Risk table displayed below the KM curve.
 */
export default function RiskTable({ data, groups, groupColors, maxTime }) {
  if (!data || data.length === 0) return null

  // Determine time points for the table (quarterly or based on data)
  const timePoints = []
  const step = Math.max(1, Math.ceil((maxTime || 36) / 8))
  for (let t = 0; t <= (maxTime || 36); t += step) {
    timePoints.push(t)
  }
  if (timePoints[timePoints.length - 1] < (maxTime || 36)) {
    timePoints.push(maxTime || 36)
  }

  function getAtRisk(kmCurve, t, kmData) {
    // Find the number at risk at time t
    // N(t) = N * S(t-) approximately, but we use the at-risk count from data
    if (!kmCurve || kmCurve.length === 0) return '—'
    // Back-calculate from survival: atRisk ≈ nTotal * survival at that point
    // Use the closest point before or at t
    let closest = kmCurve[0]
    for (const pt of kmCurve) {
      if (pt.time <= t) closest = pt
      else break
    }
    // Use n from the curve data (total subjects in this group)
    const nTotal = kmData?.n || null
    if (nTotal !== null) {
      return Math.round(nTotal * closest.survival)
    }
    return '—'
  }

  return (
    <div className="sa-risk-table-card">
      <div className="sa-chart-title">
        <span className="sa-chart-title-icon">&#x1F4CA;</span>
        Number at Risk
      </div>
      <table className="sa-risk-table" aria-label="Tabela de número em risco por intervalo de tempo">
        <thead>
          <tr>
            <th>Time</th>
            {groups.map((g, i) => (
              <th key={g.name} style={{ color: groupColors?.[i] || 'var(--text-main)' }}>
                {g.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timePoints.map((t) => (
            <tr key={`t-${t}`}>
              <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{t}</td>
              {data.map((kd, i) => {
                const n = getAtRisk(kd.curve, t, kd)
                return (
                  <td key={`r-${i}-${t}`} className="mono" style={{ fontFamily: 'var(--font-mono)' }}>
                    {n}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}