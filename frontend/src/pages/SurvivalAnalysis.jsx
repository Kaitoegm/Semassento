import { useEffect } from 'react'
import { motion } from 'framer-motion'
import SurvivalPage from '../components/survival/SurvivalPage'

export default function SurvivalAnalysis() {
  useEffect(() => {
    document.title = 'Sobrevivência — Paper Metrics'
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SurvivalPage />
    </motion.div>
  )
}