import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const significance = (p) => {
  if (p == null) return '';
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  return 'ns';
};

export default function BioSummaryTable({ data, outcomeName }) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5"
    >
      <div className="bg-[#2D4F3F] p-6 flex justify-between items-center border-b border-emerald-900/30">
        <h3 className="text-white font-black text-xs uppercase tracking-[0.3em]">
          Sumário Bioestatístico: {outcomeName || 'Outcome'}
        </h3>
        <div className="flex gap-4 text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">
            <span>* Mann-Whitney</span>
            <span>† Kruskal-Wallis</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#365A49]/50 border-b border-emerald-900/20">
              <th className="px-8 py-4 text-[10px] font-black text-emerald-100/60 uppercase tracking-widest w-1/3">Variável</th>
              <th className="px-8 py-4 text-[10px] font-black text-emerald-100/60 uppercase tracking-widest text-center">N</th>
              <th className="px-8 py-4 text-[10px] font-black text-emerald-100/60 uppercase tracking-widest text-center">Mediana (IQR)</th>
              <th className="px-8 py-4 text-[10px] font-black text-emerald-100/60 uppercase tracking-widest text-right">Valor de p</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((variable, idx) => (
              <React.Fragment key={idx}>
                {/* Cabeçalho da Variável */}
                <tr className="bg-white/2 hover:bg-white/5 transition-colors">
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-white tracking-tight">
                      {variable.variable}
                    </span>
                    <span className="ml-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-50">
                      ({variable.test})
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center"></td>
                  <td className="px-8 py-5 text-center"></td>
                  <td className="px-8 py-5 text-right font-mono">
                    <span className={`text-sm font-black ${(variable.p_value != null && variable.p_value < 0.05) ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {variable.p_value != null ? (variable.p_value < 0.001 ? '< 0.001' : variable.p_value.toFixed(3)) : '—'}
                      {variable.symbol || ''}
                    </span>
                  </td>
                </tr>
                {/* Linhas de Categorias */}
                {(variable.categories || []).map((cat, cIdx) => (
                  <tr key={`${idx}-${cIdx}`} className="bg-transparent hover:bg-white/2 transition-colors">
                    <td className="px-12 py-3 text-sm font-medium text-slate-300">
                      {cat.name}
                    </td>
                    <td className="px-8 py-3 text-center text-xs font-mono text-slate-400">
                      {cat.n}
                    </td>
                    <td className="px-8 py-3 text-center text-xs font-mono text-white font-bold">
                      {cat.median != null ? cat.median.toFixed(1) : '—'} ({cat.iqr != null ? cat.iqr.toFixed(1) : '—'})
                    </td>
                    <td className="px-8 py-3 text-right"></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            Paper Metrics Engine • Inferência Linear & Não-Paramétrica
          </p>
      </div>
    </motion.div>
  );
}
