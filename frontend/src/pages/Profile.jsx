import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSciStat } from '../SciStatContext'

const certifications = [
  { name: 'GCP - Boas Práticas Clínicas', expiry: 'Jan 2027', icon: 'verified_user' },
  { name: 'Análise Estatística Avançada', expiry: 'Mar 2027', icon: 'analytics' },
  { name: 'Bioética em Pesquisa', expiry: 'Jun 2027', icon: 'health_and_safety' },
]

const teamMembers = [
  { name: 'Dr. Ana Silva', role: 'Análise de Dados', initial: 'A' },
  { name: 'Dr. Bruno Costa', role: 'Bioinformática', initial: 'B' },
  { name: 'Dra. Carla Souza', role: 'Campo', initial: 'C' },
]

export default function Profile() {
  const { trials, history } = useSciStat()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [pdfModal, setPdfModal] = useState(null)

  const stats = [
    { label: 'Pesquisas Ativas', value: trials.filter(t => t.status === 'Ativo' || t.status === 'Recrutando').length, icon: 'science' },
    { label: 'Dados Processados', value: `${history.length}`, icon: 'database' },
    { label: 'Ensaios Clínicos', value: trials.length, icon: 'article' },
    { label: 'Status da Rede', value: 'Online', icon: 'wifi' }
  ]

  const handleInvite = (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteSent(true)
    setTimeout(() => {
      setShowInvite(false)
      setInviteSent(false)
      setInviteEmail('')
    }, 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-12"
    >
      <header className="flex flex-col md:flex-row items-center gap-8 bg-white/5 p-10 rounded-xl border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="w-32 h-32 rounded-xl bg-stone-800 border-2 border-primary/20 flex items-center justify-center text-4xl font-semibold text-primary italic shadow-2xl relative z-10">
          SC
        </div>

        <div className="text-center md:text-left relative z-10">
          <h1 className="text-4xl font-semibold text-white mb-2">Cientista de Dados</h1>
          <p className="text-primary font-bold tracking-wide text-xs mb-4">
            Pesquisador Principal • Bioestatística
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-stone-400">
              Paper Metrics Lab
            </span>
            <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-stone-400">ID: SCR-RealTime</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/5 p-6 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-rounded text-primary mb-4 block text-3xl">{s.icon}</span>
            <p className="text-2xl font-semibold text-white">{s.value}</p>
            <p className="text-[10px] tracking-wide font-bold text-stone-500">{s.label}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-white px-2">Certificações & Acessos</h3>
          <div className="space-y-4">
            {certifications.map((cert, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-xl group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                    <span className="material-symbols-rounded">{cert.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{cert.name}</h4>
                    <p className="text-[10px] text-stone-500">Expira em: {cert.expiry}</p>
                  </div>
                </div>
                <button onClick={() => setPdfModal(cert)} className="text-[10px] font-semibold text-primary tracking-wider opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Ver PDF</button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white px-2">Equipe</h3>
          <div className="bg-white/5 border border-white/5 rounded-xl p-8 space-y-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-800 border border-white/5 flex items-center justify-center text-xs font-semibold text-primary">
                  {member.initial}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{member.name}</p>
                  <p className="text-[10px] text-primary/70">{member.role}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setShowInvite(true)} className="w-full py-4 rounded-2xl border border-white/10 text-[11px] font-bold text-stone-400 hover:bg-white/5 transition-all">Convidar Colaborador</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md rounded-xl p-8 border-white/10"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Convidar Colaborador</h2>
              {inviteSent ? (
                <div className="text-center py-8">
                  <span className="material-symbols-rounded text-primary text-5xl mb-4 block">check_circle</span>
                  <p className="text-sm font-bold text-white">Convite enviado com sucesso!</p>
                </div>
              ) : (
                <form onSubmit={handleInvite}>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="E-mail do colaborador..."
                    className="w-full py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-sm outline-none text-white placeholder-stone-600 focus:ring-1 focus:ring-primary/40 mb-4"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-3 rounded-2xl border border-white/10 text-xs font-bold text-stone-400 hover:bg-white/5 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 rounded-2xl bg-primary text-black text-xs font-semibold tracking-wide hover:brightness-110 transition-all">Enviar</button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pdfModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => setPdfModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="glass-card w-full max-w-md rounded-xl p-8 border-white/10 text-center"
            >
              <span className="material-symbols-rounded text-primary text-5xl mb-4 block">description</span>
              <h2 className="text-xl font-semibold text-white mb-2">{pdfModal.name}</h2>
              <p className="text-xs text-stone-500 mb-6">Certificado válido até {pdfModal.expiry}</p>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 mb-6">
                <p className="text-[10px] text-stone-400 tracking-wide">Este é um certificado de qualificação profissional emitido pela plataforma Paper Metrics. Em ambiente de produção, o PDF completo seria gerado e baixado aqui.</p>
              </div>
              <button onClick={() => setPdfModal(null)} className="w-full py-3 rounded-2xl bg-primary text-black text-xs font-semibold tracking-wide hover:brightness-110 transition-all">Fechar</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
