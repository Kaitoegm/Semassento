import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Login() {
  const { signInWithGoogle, isAuthenticated, loading: authLoading } = useAuth()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Falha ao autenticar com Google. Tente novamente.')
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.')
      return
    }
    setEmailLoading(true)
    setError(null)
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Credenciais inválidas.')
      }
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('scistat-token', data.token)
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais.')
    }
    setEmailLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a1a] selection:bg-primary/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-[440px] p-12 rounded-[3rem] border-white/5 relative z-10"
      >
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 mb-6 group hover:scale-110 transition-transform cursor-pointer">
             <span className="material-symbols-rounded text-primary text-3xl group-hover:rotate-12 transition-transform">science</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">SciStat <span className="text-primary italic">v4</span></h1>
          <p className="text-slate-500 font-medium px-4">Plataforma de Inteligência Estatística e Bioestatística de Alta Fidelidade.</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-[10px] font-black uppercase text-center tracking-widest">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 py-5 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Conectando...
              </span>
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                Continuar com Google
              </>
            )}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 bg-transparent px-4">ou entre com e-mail</div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
             <input
               type="email"
               value={email}
               onChange={e => setEmail(e.target.value)}
               placeholder="E-mail"
               className="w-full py-4 px-6 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none text-white placeholder-slate-600 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
             />
             <input
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               placeholder="Senha"
               className="w-full py-4 px-6 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none text-white placeholder-slate-600 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
             />
             <button
               type="submit"
               disabled={emailLoading}
               className="w-full py-4 bg-primary/10 border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary/20 transition-all disabled:opacity-50"
             >
               {emailLoading ? 'Autenticando...' : 'Entrar com Senha'}
             </button>
          </form>
        </div>

        <footer className="mt-12 pt-8 border-t border-white/5 text-center">
           <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] leading-relaxed">
             Ao entrar você concorda com nossos <br />
             <span className="text-slate-400 hover:text-primary transition-colors cursor-pointer">Termos de Uso</span> e <span className="text-slate-400 hover:text-primary transition-colors cursor-pointer">Políticas de Privacidade</span>
           </p>
        </footer>
      </motion.div>
    </div>
  )
}
