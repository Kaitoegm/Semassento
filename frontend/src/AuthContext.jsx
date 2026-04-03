import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createAuthClient } from '@neondatabase/auth'

const AuthContext = createContext()

const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const hasCheckedSession = useRef(false)

  const fetchSession = async (retryCount = 0) => {
    try {
      const result = await authClient.getSession()
      if (result.data?.session && result.data?.user) {
        setSession(result.data.session)
        setUser(result.data.user)
      } else if (retryCount < 3) {
        // Retry after callback redirect (session cookie may take a moment)
        setTimeout(() => fetchSession(retryCount + 1), 500)
        return
      } else {
        setSession(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Session error:', error)
      if (retryCount < 3) {
        setTimeout(() => fetchSession(retryCount + 1), 500)
        return
      }
    } finally {
      if (retryCount >= 3 || hasCheckedSession.current) {
        setLoading(false)
      }
      hasCheckedSession.current = true
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin + '/login'
      })
      if (result.error) throw result.error
    } catch (error) {
      console.error('Google Sign-In Error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authClient.signOut()
      setSession(null)
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Sign Out Error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!session
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
