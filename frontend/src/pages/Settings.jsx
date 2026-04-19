import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const STORAGE_KEY = 'pm-settings'

const defaultSettings = {
  notifications: [
    { label: 'E-mail ao terminar análise', value: true, icon: 'mail' },
    { label: 'Alerta de novo ensaio clínico', value: true, icon: 'clinical_notes' },
    { label: 'Relatório diário de telemetria', value: false, icon: 'analytics' }
  ],
  integration: [
    { label: 'Sincronizar com Neon Cloud', value: true, icon: 'database' },
    { label: 'Exportação automática em XLSX', value: false, icon: 'file_export' },
  ]
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return defaultSettings
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(false)

  const toggle = (section, index) => {
    setSettings(prev => {
      const updated = { ...prev }
      updated[section] = prev[section].map((item, i) =>
        i === index ? { ...item, value: !item.value } : item
      )
      return updated
    })
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDiscard = () => {
    setSettings(loadSettings())
    setSaved(false)
  }

  const settingsSections = [
    { title: 'Notificações', key: 'notifications', items: settings.notifications },
    { title: 'Integração de Dados', key: 'integration', items: settings.integration }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 lg:p-10 max-w-[1000px] mx-auto space-y-12"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Ajustes do Sistema</h1>
        <p className="text-sm text-stone-500 font-medium">Configure suas preferências de análise e segurança.</p>
      </header>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-xs font-semibold tracking-wide text-center"
        >
          Ajustes salvos com sucesso
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {settingsSections.map((section, idx) => (
          <div key={idx} className="space-y-6">
            <h3 className="text-[11px] font-semibold tracking-wide text-primary px-2">{section.title}</h3>
            <div className="bg-white/5 border border-white/5 rounded-xl p-2">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  onClick={() => toggle(section.key, i)}
                  className="flex items-center justify-between p-6 hover:bg-white/5 rounded-[24px] group transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-stone-400 group-hover:text-primary transition-colors">
                      <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">{item.label}</span>
                  </div>

                  <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${item.value ? 'bg-primary/50' : 'bg-stone-800'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${item.value ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="bg-stone-950 border border-white/5 p-10 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <span className="material-symbols-rounded text-3xl">cloud_sync</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Status da Conectividade</h3>
              <p className="text-[11px] text-stone-500 font-bold tracking-wide">Serviços Neon PostgreSQL</p>
            </div>
          </div>

          <div className="flex items-center gap-12 pt-4">
            <div>
              <p className="text-[10px] tracking-wide font-bold text-stone-500 mb-1">Database API</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-white italic">OPERATIONAL</span>
              </div>
            </div>
            <div>
                <p className="text-[10px] tracking-wide font-bold text-stone-500 mb-1">SSL Encrypted</p>
                <span className="text-xs font-semibold text-white italic">REQUIRED</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-10">
        <button onClick={handleDiscard} className="px-8 py-3.5 rounded-xl border border-white/10 text-xs font-bold text-stone-500 hover:bg-white/5 transition-all">Descartar Alterações</button>
        <button onClick={handleSave} className="px-8 py-3.5 rounded-xl bg-primary text-stone-900 text-xs font-semibold tracking-wide hover:scale-105 transition-all">Salvar Ajustes</button>
      </div>
    </motion.div>
  )
}
