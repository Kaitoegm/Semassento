import './survival.css'

/**
 * Results summary cards — descriptive stats, log-rank, NNT.
 */
export default function ResultsSummary({ result, loading }) {
  if (loading) {
    return (
      <div className="sa-loading" style={{ minHeight: 200 }}>
        <div className="sa-spinner" />
        <span className="sa-loading-text">Calculando resultados...</span>
      </div>
    )
  }

  if (!result) return null

  const descr = result.descriptive
  const lr = result.logrank
  const nnt = result.nnt
  const cox = result.cox_model
  const cuminc = result.cumulative_incidence

  return (
    <div className="sa-results-grid">
      {/* Descriptive */}
      <div className="sa-result-card">
        <div className="sa-result-card-header">
          <div className="sa-result-card-icon sa-result-card-icon--desc">&#x1F4CB;</div>
          <span className="sa-result-card-title">Estatisticas Descritivas</span>
        </div>
        {descr ? (
          <div className="space-y-3">
            {descr.n_total != null && (
              <>
                <div>
                  <span className="sa-result-card-value">{descr.n_total}</span>
                  <div className="sa-result-card-sub">Pacientes totais</div>
                </div>
                <div className="sa-result-card-detail">
                  <div className="flex justify-between">
                    <span>Eventos observados:</span>
                    <span className="font-mono font-semibold">{descr.n_events}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Censurados:</span>
                    <span className="font-mono font-semibold">{descr.n_censored}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo mediano:</span>
                    <span className="font-mono font-semibold">{descr.median_time != null ? `${descr.median_time.toFixed(1)} mo` : '-'}</span>
                  </div>
                  {descr.event_rate != null && (
                    <div className="flex justify-between">
                      <span>Taxa de evento:</span>
                      <span className="font-mono font-semibold">{(descr.event_rate * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </>
            )}
            {descr.groups && (
              <div className="space-y-2">
                {Object.entries(descr.groups).map(([name, g]) => (
                  <div key={name} className="sa-col-card">
                    <div>
                      <span className="sa-col-name">{name}</span>
                      <div className="text-[10px] text-text-muted mt-1">
                        n={g.n} | Eventos={g.n_events} | Censurados={g.n_censored}
                      </div>
                    </div>
                    <span className="sa-col-type sa-col-type--num">{g.type || 'Grupo'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-text-muted italic">Sem dados disponiveis.</p>
        )}
      </div>

      {/* Log-Rank */}
      <div className="sa-result-card">
        <div className="sa-result-card-header">
          <div className="sa-result-card-icon sa-result-card-icon--lr">&#x1F4CA;</div>
          <span className="sa-result-card-title">Teste Log-Rank</span>
        </div>
        {lr ? (
          <div className="space-y-3">
            <div>
              <span className="sa-result-card-value">
                {lr.p_value != null ? (lr.p_value < 0.001 ? '< 0.001' : lr.p_value.toFixed(4)) : '-'}
              </span>
              <div className="sa-result-card-sub">Valor P</div>
            </div>
            <div className="sa-result-card-detail">
              {lr.statistic != null && (
                <div className="flex justify-between">
                  <span>Estatistica (x²):</span>
                  <span className="font-mono font-semibold">{lr.statistic.toFixed(4)}</span>
                </div>
              )}
              {lr.df != null && (
                <div className="flex justify-between">
                  <span>Graus de liberdade:</span>
                  <span className="font-mono font-semibold">{lr.df}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-subtle">
                <span className="text-[10px]">Significancia (α = 0.05):</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${lr.p_value != null && lr.p_value < 0.05 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                  {lr.p_value != null && lr.p_value < 0.05 ? 'SIGNIFICATIVO' : 'NAO SIGNIFICATIVO'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-text-muted italic">Sem resultado (verifique se ha coluna de grupo).</p>
        )}
      </div>

      {/* NNT */}
      <div className="sa-result-card">
        <div className="sa-result-card-header">
          <div className="sa-result-card-icon sa-result-card-icon--nnt">&#x1F48A;</div>
          <span className="sa-result-card-title">NNT / NNH</span>
        </div>
        {nnt && nnt.nnt_by_time ? (
          <div className="space-y-3">
            <div>
              <span className="sa-result-card-value">{nnt.groups ? nnt.groups[0] : '—'}</span>
              <div className="sa-result-card-sub">Grupos</div>
            </div>
            <div className="sa-result-card-detail">
              <p className="text-[10px] font-bold text-text-muted mb-1">NNT por ponto temporal:</p>
              {Object.entries(nnt.nnt_by_time).slice(0, 5).map(([timeKey, val]) => (
                <div key={timeKey} className="flex justify-between items-center py-1 border-b border-border-subtle">
                  <span className="text-[10px] text-text-muted">{timeKey}</span>
                  <div className="text-right">
                    {val.nnt != null ? (
                      <>
                        <span className="font-mono font-semibold text-primary">{Math.round(val.nnt)}</span>
                        <span className="text-[9px] text-text-muted ml-1">
                          (S_ctrl={val.s_control?.toFixed(2)}, S_trat={val.s_treatment?.toFixed(2)})
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] text-text-muted">{val.interpretation || '—'}</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-subtle">
                <span className="text-[10px]">Interpretação:</span>
                <span className="text-[10px] font-bold text-primary">
                  {(() => {
                    const vals = Object.values(nnt.nnt_by_time);
                    const first = vals.find(v => v.nnt != null);
                    if (first) return `NNT ≈ ${Math.round(first.nnt)} para prevenir 1 evento`;
                    return 'NNT não calculável';
                  })()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-text-muted italic">NNT requer coluna de grupo.</p>
        )}
      </div>

      {/* Cox Model */}
      {cox && (
        <div className="sa-result-card">
          <div className="sa-result-card-header">
            <div className="sa-result-card-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>&#x1F4C8;</div>
            <span className="sa-result-card-title">Modelo de Cox (PH)</span>
          </div>
          <div className="space-y-3">
            {cox.concordance != null && (
              <div>
                <span className="sa-result-card-value">{cox.concordance.toFixed(3)}</span>
                <div className="sa-result-card-sub">Indice de Concordancia (C-stat)</div>
              </div>
            )}
            {cox.model_summary?.aic != null && (
              <div className="sa-result-card-detail">
                <div className="flex justify-between">
                  <span>AIC:</span>
                  <span className="font-mono font-semibold">{cox.model_summary.aic.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Log-likelihood:</span>
                  <span className="font-mono font-semibold">{cox.model_summary.log_likelihood?.toFixed(2) || '-'}</span>
                </div>
              </div>
            )}
            {cox.n_obs && (
              <div className="sa-result-card-detail">
                <div className="flex justify-between">
                  <span>Observacoes:</span>
                  <span className="font-mono font-semibold">{cox.n_obs}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eventos:</span>
                  <span className="font-mono font-semibold">{cox.n_events || '-'}</span>
                </div>
              </div>
            )}
            {cox.hazard_ratios && cox.hazard_ratios.length > 0 && (
              <div className="sa-result-card-detail">
                <p className="text-[10px] font-bold text-text-muted mb-2">Hazard Ratios:</p>
                <div className="space-y-1">
                  {cox.hazard_ratios.slice(0, 5).map((hr, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-[10px] text-text-muted">{hr.variable}</span>
                      <span className={`text-[10px] font-mono font-semibold ${hr.hr > 1 ? 'text-red-400' : 'text-green-400'}`}>
                        {hr.hr.toFixed(3)} [{hr.ci_95}]
                      </span>
                    </div>
                  ))}
                  {cox.hazard_ratios.length > 5 && (
                    <p className="text-[9px] text-text-muted/50 mt-1">+ {cox.hazard_ratios.length - 5} covariavel(is) adicional(is)</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cumulative Incidence */}
      {cuminc && (
        <div className="sa-result-card">
          <div className="sa-result-card-header">
            <div className="sa-result-card-icon" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>&#x1F4C9;</div>
            <span className="sa-result-card-title">Incidencia Cumulativa</span>
          </div>
          <div className="space-y-3">
            {cuminc.event_types && cuminc.event_types.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-text-muted mb-1">Tipos de evento:</p>
                {cuminc.event_types.slice(0, 5).map((et, i) => (
                  <div key={i} className="sa-result-card-detail">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-text-muted">{et.event_type}</span>
                      <span className="font-mono font-semibold text-[10px]">
                        n={et.n_events} | CIF final: {et.cumulative_incidence ? et.cumulative_incidence[et.cumulative_incidence.length - 1]?.toFixed(3) : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cuminc.overall && Object.keys(cuminc.overall).length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-text-muted mb-1">Resumo:</p>
                <p className="text-[10px] text-text-muted">Curvas de incidência cumulativa disponíveis para {cuminc.event_types?.length || 0} tipo(s) de evento.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PH Test */}
      {result.ph_test && (
        <div className="sa-result-card">
          <div className="sa-result-card-header">
            <div className="sa-result-card-icon" style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}>&#x2696;</div>
            <span className="sa-result-card-title">Teste de PH (Schoenfeld)</span>
          </div>
          <div className="space-y-3">
            <div>
              <span className="sa-result-card-value">
                {result.ph_test.p_value != null ? (result.ph_test.p_value < 0.001 ? '< 0.001' : result.ph_test.p_value.toFixed(4)) : '-'}
              </span>
              <div className="sa-result-card-sub">Valor P global</div>
            </div>
            <div className="sa-result-card-detail">
              {result.ph_test.global_p_value != null && (
                <div className="flex justify-between">
                  <span>Teste global:</span>
                  <span className={`font-mono font-semibold ${result.ph_test.global_p_value < 0.05 ? 'text-amber-400' : 'text-green-400'}`}>
                    {result.ph_test.global_p_value < 0.05 ? 'VIOLADO' : 'OK'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}