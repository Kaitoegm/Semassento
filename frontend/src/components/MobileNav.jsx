import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/dashboard', icon: 'dashboard' },
  { to: '/clinical-trials', icon: 'science' },
  { to: '/power-calculator', icon: 'calculate' },
]

export default function MobileNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/60 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center px-6 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      {TABS.map(({ to, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
              isActive ? 'text-primary scale-110 drop-shadow-[0_0_10px_rgba(0,255,163,0.3)]' : 'text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="material-symbols-rounded text-2xl">{icon}</span>
              <div className={`w-1 h-1 rounded-full bg-primary transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
