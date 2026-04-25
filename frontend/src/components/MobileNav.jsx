import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/dashboard',         icon: 'dashboard',         label: 'Painel' },
  { to: '/archive',           icon: 'folder',            label: 'Projetos' },
  { to: '/meta-analysis',     icon: 'stacked_bar_chart', label: 'Meta' },
  { to: '/visualizations',    icon: 'stacked_line_chart',label: 'Gráficos' },
  { to: '/settings',          icon: 'settings',          label: 'Ajustes' },
]

export default function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div
        className="flex justify-around items-center px-2 h-16 mx-3 mb-2 rounded-2xl"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {TABS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted active:scale-95'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-rounded text-[22px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
