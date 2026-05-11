import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import ResearchAssistant from './ResearchAssistant'

export default function Layout({ children, dark, setDark }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const location = useLocation()
  return (
    <div className="min-h-screen text-text-main selection:bg-primary/20 selection:text-primary">
      {/* Background Layer */}
      <div className="mesh-gradient">
        <div className="mesh-gradient scientific-dot-bg"></div>
      </div>

      <Header dark={dark} setDark={setDark} setIsAssistantOpen={setIsAssistantOpen} />
      {/* Espaçador para compensar o header fixed */}
      <div className="h-16" />

      <div className="flex">
        <Sidebar />
        <main className="lg:ml-24 xl:ml-64 w-full p-4 sm:p-6 lg:p-10 pb-24 lg:pb-10 space-y-6 sm:space-y-10 max-w-[1600px] mx-auto z-10 relative overflow-x-hidden">
          {children}
        </main>
      </div>

      <ResearchAssistant isOpen={isAssistantOpen} setIsOpen={setIsAssistantOpen} />
      <MobileNav />
    </div>
  )
}
