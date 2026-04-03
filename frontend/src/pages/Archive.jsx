import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSciStat } from '../SciStatContext'
import { useAuth } from '../AuthContext'

const API_URL = import.meta.env.VITE_API_BASE_URL

const ARCHIVE_ICONS = {
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 19V9C22 7.89543 21.1046 7 20 7H11L9 4H4C2.89543 4 2 4.89543 2 6V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  table: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9H21M9 3V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  drive: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  restore: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12V11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11V12M18 12L21 9M18 12L15 9M20 12V13C20 16.866 16.866 20 13 20C9.13401 20 6 16.866 6 13V12M6 12L3 15M6 12L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  file: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 2V9H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Archive() {
  const { session, isAuthenticated } = useAuth()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated || !session?.sessionToken) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/api/history`, {
          headers: { 'Authorization': `Bearer ${session.sessionToken}` }
        })
        const data = await res.json()
        const mapped = (Array.isArray(data) ? data : []).map(h => ({
          id: h.id,
          name: h.filename,
          type: 'Análise',
          outcome: h.outcome || 'N/A',
          date: h.created_at ? new Date(h.created_at).toLocaleDateString('pt-BR') : 'N/A',
          results: h.results || [],
          restoring: false,
          restored: false
        }))
        setItems(mapped)
      } catch (err) {
        console.error('Failed to fetch archive:', err)
      }
      setLoading(false)
    }
    fetchHistory()
  }, [isAuthenticated, session])

  const filtered = items.filter(i => {
    if (!search) return true
    const q = search.toLowerCase()
    return i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q) || (i.outcome && i.outcome.toLowerCase().includes(q))
  })

  const restore = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, restoring: true } : i))
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, restoring: false, restored: true } : i))
    }, 1200)
  }

  return (
    <div className="space-y-10">
      <header className="relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            <span className="text-primary glow-text-sm">Histórico</span>
          </h1>
          <p className="text-slate-400 max-w-2xl">Gerencie e restaure conjuntos de dados, protocolos e relatórios de estudos finalizados.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Análises Totais', value: items.length, icon: ARCHIVE_ICONS.folder, color: 'text-primary' },
          { label: 'Resultados', value: items.filter(i => i.results && i.results.length > 0).length, icon: ARCHIVE_ICONS.table, color: 'text-accent' },
          { label: 'Desfechos Únicos', value: [...new Set(items.map(i => i.outcome))].length, icon: ARCHIVE_ICONS.drive, color: 'text-slate-400' },
          { label: 'Restaurados', value: items.filter(i => i.restored).length, icon: ARCHIVE_ICONS.restore, color: 'text-emerald-400' },
        ].map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 flex items-center gap-4 hover:border-white/20 transition-colors"
          >
            <div className={`p-3 bg-white/5 rounded-2xl ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-black text-white">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-2 group focus-within:border-primary/50 transition-all"
      >
        <div className="relative flex items-center">
          <span className="absolute left-4 text-slate-500 group-focus-within:text-primary transition-colors">
            {ARCHIVE_ICONS.search}
          </span>
          <input
            type="text"
            placeholder="Pesquisar arquivos por nome, desfecho ou tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-transparent border-none rounded-2xl text-sm focus:outline-none text-white placeholder-slate-600"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nome do Arquivo</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Desfecho</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Resultados</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Data</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {loading ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center animate-pulse text-primary font-black uppercase tracking-widest bg-white/1">Carregando histórico...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-500 italic">Nenhum registro encontrado.</td></tr>
                ) : (
                  filtered.map((item) => (
                    <motion.tr 
                      layout
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-colors ${item.restored ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl transition-colors ${item.restored ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 bg-white/5 group-hover:bg-white/10 group-hover:text-slate-300'}`}>
                            {ARCHIVE_ICONS.file}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                            <p className="text-[10px] font-medium text-slate-600">ID: ARCH-{item.id?.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-white/5 rounded-full border border-white/5">{item.outcome}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500">{item.results?.length || 0} testes</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{item.date}</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <button
                          onClick={() => restore(item.id)}
                          disabled={item.restoring || item.restored}
                          className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                            item.restored
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                              : item.restoring
                                ? 'bg-primary/20 text-primary border border-primary/30 opacity-75'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span className={item.restoring ? 'animate-spin' : ''}>
                            {ARCHIVE_ICONS.restore}
                          </span>
                          {item.restored ? 'Restaurado' : item.restoring ? 'Restaurando...' : 'Restaurar'}
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="px-8 py-5 border-t border-white/5 text-[10px] font-bold text-slate-600 flex justify-between items-center">
          <span>Exibindo {filtered.length} de {items.length} análises</span>
        </div>
      </motion.div>
    </div>
  )
}
