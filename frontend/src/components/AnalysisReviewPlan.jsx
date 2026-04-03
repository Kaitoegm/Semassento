import React from 'react'
import { motion } from 'framer-motion'

const AnalysisReviewPlan = ({ protocol, onOptionChange, onConfirm, outcome, onOutcomeChange, outcomeOptions }) => {
  if (!protocol || protocol.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[3rem] p-12 max-w-6xl mx-auto border border-white/5"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
        <div className="flex-1">
          <h2 className="text-4xl font-black text-white mb-4 leading-tight tracking-tight">
            Review do Plano de Análise
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm font-medium">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span><strong className="text-white">{protocol.length}</strong> Variáveis Identificadas</span>
             </div>
             <div className="w-px h-4 bg-white/10"></div>
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Desfecho:</span>
                {outcomeOptions && outcomeOptions.length > 1 ? (
                  <select
                    value={outcome}
                    onChange={(e) => onOutcomeChange(e.target.value)}
                    className="appearance-none bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-primary/15 transition-all pr-8 relative"
                  >
                    {outcomeOptions.map(opt => (
                      <option key={opt} value={opt} className="bg-slate-900 text-white">{opt}</option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    {outcome}
                  </span>
                )}
             </div>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(0, 255, 163, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          className="bg-primary text-background font-black text-[11px] uppercase tracking-[0.25em] px-12 py-6 rounded-2x2l shadow-[0_25px_50px_-15px_rgba(0,255,163,0.4)] transition-all flex items-center gap-4"
        >
          Finalizar Protocolo
          <span className="material-symbols-rounded text-lg">rocket_launch</span>
        </motion.button>
      </div>

      <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-white/[0.01]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white/2">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">Variável / Domínio</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">Métrica (N)</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5">Teste Proposto (Consultor)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/2">
            {protocol.map((item, idx) => (
              <motion.tr 
                key={item.name}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-white/[0.03] transition-all group"
              >
                <td className="px-8 py-7">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500">
                       <span className="material-symbols-rounded text-slate-300 group-hover:text-primary transition-all text-2xl">
                        {item.type === 'Binária' ? 'toggle_off' : item.type === 'Categórica' ? 'grid_view' : 'timeline'}
                       </span>
                    </div>
                    <div>
                      <div className="text-base font-black text-white mb-1 group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em]">{item.type} (Independente)</div>
                    </div>
                  </div>
                </td>
                
                <td className="px-8 py-7">
                   <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                       <span className="text-slate-400 text-[11px] font-black tracking-widest">
                          {item.unique_count} NÍVEIS
                       </span>
                   </div>
                </td>

                <td className="px-8 py-7">
                  <div className="max-w-[280px]">
                    <div className="relative mb-3 group-hover:scale-[1.02] transition-transform">
                      <select 
                        value={item.selected_test || item.recommended_test}
                        onChange={(e) => onOptionChange(idx, e.target.value)}
                        className="appearance-none w-full bg-slate-950 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest py-4 px-5 pr-12 rounded-2xl focus:outline-none focus:border-primary transition-all cursor-pointer hover:border-white/20"
                      >
                        {item.test_options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                        <span className="material-symbols-rounded text-xl">stat_minus_1</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-normal bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <span className="material-symbols-rounded text-xs text-primary/50 mt-0.5">school</span>
                      <p>{item.rationale}</p>
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-12 p-8 rounded-[2.5rem] bg-slate-950 border border-white/10 relative overflow-hidden group/hint">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/hint:opacity-[0.07] transition-opacity">
            <span className="material-symbols-rounded text-9xl">science</span>
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                 <span className="material-symbols-rounded text-sm">tips_and_updates</span>
              </span>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Notas de Rigor Científico</h4>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-4xl">
              Este "Protocolo de Análise" foi estruturado para evitar a <strong className="text-slate-300">p-hacking</strong>. 
              As sugestões privilegiam testes não-paramétricos (Kruskal-Wallis e Mann-Whitney) por serem considerados 
              conservadores e adequados para distribuições clínicas que não seguem obrigatoriamente a curva de Gauss.
            </p>
         </div>
      </div>
    </motion.div>
  )
}

export default AnalysisReviewPlan
