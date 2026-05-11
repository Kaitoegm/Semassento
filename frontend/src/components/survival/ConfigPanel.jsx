import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { survivalDetectConfig } from '../../api'
import './survival.css'

function ConfigPanel({ file, onConfigDetected, onAnalyze, disabled }) {
  const [config, setConfig] = useState(null)
  const [columns, setColumns] = useState([])
  const [detecting, setDetecting] = useState(false)
  const [selTime, setSelTime] = useState('')
  const [selEvent, setSelEvent] = useState('')
  const [selGroup, setSelGroup] = useState('')
  const [validation, setValidation] = useState(null)

  useEffect(() => {
    if (file) {
      setDetecting(true)
      setValidation(null)
      survivalDetectConfig(file)
        .then((res) => {
          const det = res.detection_result
          setConfig(det)
          setColumns(res.columns_available || [])
          setSelTime(det.time_col || '')
          setSelEvent(det.event_col || '')
          setSelGroup(det.group_col || '')
          setDetecting(false)
          if (onConfigDetected) onConfigDetected(det)
        })
        .catch((err) => {
          console.error('Detection error:', err)
          setValidation({ type: 'error', msg: 'Falha ao detectar colunas. Verifique o arquivo.' })
          setDetecting(false)
        })
    }
  }, [file])

  function validateSelection() {
    if (!selTime || !selEvent) {
      setValidation({ type: 'error', msg: 'Selecione pelo menos as colunas de Tempo e Evento.' })
      return false
    }
    const numericCols = columns.filter(c => {
      const row = config.columns_available || []
      return row.includes(c)
    })
    if (numericCols.length < 2) {
      setValidation({ type: 'error', msg: 'Dados insuficientes para análise de sobrevivência.' })
      return false
    }
    setValidation({ type: 'ok', msg: `✓ Configuração válida — ${columns.length} colunas disponíveis.` })
    return true
  }

  function handleAnalyze() {
    if (validateSelection()) {
      if (onAnalyze) onAnalyze({ timeCol: selTime, eventCol: selEvent, groupCol: selGroup })
    }
  }

  const colOptions = columns.map(c => ({ value: c, label: c }))

  return (
    <div className="sa-config-card">
      <div className="sa-config-title">
        <span>&#x2699;&#xFE0F;</span> Configura&#x231;c&#xF3; de Sobreviv&#xEA;ncia
      </div>

      {detecting && (
        <div className="sa-loading" style={{ minHeight: 120 }}>
          <div className="sa-spinner" />
          <span className="sa-loading-text">Detectando colunas automaticamente…</span>
        </div>
      )}

      {!detecting && columns.length > 0 && (
        <>
          <div className="sa-config-group">
            <label className="sa-config-label">Coluna de Tempo</label>
            <div className="sa-select-wrap">
              <select
                className="sa-config-select"
                value={selTime}
                onChange={(e) => setSelTime(e.target.value)}
                disabled={disabled}
              >
                <option value="">— selecionar —</option>
                {colOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span className="sa-select-icon">⌄</span>
            </div>
          </div>

          <div className="sa-config-group">
            <label className="sa-config-label">Coluna de Evento</label>
            <div className="sa-select-wrap">
              <select
                className="sa-config-select"
                value={selEvent}
                onChange={(e) => setSelEvent(e.target.value)}
                disabled={disabled}
              >
                <option value="">— selecionar —</option>
                {colOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span className="sa-select-icon">⌄</span>
            </div>
          </div>

          <div className="sa-config-group">
            <label className="sa-config-label">Coluna de Grupo (opcional)</label>
            <div className="sa-select-wrap">
              <select
                className="sa-config-select"
                value={selGroup}
                onChange={(e) => setSelGroup(e.target.value)}
                disabled={disabled}
              >
                <option value="">— nenhum —</option>
                {colOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span className="sa-select-icon">⌄</span>
            </div>
          </div>

          {validation && (
            <div className={`sa-validation sa-validation--${validation.type}`}>
              {validation.type === 'ok' ? '&#x2713;' : validation.type === 'warn' ? '&#x26A0;&#xFE0F;' : '&#x2717;'} {validation.msg}
            </div>
          )}

          <button
            className="sa-run-btn"
            onClick={handleAnalyze}
            disabled={disabled || !selTime || !selEvent}
          >
            {disabled ? (
              <>
                <div className="sa-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Processando…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Executar Análise
              </>
            )}
          </button>

          <div className="sa-sample-row">
            <button
              className="sa-sample-btn"
              onClick={() => loadSampleAndSet('clinical_trial')}
              disabled={disabled}
            >Ensaio Clínico</button>
            <button
              className="sa-sample-btn"
              onClick={() => loadSampleAndSet('oncology')}
              disabled={disabled}
            >Dados Oncológicos</button>
            <button
              className="sa-sample-btn"
              onClick={() => loadSampleAndSet('observational')}
              disabled={disabled}
            >Observacional</button>
          </div>
        </>
      )}

      {!detecting && columns.length === 0 && file && (
        <div className="sa-validation sa-validation--error">
          Não foi possível ler colunas do arquivo. Verifique o formato (CSV ou XLSX).
        </div>
      )}
    </div>
  )

  function loadSampleAndSet(type) {
    loadSampleSurvivalData(type).then((data) => {
      if (data.suggested_config) {
        setSelTime(data.suggested_config.time_col)
        setSelEvent(data.suggested_config.event_col)
        setSelGroup(data.suggested_config.group_col || '')
      }
      if (onAnalyze) {
        onAnalyze({
          timeCol: data.suggested_config?.time_col || '',
          eventCol: data.suggested_config?.event_col || '',
          groupCol: data.suggested_config?.group_col || '',
          sampleData: data,
        })
      }
    })
  }
}

export default ConfigPanel