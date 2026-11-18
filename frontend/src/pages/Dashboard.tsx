import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getDashboard } from '../lib/api'
import type { DashboardStats } from '../types'
import { Scan, CheckCircle2, AlertCircle, BookMarked, MessageCircle, Sprout } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    setLoading(true)
    getDashboard()
      .then(setStats)
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 space-y-5">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <Sprout size={36} className="text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Farmer Dashboard</h1>
        <p className="text-gray-500">Sign in to track your crop scans, view disease history, and save recommendations.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="btn-primary">Sign In</Link>
          <Link to="/register" className="btn-secondary">Create Account</Link>
        </div>
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">Or explore KisanAI without an account:</p>
          <div className="flex gap-3 justify-center mt-2 flex-wrap">
            <Link to="/detect" className="text-primary-700 text-sm hover:underline">Disease Detection</Link>
            <Link to="/chat" className="text-primary-700 text-sm hover:underline">AI Chatbot</Link>
            <Link to="/weather" className="text-primary-700 text-sm hover:underline">Weather</Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.title')} 👋
        </h1>
        <p className="text-gray-500 mt-1">Welcome back, <strong>{user?.name}</strong></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.totalScans'),     value: stats?.total_scans ?? 0,          icon: Scan,          color: 'bg-primary-50 text-primary-700' },
          { label: t('dashboard.healthyCrops'),   value: stats?.healthy_crops ?? 0,         icon: CheckCircle2,  color: 'bg-green-50 text-green-700'    },
          { label: t('dashboard.diseaseDetected'),value: stats?.disease_detected ?? 0,      icon: AlertCircle,   color: 'bg-red-50 text-red-700'        },
          { label: t('dashboard.savedRecs'),      value: stats?.saved_recommendations ?? 0, icon: BookMarked,    color: 'bg-purple-50 text-purple-700'  },
        ].map(s => (
          <div key={s.label} className="card hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
              <s.icon size={20} />
            </div>
            <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/detect',  label: 'Scan a Leaf',      emoji: '🌿', color: 'bg-primary-50 hover:bg-primary-100 border-primary-200'   },
            { to: '/chat',    label: 'Ask AI Assistant', emoji: '🤖', color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'           },
            { to: '/weather', label: 'Check Weather',    emoji: '☁️', color: 'bg-sky-50 hover:bg-sky-100 border-sky-200'              },
            { to: '/market',  label: 'Market Prices',    emoji: '📊', color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'     },
          ].map(a => (
            <Link key={a.to} to={a.to} className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-colors text-center ${a.color}`}>
              <span className="text-3xl">{a.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Scans */}
      {stats && stats.recent_scans.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{t('dashboard.recentScans')}</h2>
            <Link to="/detect" className="text-sm text-primary-700 font-medium hover:underline">{t('common.viewAll')}</Link>
          </div>
          <div className="space-y-3">
            {stats.recent_scans.map(scan => (
              <div key={scan.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                {scan.image_url && (
                  <img
                    src={`http://localhost:8000${scan.image_url}`}
                    alt="Crop"
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{scan.crop_name || 'Unknown Crop'}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {scan.predicted_class?.replace('___', ' — ').replace(/_/g, ' ') || 'No prediction'}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  scan.is_healthy ? 'badge-healthy' : 'badge-disease'
                }`}>
                  {scan.is_healthy ? 'Healthy' : 'Disease'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card py-10 text-center">
          <Scan size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No scans yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload a leaf image to get started</p>
          <Link to="/detect" className="btn-primary mt-4 inline-flex">Start Scanning</Link>
        </div>
      )}

      {/* Conversations */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-primary-600" />
          <div>
            <p className="font-semibold text-gray-900">{t('dashboard.recentChats')}</p>
            <p className="text-sm text-gray-500">{stats?.recent_conversations ?? 0} conversation(s)</p>
          </div>
        </div>
        <Link to="/chat" className="btn-secondary text-sm">Open Chat</Link>
      </div>
    </div>
  )
}
