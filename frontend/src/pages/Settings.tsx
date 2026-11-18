import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings as SettingsIcon, Globe, Bell, Shield, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
]

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Logged out successfully.')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>
        <p className="text-gray-500 mt-1">Manage your KisanAI preferences</p>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Globe size={18} className="text-primary-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Language</h2>
            <p className="text-sm text-gray-500">Set your preferred language</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); toast.success(`Language changed to ${lang.label}`) }}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                i18n.language === lang.code
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Bell size={18} className="text-blue-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">Control app notifications</p>
          </div>
        </div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">Enable farming alerts</span>
          <div
            onClick={() => setNotifications(n => !n)}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${notifications ? 'bg-primary-700' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </label>
      </div>

      {/* Privacy */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-green-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Privacy & Data</h2>
            <p className="text-sm text-gray-500">How KisanAI uses your data</p>
          </div>
        </div>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li>• Leaf images are stored only for your scan history</li>
          <li>• Location data is used only for weather and store searches</li>
          <li>• Chat messages are processed by the AI chatbot</li>
          <li>• No data is sold to third parties</li>
        </ul>
      </div>

      {/* Account Actions */}
      {isAuthenticated && (
        <div className="card border-red-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 size={18} className="text-red-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Account</h2>
              <p className="text-sm text-gray-500">Manage your account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 font-medium hover:underline flex items-center gap-2">
            Sign out of KisanAI
          </button>
        </div>
      )}

      {/* App info */}
      <div className="card bg-gray-50">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-700">About KisanAI</h2>
        </div>
        <p className="text-sm text-gray-500">Version 1.0.0</p>
        <p className="text-xs text-gray-400 mt-1">
          Built for Indian farmers. AI-powered crop disease detection, multilingual chatbot, real-time weather and market prices.
        </p>
      </div>
    </div>
  )
}
