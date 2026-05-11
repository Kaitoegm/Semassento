import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfigPanel from './ConfigPanel'
import KMCurve from './KMCurve'
import RiskTable from './RiskTable'
import ResultsSummary from './ResultsSummary'
import ForestPlot from './ForestPlot'
import './survival.css'

const SURVIVAL_ICONS = {
  settings: <span className="material-symbols-rounded text-[18px]">science</span>,
  chart: <span className="material-symbols-rounded text-[22px]">insights</span>,
  export: <span className="material-symbols-rounded text-[18px]">download</span>,
  data: <span className="material-symbols-rounded text-[18px]">table_chart</span>,
}

const GROUP_COLORS = ['#5eead4', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa', '#34d399']

export default function SurvivalPage() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [config, setConfig] = useState(null)
  const [kmResult, setKmResult] = useState(null)
  const [survivalResult, setSurvivalResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hiddenGroups, setHiddenGroups] = useState(new Set())
  const [activeTab, setActiveTab] = useState('km')
  const [maxTime, setMaxTime] = useState(null)
  const [selectedTimeCol, setSelectedTimeCol] = useState('')
  const [selectedEventCol, setSelectedEventCol] = useState('')
  const [selectedGroupCol, setSelectedGroupCol] = useState('')
  const fileInputRef = useRef(null)

  function handleFileSelect(e) {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setFileName(f.name)
      setConfig(null)
      setKmResult(null)
      setSurvivalResult(null)
      setError(null)
      setHiddenGroups(new Set())
      setSelectedTimeCol('')
      setSelectedEventCol('')
      setSelectedGroupCol('')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) {
      setFile(f)
      setFileName(f.name)
      setConfig(null)
      setKmResult(null)
      setSurvivalResult(null)
      setError(null)
      setHiddenGroups(new Set())
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  const handleConfigDetected = useCallback((det) => {
    setConfig(det)
  }, [])

  async function handleAnalyze({ timeCol, eventCol, groupCol, sampleData }) {
    setLoading(true)
    setError(null)
    setSurvivalResult(null)
    setKmResult(null)

    try {
      if (sampleData) {
        // Use sample data directly
        await runAnalysis(sampleData.csv_data, timeCol, eventCol, groupCol)
      } else if (file) {
        await runAnalysis(file, timeCol, eventCol, groupCol)
      }
    } catch (err) {
      setError(err.message || 'Erro ao executar análise')
      setLoading(false)
    }
  }

  async function runAnalysis(fileOrCsv, timeCol, eventCol, groupCol) {
    let csvData
    let usedFileName

    if (typeof fileOrCsv === 'string') {
      csvData = fileOrCsv
      usedFileName = 'dados_exemplo.csv'
    } else {
      csvData = await fileOrCsv.text()
      usedFileName = fileOrCsv.name
    }

    // Create a File object for the API
    const blob = new Blob([csvData], { type: 'text/csv' })
    const csvFile = new File([blob], usedFileName, { type: 'text/csv' })

    setSelectedTimeCol(timeCol)
    setSelectedEventCol(eventCol)
    setSelectedGroupCol(groupCol || '')

    try {
      const { survivalAnalyze } = await import('../../api')
      const result = await survivalAnalyze({
        file: csvFile,
        timeCol,
        eventCol,
        groupCol: groupCol || null,
      })

      setSurvivalResult(result)

      // Transform KM data for the curve component
      const kmData = []

      if (result.km_curves) {
        if (result.km_curves.overall) {
          kmData.push({
            name: 'Geral',
            curve: result.km_curves.overall.curve || [],
          })
        }
        if (result.km_curves.groups) {
          result.km_curves.groups.forEach((g, i) => {
            kmData.push({
              name: g.name || `Grupo ${i + 1}`,
              curve: g.curve || [],
              n: g.n,
              events: g.events,
              censored: g.censored,
            })
          })
        }
      }

      // Find max time
      let computedMaxTime = 0
      kmData.forEach((kd) => {
        if (kd.curve && kd.curve.length > 0) {
          const max = Math.max(...kd.curve.map((p) => p.time))
          if (max > computedMaxTime) computedMaxTime = max
        }
      })
      setMaxTime(computedMaxTime || null)
      setKmData(kmData)
      setError(null)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Erro ao executar análise de sobrevivência')
    } finally {
      setLoading(false)
    }
  }

  const [kmData, setKmData] = useState([])

  function toggleGroup(name) {
    setHiddenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleExportCSV() {
    if (!survivalResult) return

    const headers = ['time', 'survival', 'ci_lower', 'ci_upper']
    const rows = []

    if (survivalResult.km_curves?.overall?.curve) {
      survivalResult.km_curves.overall.curve.forEach((pt) => {
        rows.push([pt.time, pt.survival, pt.ci_lower, pt.ci_upper].join(','))
      })
    }

    const csv = [headers.join(','), ...rows].join('\n')
    downloadBlob(csv, `km_curve_${Date.now()}.csv`, 'text/csv;charset=utf-8;')
  }

  function handleExportTXT() {
    if (!survivalResult) return

    let text = '=== Análise de Sobrevivência — Paper Metrics ===\n\n'

    if (survivalResult.descriptive) {
      text += '--- Estatísticas Descritivas ---\n'
      const d = survivalResult.descriptive
      if (d.n_total != null) {
        text += `Pacientes totais: ${d.n_total}\n`
        text += `Eventos: ${d.n_events != null ? d.n_events : '—'}\n`
        text += `Censurados: ${d.n_censored != null ? d.n_censored : '—'}\n`
        if (d.median_time != null) text += `Tempo mediano: ${d.median_time.toFixed(1)} meses\n`
      }
      text += '\n'
    }

    if (survivalResult.logrank) {
      text += '--- Teste Log-Rank ---\n'
      const lr = survivalResult.logrank
      if (lr.statistic != null) text += `Estatística (χ²): ${lr.statistic.toFixed(4)}\n`
      if (lr.p_value != null) text += `Valor P: ${lr.p_value < 0.001 ? '< 0.001' : lr.p_value.toFixed(4)}\n`
      if (lr.df != null) text += `GL: ${lr.df}\n`
      text += `\nConclusão: ${lr.p_value != null && lr.p_value < 0.05 ? 'Diferença estatisticamente significativa' : 'Diferença NÃO estatisticamente significativa'}\n\n`
    }

    if (survivalResult.cox_model) {
      text += '--- Modelo de Cox (Riscos Proporcionais) ---\n'
      const cox = survivalResult.cox_model
      if (cox.concordance != null) text += `Índice de Concordância: ${cox.concordance.toFixed(4)}\n`
      if (cox.aic != null) text += `AIC: ${cox.aic.toFixed(2)}\n`
      if (cox.hazard_ratios && cox.hazard_ratios.length > 0) {
        text += '\nHazard Ratios:\n'
        cox.hazard_ratios.forEach((hr) => {
          text += `  ${hr.variable}: HR=${hr.hr.toFixed(3)}, IC=${hr.ci_95}, p=${hr.p_value < 0.001 ? '<0.001' : hr.p_value.toFixed(4)}\n`
        })
      }
      text += '\n'
    }

    if (survivalResult.nnt) {
      text += '--- Number Needed to Treat ---\n'
      const nnt = survivalResult.nnt
      if (nnt.nnt != null) text += `NNT: ${Math.round(nnt.nnt)}\n`
      if (nnt.nnt_ci) text += `IC 95%: ${nnt.nnt_ci}\n`
      text += '\n'
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' })
    saveAs(blob, `analise_sobrevivencia_${Date.now()}.txt`)
  }

  function getGroups() {
    if (!kmData.length) return []
    return kmData.map((kd, i) => ({
      name: kd.name,
      color: GROUP_COLORS[i % GROUP_COLORS.length],
    }))
  }

  function getGroupColors() {
    return kmData.map((_, i) => GROUP_COLORS[i % GROUP_COLORS.length])
  }

  const groups = getGroups()
  const groupColors = getGroupColors()

  return (
    <div className="sa-root">
      <div className="sa-header">
        <h1 className="sa-title">Sobrevivência — Kaplan-Meier, Log-Rank e Modelo de Cox</h1>
        <p className="sa-subtitle">
          Análise completa de sobrevivência: curvas de Kaplan-Meier com IC 95%, teste de Log-Rank, modelo de riscos proporcionais de Cox e NNT.
        </p>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sa-warning"
          >
            <span className="sa-warning-icon">&#x26A0;&#xFE0F;</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-text-muted hover:text-text-main text-lg"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preprocessing Info */}
      {survivalResult && survivalResult.preprocessing && (
        <div className="sa-prep-info">
          <div className="sa-prep-item">
            <div className="sa-prep-item-value">{survivalResult.preprocessing.n_original}</div>
            <div className="sa-prep-item-label">Original</div>
          </div>
          <div className="sa-prep-item">
            <div className="sa-prep-item-value">{survivalResult.preprocessing.n_clean}</div>
            <div className="sa-prep-item-label">Análise</div>
          </div>
          <div className="sa-prep-item">
            <div className="sa-prep-item-value">{survivalResult.preprocessing.n_removed_missing}</div>
            <div className="sa-prep-item-label">Removidos</div>
          </div>
          <div className="sa-prep-item">
            <div className="sa-prep-item-value">
              {survivalResult.validation?.n_valid != null ? survivalResult.validation.n_valid : '—'}
            </div>
            <div className="sa-prep-item-label">Válidos</div>
          </div>
          <div className="sa-prep-item">
            <div className="sa-prep-item-value">
              {survivalResult.validation?.n_events != null ? survivalResult.validation.n_events : '—'}
            </div>
            <div className="sa-prep-item-label">Eventos</div>
          </div>
          <div className="sa-prep-item">
            <div className="sa-prep-item-value">
              {survivalResult.validation?.n_censored != null ? survivalResult.validation.n_censored : '—'}
            </div>
            <div className="sa-prep-item-label">Censurados</div>
          </div>
        </div>
      )}

      {/* Warnings from backend */}
      {survivalResult && survivalResult.warnings && survivalResult.warnings.length > 0 && (
        <div className="sa-warning">
          <span className="sa-warning-icon">&#x26A0;&#xFE0F;</span>
          <div>
            {survivalResult.warnings.map((w, i) => (
              <p key={i} className="text-[11px] leading-relaxed">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="sa-grid">
        {/* ── Left Panel ── */}
        <div className="sa-sidebar">
          {!file ? (
            <div className="sa-config-card">
              <div className="sa-config-title">
                <span>📁</span> Carregar Dados
              </div>
              <div
                className="sa-empty"
                style={{ minHeight: 180, cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="sa-empty-icon">&#x1F4CA;</div>
                <div className="sa-empty-text">Arraste seu arquivo CSV ou XLSX</div>
                <div className="sa-empty-sub">ou clique para selecionar</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <ConfigPanel
              file={file}
              onConfigDetected={handleConfigDetected}
              onAnalyze={handleAnalyze}
              disabled={loading}
            />
          )}
        </div>

        {/* ── Content Area ── */}
        <div className="sa-content">
          {!survivalResult && !loading && (
            <div className="sa-empty">
              <div className="sa-empty-icon">{SURVIVAL_ICONS.chart}</div>
              <div className="sa-empty-text">Configure e execute a análise</div>
              <div className="sa-empty-sub">
                Carregue um arquivo de dados, selecione as colunas de tempo e evento, e clique em "Executar Análise"
              </div>
            </div>
          )}

          {loading && (
            <div className="sa-loading" style={{ minHeight: 400 }}>
              <div className="sa-spinner" />
              <span className="sa-loading-text">Processando análise de sobrevivência…</span>
              <p className="text-[11px] text-text-muted mt-3">
                Isso pode levar alguns segundos dependendo do tamanho dos dados.
              </p>
            </div>
          )}

          {!loading && survivalResult && (
            <>
              {/* Tabs */}
              <div className="flex flex-wrap gap-1 bg-surface rounded-2xl p-1.5 mb-6 w-fit">
                {[
                  { key: 'km', label: 'Curvas KM', icon: 'insights' },
                  { key: 'results', label: 'Resultados', icon: 'format_list_bulleted' },
                  { key: 'cox', label: 'Modelo Cox', icon: 'trending_up' },
                  { key: 'table', label: 'Dados', icon: 'table_chart' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold tracking-wide transition-all ${
                      activeTab === tab.key
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-text-muted hover:text-text-main border border-transparent'
                    }`}
                  >
                    <span className="material-symbols-rounded text-[16px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* ── KM Curves Tab ── */}
                {activeTab === 'km' && (
                  <motion.div key="km" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="sa-chart-card">
                      <div className="sa-chart-header">
                        <div className="sa-chart-title">
                          <span className="sa-chart-title-icon">{SURVIVAL_ICONS.chart}</span>
                          {survivalResult.endpoint_label || 'Curvas de Kaplan-Meier'}
                        </div>
                        <div className="sa-chart-legend">
                          {kmData.map((kd, i) => (
                            <div
                              key={kd.name}
                              className={`sa-legend-item ${hiddenGroups.has(kd.name) ? 'sa-legend-item--hidden' : ''}`}
                              onClick={() => toggleGroup(kd.name)}
                            >
                              <span
                                className="sa-legend-swatch"
                                style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }}
                              />
                              {kd.name}
                              {kd.n != null && ` (n=${kd.n})`}
                            </div>
                          ))}
                        </div>
                      </div>
                      <KMCurve
                        kmData={kmData}
                        groups={groups}
                        groupColors={groupColors}
                        hiddenGroups={hiddenGroups}
                        onToggleGroup={toggleGroup}
                        maxTime={maxTime}
                      />
                    </div>

                    {/* Risk Table */}
                    {kmData.length > 0 && (
                      <RiskTable data={kmData} groups={groups} groupColors={groupColors} maxTime={maxTime} />
                    )}
                  </motion.div>
                )}

                {/* ── Results Tab ── */}
                {activeTab === 'results' && (
                  <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <ResultsSummary result={survivalResult} loading={false} />
                  </motion.div>
                )}

                {/* ── Cox Model Tab ── */}
                {activeTab === 'cox' && (
                  <motion.div key="cox" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {survivalResult.cox_model ? (
                      <>
                        <div className="sa-chart-card">
                          <div className="sa-chart-title">
                            <span className="sa-chart-title-icon">&#x1F4C8;</span>
                            Forest Plot — Hazard Ratios
                          </div>
                          <ForestPlot coxResult={survivalResult.cox_model} endpointLabel={survivalResult.endpoint_label} />
                        </div>

                        {/* PH Assumption Detail */}
                        {survivalResult.ph_test && (
                          <div className="sa-detail-section">
                            <div className="sa-detail-title">
                              <span className="sa-detail-title-icon">&#x2696;&#xFE0F;</span>
                              Teste de Proporcionalidade dos Riscos (Schoenfeld)
                            </div>
                            <table className="sa-detail-table">
                              <thead>
                                <tr>
                                  <th>Variável</th>
                                  <th>rho</th>
                                  <th>χ²</th>
                                  <th>p-valor</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {survivalResult.ph_test.individual && survivalResult.ph_test.individual.map((ph, i) => (
                                  <tr key={i}>
                                    <td className="font-mono">{ph.variable}</td>
                                    <td className="mono">{ph.rho?.toFixed(4) || '—'}</td>
                                    <td className="mono">{ph.chisq?.toFixed(4) || '—'}</td>
                                    <td className="mono">{ph.p_value != null ? (ph.p_value < 0.001 ? '<0.001' : ph.p_value.toFixed(4)) : '—'}</td>
                                    <td className={ph.p_value != null && ph.p_value < 0.05 ? 'sig-yes' : 'sig-no'}>
                                      {ph.p_value != null && ph.p_value < 0.05 ? '&#x2717; Violado' : '&#x2713; OK'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="sa-apa">
                              <div className="sa-apa-label">Interpretação Global</div>
                              <p>
                                {survivalResult.ph_test.global != null && survivalResult.ph_test.global < 0.05
                                  ? 'O teste global indica VIOLAÇÃO do pressuposto de riscos proporcionais (p < 0.05). Considere estratificar pela variável violada ou usar modelos de tempo-dependentes.'
                                  : 'O teste global NÃO indica violação significativa do pressuposto de riscos proporcionais. O modelo de Cox é adequado para estes dados.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* APA Format */}
                        {survivalResult.apa_text && (
                          <div className="sa-detail-section">
                            <div className="sa-detail-title">
                              <span className="sa-detail-title-icon">&#x1F4DD;</span>
                              Resultado em Formato APA 7ª Edição
                            </div>
                            <div className="sa-apa">
                              <p>{survivalResult.apa_text}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="sa-chart-card">
                        <div className="sa-empty" style={{ minHeight: 200 }}>
                          <div className="sa-empty-icon">&#x1F4C8;</div>
                          <div className="sa-empty-text">Sem modelo de Cox</div>
                          <div className="sa-empty-sub">
                            O modelo de Cox será gerado automaticamente se houver covariáveis numéricas disponíveis nos dados.
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Data Tab ── */}
                {activeTab === 'table' && (
                  <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="sa-chart-card">
                      <div className="sa-chart-title">
                        <span className="sa-chart-title-icon">{SURVIVAL_ICONS.data}</span>
                        Dados Utilizados na Análise
                      </div>
                      {survivalResult.data_preview && survivalResult.data_preview.length > 0 && (
                        <div className="sa-risk-table-card">
                          <table className="sa-risk-table">
                            <thead>
                              <tr>
                                {Object.keys(survivalResult.data_preview[0]).map((col, i) => (
                                  <th key={i}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {survivalResult.data_preview.map((row, ri) => (
                                <tr key={ri}>
                                  {Object.values(row).map((val, ci) => (
                                    <td key={ci} className="mono">{val}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {survivalResult.data_preview.length < survivalResult.preprocessing?.n_clean && (
                            <p className="text-[10px] text-text-muted mt-3 text-center">
                              Exibindo {survivalResult.data_preview.length} de {survivalResult.preprocessing.n_clean} linhas
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Export Button */}
              <div className="flex flex-wrap gap-3 mt-6 mb-4">
                <button
                  onClick={handleExportTXT}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-[11px] font-semibold text-text-muted hover:text-text-main hover:border-primary/30 transition-all"
                >
                  <span className="material-symbols-rounded text-[16px]">description</span>
                  Exportar Relatório (.TXT)
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-[11px] font-semibold text-text-muted hover:text-text-main hover:border-primary/30 transition-all"
                >
                  <span className="material-symbols-rounded text-[16px]">table_chart</span>
                  Exportar KM (.CSV)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}