import { Link, useNavigate } from 'react-router-dom'
import { Menu, Sprout, LogOut, User, Globe, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' },
]

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav className="bg-[#050d0a]/95 backdrop-blur-xl border-b border-emerald-900/30 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Left: menu + logo */}
          <div className="flex items-center gap-3">
            <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-white/5 md:hidden" aria-label="Open menu">
              <Menu size={22} className="text-gray-400" />
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                <Sprout size={20} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">KisanAI</span>
                <span className="block text-xs text-gray-500 leading-none hidden sm:block">Smart Farming</span>
              </div>
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors"
              >
                <Globe size={15} />
                <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === i18n.language)?.label || 'English'}</span>
                <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-[#0d1f17] border border-emerald-900/50 rounded-xl shadow-xl py-1 min-w-[130px] z-50">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        i18n.language === lang.code
                          ? 'text-emerald-400 bg-emerald-500/10 font-semibold'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors"
                >
                  <User size={15} />
                  <span className="max-w-[90px] truncate">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-sm font-medium transition-colors"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/10 rounded-lg transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-lg font-semibold text-sm text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
