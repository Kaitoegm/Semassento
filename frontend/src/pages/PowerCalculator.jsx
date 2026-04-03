import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = import.meta.env.VITE_API_BASE_URL

const CALCULATOR_ICONS = {
  settings: <span className="material-symbols-rounded text-[20px]">settings</span>,
  calculate: <span className="material-symbols-rounded text-[20px]">calculate</span>,
  refresh: <span className="material-symbols-rounded text-[20px]">refresh</span>,
  info: <span className="material-symbols-rounded text-[20px]">info</span>
}

export default function PowerCalculator() {
  const [form, setForm] = useState({
    type: 'two-sample', alpha: '0.05', power: '0.80', effect: '0.50'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const calculate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/stats/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effect_size: parseFloat(form.effect),
          alpha: parseFloat(form.alpha),
          power: parseFloat(form.power),
        })
      })
      if (!res.ok) {
        const err = await res.json()
        setResult({ error: err.detail || 'Erro no cálculo.' })
      } else {
        const data = await res.json()
        const n1 = data.sample_size
        setResult({ total: n1 * 2, n1 })
      }
    } catch {
      setResult({ error: 'Erro ao conectar com o servidor.' })
    }
    setLoading(false)
  }

  const types = [
    { value: 'two-sample', label: 'Teste-T de Duas Amostras' },
    { value: 'one-sample', label: 'Teste-T de Uma Amostra' },
    { value: 'paired', label: 'Teste-T Pareado' },
    { value: 'chi-square', label: 'Qui-Quadrado' },
    { value: 'correlation', label: 'Correlação' },
  ]

  return (
    <div className="space-y-10">
      <header className="relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Calculadora de <span className="text-primary glow-text-sm">Poder</span>
          </h1>
          <p className="text-slate-400 max-w-2xl">Determine o tamanho da amostra ideal para garantir a validade estatística do seu estudo.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32"></div>
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
            <span className="text-primary">{CALCULATOR_ICONS.settings}</span>
            Configuração do Estudo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Tipo de Análise</label>
              <select 
                value={form.type} 
                onChange={e => set('type', e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl text-sm font-semibold py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
              >
                {types.map(t => <option key={t.value} value={t.value} className="bg-slate-900">{t.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Nível de Significância (α)</label>
              <input 
                type="number" 
                value={form.alpha} 
                onChange={e => set('alpha', e.target.value)} 
                step="0.01" 
                className="w-full bg-white/5 border border-white/10 rounded-xl text-sm font-mono py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Poder Estatístico (1 - β)</label>
              <input 
                type="number" 
                value={form.power} 
                onChange={e => set('power', e.target.value)} 
                step="0.05" 
                className="w-full bg-white/5 border border-white/10 rounded-xl text-sm font-mono py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Tamanho do Efeito (Cohen's d)</label>
              <input 
                type="number" 
                value={form.effect} 
                onChange={e => set('effect', e.target.value)} 
                step="0.1" 
                className="w-full bg-white/5 border border-white/10 rounded-xl text-sm font-mono py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
              />
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <button 
              onClick={calculate} 
              disabled={loading} 
              className="bg-primary hover:bg-primary-hover text-slate-900 px-10 py-4 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] active:scale-95 flex items-center gap-3 disabled:opacity-50 group"
            >
              <span className={`${loading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                {CALCULATOR_ICONS.calculate}
              </span>
              Calcular Amostra
            </button>
            
            <button 
              onClick={() => { setForm({ type: 'two-sample', alpha: '0.05', power: '0.80', effect: '0.50' }); setResult(null); }} 
              className="bg-white/5 text-slate-300 px-10 py-4 rounded-xl font-bold hover:bg-white/10 border border-white/10 transition-all active:scale-95 flex items-center gap-3"
            >
              <span>{CALCULATOR_ICONS.refresh}</span> 
              Resetar
            </button>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`glass-card p-10 text-center relative overflow-hidden group transition-all duration-500 ${result ? 'border-primary/50 shadow-[0_0_40px_rgba(0,255,163,0.1)]' : ''}`}
          >
            {result && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-primary/5 backdrop-blur-3xl -z-10"
              />
            )}
            
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 underline decoration-primary/30 underline-offset-8">Amostra Recomendada</p>
            
            <div className="relative inline-block">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={result?.total || 'empty'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`text-7xl font-black ${result ? 'text-primary glow-text-lg' : 'text-white/10'}`}
                >
                  {result?.error ? 'Erro' : (result?.total || '--')}
                </motion.p>
              </AnimatePresence>
            </div>

            <p className="text-[10px] font-bold text-slate-400 mt-8 uppercase tracking-[0.15em] leading-relaxed max-w-[200px] mx-auto">
              {result?.n1 ? (
                <>
                  Participantes por braço: <span className="text-white ml-1">{result.n1}</span>
                </>
              ) : result?.total ? (
                <>
                  Total de participantes necessários
                </>
              ) : result?.error || 'Aguardando parâmetros de entrada...'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-8 flex items-center gap-2">
              <span className="text-primary">{CALCULATOR_ICONS.info}</span>
              Impacto do Efeito
            </h4>
            
            <div className="space-y-8">
              {[
                { label: 'Sutil', d: 0.20, color: 'bg-slate-500' },
                { label: 'Moderado', d: 0.50, color: 'bg-primary' },
                { label: 'Expressivo', d: 0.80, color: 'bg-accent' },
              ].map((e, idx) => (
                <div key={e.label} className="group cursor-help">
                  <div className="flex justify-between items-end text-[11px] mb-3 font-bold tracking-wider">
                    <span className="text-slate-400 group-hover:text-white transition-colors">{e.label}</span>
                    <span className="font-mono text-slate-500">d = {e.d.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(e.d / 1.0) * 100}%` }}
                      transition={{ delay: 0.5 + (idx * 0.1), duration: 1 }}
                      className={`h-full ${e.color} ${e.label === 'Moderado' ? 'shadow-[0_0_10px_rgba(0,255,163,0.5)]' : ''} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[9px] text-slate-500 leading-relaxed italic">
                * Cálculos executados pelo motor statsmodels (TTestIndPower). Amostras maiores reduzem o risco de erro Tipo II.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
