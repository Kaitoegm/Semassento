import { useState, useRef } from 'react'
import { API_BASE } from '../api'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadZone({ onUploadSuccess, onUploadError }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/api/data/upload`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      if (response.ok) {
        onUploadSuccess(data)
      } else {
        onUploadError(data.detail || 'Erro ao processar arquivo')
      }
    } catch (err) {
      onUploadError('Falha na conexão com o servidor de análise.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          handleFile(file)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative overflow-hidden cursor-pointer
          border-2 border-dashed transition-all duration-500
          rounded-[2.5rem] p-12 text-center
          ${isDragging 
            ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(0,255,163,0.2)]' 
            : 'border-white/10 hover:border-primary/40 glass-card bg-white/2'}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`p-5 rounded-full transition-colors duration-500 ${isDragging ? 'bg-primary text-slate-900' : 'bg-primary/10 text-primary'}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          
          <div>
            <h3 className="text-xl font-black text-white">Importar Protocolos Científicos</h3>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Arraste seu arquivo <span className="text-primary">.CSV</span> ou <span className="text-accent">.XLSX</span> aqui para análise instantânea.
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">Máx 50MB</span>
            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">BioStat Validated</span>
          </div>
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Processando Engine de Dados...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
