import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

function ForestPlot({ className }) {
  return (
    <svg viewBox="0 0 40 20" preserveAspectRatio="xMidYMid meet" className={className} fill="currentColor">
      <rect x="0" y="8" width="40" height="4" />
      <polygon points="20,0 30,10 20,20 10,10" />
    </svg>
  )
}

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
        localStorage.setItem('pm-token', data.token)
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais.')
    }
    setEmailLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background selection:bg-primary/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface w-full max-w-[420px] p-10 rounded-xl border border-border-subtle relative z-10"
      >
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary mb-6">
            <span className="text-2xl font-semibold tracking-[-1px]">Paper</span>
            <ForestPlot className="w-6 h-3" />
            <span className="text-2xl font-semibold tracking-[-1px]">Metrics</span>
          </div>
          <p className="text-text-muted text-sm leading-relaxed px-4">Plataforma de análise estatística e bioestatística para pesquisa científica.</p>
        </header>

        {error && (
          <div className="mb-6 p-3 bg-stone-100 dark:bg-stone-900 border border-border-subtle rounded-lg text-text-main text-xs font-medium text-center">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-text-main text-background font-medium text-sm rounded-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                Conectando...
              </span>
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Continuar com Google
              </>
            )}
          </button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle"></div></div>
            <div className="relative flex justify-center text-[11px] font-medium text-text-muted bg-surface px-3">ou entre com e-mail</div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3">
             <input
               type="email"
               value={email}
               onChange={e => setEmail(e.target.value)}
               placeholder="E-mail"
               className="w-full py-3 px-4 bg-background border border-border-subtle rounded-lg text-sm outline-none text-text-main placeholder-text-muted focus:ring-1 focus:ring-primary/40 transition-all"
             />
             <input
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               placeholder="Senha"
               className="w-full py-3 px-4 bg-background border border-border-subtle rounded-lg text-sm outline-none text-text-main placeholder-text-muted focus:ring-1 focus:ring-primary/40 transition-all"
             />
             <button
               type="submit"
               disabled={emailLoading}
               className="w-full py-3 bg-primary/10 border border-primary/20 text-primary font-medium text-sm rounded-lg hover:bg-primary/15 transition-all disabled:opacity-50"
             >
               {emailLoading ? 'Autenticando...' : 'Entrar com senha'}
             </button>
          </form>
        </div>

        <footer className="mt-10 pt-6 border-t border-border-subtle text-center">
           <p className="text-text-muted text-[11px] leading-relaxed">
             Ao entrar você concorda com nossos <br />
             <span className="text-text-main hover:text-primary transition-colors cursor-pointer">Termos de Uso</span> e <span className="text-text-main hover:text-primary transition-colors cursor-pointer">Políticas de Privacidade</span>
           </p>
        </footer>
      </motion.div>
    </div>
  )
}
