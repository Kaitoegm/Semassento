import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_BASE_URL

const SURVIVAL_ICONS = {
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L3 18.5" />
    </svg>
  )
}

function generateExponential(n, scale) {
  const data = []
  for (let i = 0; i < n; i++) {
    data.push(-scale * Math.log(1 - Math.random()))
  }
  return data
}

function generateBernoulli(n, p) {
  const data = []
  for (let i = 0; i < n; i++) {
    data.push(Math.random() < p ? 1 : 0)
  }
  return data
}

export default function SurvivalAnalysis() {
  const [methods, setMethods] = useState({ km: true, logrank: true })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggleMethod = (k) => setMethods(prev => ({ ...prev, [k]: !prev[k] }))

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const n = 80
      const timesA = generateExponential(n, 12)
      const timesB = generateExponential(n, 18)
      const eventsA = generateBernoulli(n, 0.65)
      const eventsB = generateBernoulli(n, 0.55)

      const res = {}

      if (methods.km) {
        const [km1, km2] = await Promise.all([
          fetch(`${API_URL}/api/stats/survival`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ times: timesA.map(v => Math.max(0.5, v)), events: eventsA })
          }).then(r => r.json()),
          fetch(`${API_URL}/api/stats/survival`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ times: timesB.map(v => Math.max(0.5, v)), events: eventsB })
          }).then(r => r.json()),
        ])

        res.km1 = {
          curve: km1.timeline.map((t, i) => ({ time: t, survival: km1.survival[i] })),
          n: timesA.length,
          events: eventsA.reduce((a, b) => a + b, 0),
          censored: timesA.length - eventsA.reduce((a, b) => a + b, 0),
        }
        res.km2 = {
          curve: km2.timeline.map((t, i) => ({ time: t, survival: km2.survival[i] })),
          n: timesB.length,
          events: eventsB.reduce((a, b) => a + b, 0),
          censored: timesB.length - eventsB.reduce((a, b) => a + b, 0),
        }
      }

      if (methods.logrank) {
        res.logrank = await fetch(`${API_URL}/api/stats/log-rank`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ times_a: timesA, events_a: eventsA, times_b: timesB, events_b: eventsB })
        }).then(r => r.json())
      }

      setResult(res)
    } catch {
      setError('Falha ao executar. Verifique se o backend está ativo.')
    }
    setLoading(false)
  }

  function buildSVGPath(curve, maxTime, maxSurv) {
    if (!curve || curve.length === 0) return ''
    const W = 560, H = 280, pad = 40
    const xScale = (W - pad * 2) / maxTime
    const yScale = (H - pad * 2) / maxSurv
    let d = `M ${pad} ${H - pad - 1 * yScale}`
    for (const pt of curve) {
      const x = pad + pt.time * xScale
      const y = H - pad - pt.survival * yScale
      d += ` H ${x.toFixed(1)} V ${y.toFixed(1)}`
    }
    return d
  }

  return (
    <div className="space-y-12">
      <header>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl font-black tracking-tight text-white">Sobrevivência</h1>
          <p className="text-slate-500 font-medium mt-2">Estimativa de Kaplan-Meier e Teste Log-Rank via lifelines.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[2rem] p-8"
          >
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Pipeline de Métodos</h3>
            <div className="space-y-3">
              {[
                { key: 'km', label: 'Curva Kaplan-Meier', desc: 'lifelines.KaplanMeierFitter' },
                { key: 'logrank', label: 'Teste Log-Rank', desc: 'lifelines.logrank_test' },
              ].map(m => (
                <label key={m.key} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${methods[m.key] ? 'bg-primary/5 border-primary/20 text-primary shadow-[0_0_15px_rgba(0,255,163,0.05)]' : 'bg-white/2 border-white/5 text-slate-500 hover:text-slate-300'}`}>
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${methods[m.key] ? 'bg-primary border-primary' : 'border-slate-700'}`}>
                    {methods[m.key] && <span className="material-symbols-outlined text-background text-[14px] font-black">check</span>}
                  </div>
                  <input type="checkbox" checked={methods[m.key]} onChange={() => toggleMethod(m.key)} className="hidden" />
                  <div>
                    <span className="text-xs font-bold tracking-wide block">{m.label}</span>
                    <span className="text-[9px] text-slate-600 font-mono">{m.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </motion.div>

          <button onClick={runAnalysis} disabled={loading}
            className="w-full bg-primary hover:brightness-110 text-background h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(0,255,163,0.2)] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">
            <span className={`material-symbols-outlined text-[18px] font-black ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'sync' : 'database'}
            </span>
            {loading ? 'Calculando...' : 'Processar Análise'}
          </button>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-primary/2 blur-[120px] pointer-events-none"></div>

            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/5 rounded-2xl text-primary">
                  {SURVIVAL_ICONS.chart}
                </div>
                <h3 className="text-xl font-black text-white">Visualização de Coorte</h3>
              </div>
              {result && (
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                       <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#00FFA3]"></div>
                       <span className="text-[10px] font-black text-white">BRAÇO A</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                       <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_#9333ea]"></div>
                       <span className="text-[10px] font-black text-white">BRAÇO B</span>
                    </div>
                 </div>
              )}
            </div>

            {!result?.km1 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-600 bg-white/1 rounded-[2rem] border-2 border-dashed border-white/5">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-10">biotech</span>
                <p className="text-sm font-bold uppercase tracking-widest opacity-40">Nenhum resultado processado</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                <svg viewBox="0 20 600 280" className="w-full overflow-visible drop-shadow-[0_0_40px_rgba(0,0,0,0.4)]">
                   <defs>
                     <filter id="glow">
                       <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                       <feMerge>
                         <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                       </feMerge>
                     </filter>
                   </defs>
                  {[0, 0.5, 1.0].map(v => (
                    <g key={v}>
                      <line x1="40" y1={280 - v * 240} x2="580" y2={280 - v * 240} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <text x="32" y={284 - v * 240} textAnchor="end" className="text-[10px] font-black fill-slate-600">{v.toFixed(1)}</text>
                    </g>
                  ))}

                  <path
                    d={buildSVGPath(result.km1.curve, Math.max(...result.km1.curve.map(p => p.time), ...result.km2.curve.map(p => p.time)), 1)}
                    fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                  <path
                    d={buildSVGPath(result.km2.curve, Math.max(...result.km1.curve.map(p => p.time), ...result.km2.curve.map(p => p.time)), 1)}
                    fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    filter="url(#glow)"
                    opacity="0.8"
                  />

                  <text x="310" y="310" textAnchor="middle" className="text-[9px] font-black uppercase tracking-[0.4em] fill-slate-500">Timeline (Investigação)</text>
                </svg>
              </motion.div>
            )}
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <AnimatePresence>
              {result?.logrank && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[2rem] p-8 border-primary/10"
                >
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Teste Log-Rank (lifelines)</h4>
                  <div className="flex items-end gap-6 h-full">
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Estatística (χ²)</p>
                        <p className="text-3xl font-black text-white leading-none">{result.logrank.test_statistic?.toFixed(4)}</p>
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Valor P</p>
                        <p className={`text-3xl font-black leading-none ${result.logrank.p_value < 0.05 ? 'text-primary' : 'text-slate-500'}`}>
                          {result.logrank.p_value < 0.001 ? '< 0.001' : result.logrank.p_value.toFixed(4)}
                        </p>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {result?.km1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[2rem] p-8 border-accent/10"
              >
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Resumo dos Grupos</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Braço A', n: result.km1.n, events: result.km1.events, censored: result.km1.censored },
                    { label: 'Braço B', n: result.km2.n, events: result.km2.events, censored: result.km2.censored },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/2 p-3 rounded-xl border border-white/5">
                      <span className="text-[11px] font-bold text-slate-400">{row.label}</span>
                      <span className="text-[13px] font-black text-white">n={row.n} | Eventos={row.events} | Censurados={row.censored}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
