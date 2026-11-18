import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { registerFarmer, loginFarmer } from '../lib/api'
import { Sprout, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
]

const INDIAN_STATES = [
  '', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const inputClass = "w-full bg-[#071a0f] border border-emerald-900/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    preferred_language: 'en', state: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast.error('Please provide an email address or phone number.')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      // Step 1: Register
      await registerFarmer({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        password: form.password,
        preferred_language: form.preferred_language,
        state: form.state || undefined,
      })

      // Step 2: Auto-login
      const identifier = form.email.trim() || form.phone.trim()
      const data = await loginFarmer(identifier, form.password)
      login(data.access_token, {
        farmer_id: data.farmer_id,
        name: data.farmer_name,
        preferred_language: data.preferred_language || form.preferred_language,
      })

      toast.success(`Welcome to KisanAI, ${form.name}! 🌿`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        <div className="bg-[#0d1f17] border border-emerald-900/40 rounded-3xl p-8 shadow-2xl shadow-emerald-900/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg shadow-emerald-500/30 mb-4">
              <Sprout size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join KisanAI — it's completely free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name *</label>
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="Raju Kumar"
                className={inputClass}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="farmer@example.com"
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="9876543210"
                className={inputClass}
              />
              <p className="text-xs text-gray-600 mt-1">Provide at least email or phone</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Minimum 6 characters"
                className={inputClass}
                required
                minLength={6}
              />
            </div>

            {/* Language + State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Language</label>
                <select value={form.preferred_language} onChange={set('preferred_language')} className={inputClass}>
                  {LANG_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">State</label>
                <select value={form.state} onChange={set('state')} className={inputClass}>
                  {INDIAN_STATES.map(s => <option key={s || '_'} value={s}>{s || 'Select…'}</option>)}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 mt-2"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>Create Free Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-5">
          <Link to="/" className="text-gray-600 text-sm hover:text-gray-400 transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}
