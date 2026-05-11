import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingScreen from './components/LoadingScreen'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PowerCalculator from './pages/PowerCalculator'
import SurvivalAnalysis from './pages/SurvivalAnalysis'
import MetaAnalysis from './pages/MetaAnalysis'
import Visualizations from './pages/Visualizations'
import ClinicalTrials from './pages/ClinicalTrials'
import Archive from './pages/Archive'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Admin from './pages/Admin'
import { SciStatProvider } from './SciStatContext'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function AppLayout({ dark, setDark }) {
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'

  return (
    <Layout dark={dark} setDark={setDark}>
      {/* Dashboard is ALWAYS mounted to preserve state/background processes, but only visible on /dashboard */}
      <div 
        style={{ 
          display: isDashboard ? 'block' : 'none', 
          height: '100%',
          opacity: isDashboard ? 1 : 0,
          transition: 'opacity 0.4s ease-in-out'
        }}
      >
        <Dashboard />
      </div>
      
      {/* Outlet renders the other matched routes */}
      <AnimatePresence mode="wait">
        {!isDashboard && (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('pm-theme-mode')
    if (saved) return saved === 'dark'
    return true // Default dark
  })

  const [showLoading, setShowLoading] = useState(() => {
    const shown = sessionStorage.getItem('pm-loading-shown')
    return !shown
  })

  const handleLoadingFinish = useCallback(() => {
    setShowLoading(false)
    sessionStorage.setItem('pm-loading-shown', '1')
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('pm-theme-mode', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('pm-theme-mode', 'light')
    }
  }, [dark])

  return (
    <AuthProvider>
      {showLoading && <LoadingScreen onFinish={handleLoadingFinish} />}
      <SciStatProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/" element={<Landing />} />
          
          <Route element={<ProtectedRoute><AppLayout dark={dark} setDark={setDark} /></ProtectedRoute>}>
            <Route path="/dashboard" element={null} />
            <Route path="/clinical-trials" element={<ClinicalTrials />} />
            <Route path="/survival-analysis" element={<SurvivalAnalysis />} />
            <Route path="/meta-analysis" element={<MetaAnalysis />} />
            <Route path="/visualizations" element={<Visualizations />} />
            <Route path="/power-calculator" element={<PowerCalculator />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          </Route>
        </Routes>
      </SciStatProvider>
    </AuthProvider>
  )
}

export default App
