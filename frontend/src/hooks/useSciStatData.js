import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL + '/api'

export function useSciStatData() {
  const { session, isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [history, setHistory] = useState([])
  const [trials, setTrials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !session?.sessionToken) return

    const headers = {
        'Authorization': `Bearer ${session.sessionToken}`
    }

    try {
      setError(null)
      const [notifRes, histRes, trialsRes] = await Promise.all([
        fetch(`${API_BASE}/notifications`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/history`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/trials`, { headers }).then(r => r.json())
      ])

      setNotifications(Array.isArray(notifRes) ? notifRes : [])
      setHistory(Array.isArray(histRes) ? histRes : [])
      setTrials(Array.isArray(trialsRes) ? trialsRes : [])
    } catch (err) {
      console.error("Failed to fetch SciStat authenticated data:", err)
      setError('Falha ao conectar com o servidor. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, session])

  const clearNotifications = async () => {
    if (!isAuthenticated || !session?.sessionToken) return
    const headers = { 'Authorization': `Bearer ${session.sessionToken}` }
    try {
      await fetch(`${API_BASE}/notifications/clear`, { method: 'POST', headers })
      setNotifications([])
    } catch (err) {
      console.error("Failed to clear notifications")
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchData])

  return { notifications, history, trials, loading, error, refresh: fetchData, clearNotifications }
}
