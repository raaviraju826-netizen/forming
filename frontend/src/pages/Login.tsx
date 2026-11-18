import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { loginFarmer } from '../lib/api'
import { Sprout, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await loginFarmer(identifier, password)
      login(data.access_token, {
        farmer_id: data.farmer_id,
        name: data.farmer_name,
        preferred_language: data.preferred_language || 'en',
      })
      toast.success(`Welcome back, ${data.farmer_name}! 🌿`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#0d1f17] border border-emerald-900/40 rounded-3xl p-8 shadow-2xl shadow-emerald-900/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/30 mb-4">
              <Sprout size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Welcome Back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your KisanAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="email@example.com or 9876543210"
                className="w-full bg-[#071a0f] border border-emerald-900/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-[#071a0f] border border-emerald-900/50 rounded-xl px-4 py-3 pr-11 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <p className="text-center mt-5">
          <Link to="/" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}
