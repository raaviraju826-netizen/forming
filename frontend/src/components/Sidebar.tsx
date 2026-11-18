import { NavLink } from 'react-router-dom'
import {
  X, Home, LayoutDashboard, Scan, ShieldCheck,
  MapPin, MessageCircle, Cloud, TrendingUp, Wheat, Settings
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  { to: '/',          icon: Home,            labelKey: 'nav.home',     exact: true,  color: 'text-emerald-400' },
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard',              color: 'text-purple-400'  },
  { to: '/detect',    icon: Scan,            labelKey: 'nav.detect',                 color: 'text-orange-400'  },
  { to: '/treatment', icon: ShieldCheck,     labelKey: 'nav.treatment',              color: 'text-cyan-400'    },
  { to: '/stores',    icon: MapPin,          labelKey: 'nav.stores',                 color: 'text-yellow-400'  },
  { to: '/chat',      icon: MessageCircle,   labelKey: 'nav.chatbot',                color: 'text-pink-400'    },
  { to: '/weather',   icon: Cloud,           labelKey: 'nav.weather',                color: 'text-sky-400'     },
  { to: '/market',    icon: TrendingUp,      labelKey: 'nav.market',                 color: 'text-lime-400'    },
  { to: '/farm',      icon: Wheat,           labelKey: 'nav.myfarm',                 color: 'text-amber-400'   },
  { to: '/settings',  icon: Settings,        labelKey: 'nav.settings',               color: 'text-gray-400'    },
]

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={onClose} />}

      <aside className={`
        fixed md:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-[#050d0a]/95 backdrop-blur-xl border-r border-emerald-900/30
        flex flex-col overflow-y-auto z-30 transition-transform duration-300 ease-in-out shrink-0
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close */}
        <div className="p-4 flex items-center justify-between md:hidden border-b border-white/5">
          <span className="font-semibold text-gray-200">Menu</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, labelKey, exact, color }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-500/15 text-white border border-emerald-500/20'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={`shrink-0 ${isActive ? color : 'text-gray-600 group-hover:text-gray-400'} transition-colors`} />
                  {t(labelKey)}
                  {isActive && <span className={`ml-auto w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-xs text-emerald-400 font-semibold">KisanAI v1.0</p>
            </div>
            <p className="text-xs text-gray-500">Smart Farming · Healthy Crops · Better Future</p>
          </div>
        </div>
      </aside>
    </>
  )
}
