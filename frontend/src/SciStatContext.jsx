import { createContext, useContext } from 'react'
import { useSciStatData } from './hooks/useSciStatData'

const SciStatContext = createContext()

export function SciStatProvider({ children }) {
  const data = useSciStatData()
  
  return (
    <SciStatContext.Provider value={data}>
      {children}
    </SciStatContext.Provider>
  )
}

export function useSciStat() {
  const context = useContext(SciStatContext)
  if (!context) {
    throw new Error('useSciStat must be used within a SciStatProvider')
  }
  return context
}
