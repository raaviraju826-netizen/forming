import { Link } from 'react-router-dom'
import { Scan, MessageCircle, Cloud, TrendingUp, MapPin, ShieldCheck, ArrowRight, Sparkles, Zap, Star } from 'lucide-react'

const FEATURES = [
  {
    icon: Scan,
    title: 'AI Disease Detection',
    desc: 'Upload a leaf photo for instant AI-powered disease identification with real confidence scores.',
    to: '/detect',
    gradient: 'from-orange-500 to-red-600',
    glow: 'shadow-orange-500/40',
    bg: 'from-orange-500/20 to-red-600/10',
    border: 'border-orange-500/30',
  },
  {
    icon: MessageCircle,
    title: 'AI Farming Chatbot',
    desc: 'Ask questions in Telugu, Hindi, or English. Voice-enabled, context-aware RAG-powered answers.',
    to: '/chat',
    gradient: 'from-purple-500 to-pink-600',
    glow: 'shadow-purple-500/40',
    bg: 'from-purple-500/20 to-pink-600/10',
    border: 'border-purple-500/30',
  },
  {
    icon: Cloud,
    title: 'Weather Advisory',
    desc: 'Real-time weather from Open-Meteo with smart farming guidance for your exact location.',
    to: '/weather',
    gradient: 'from-sky-400 to-blue-600',
    glow: 'shadow-sky-500/40',
    bg: 'from-sky-500/20 to-blue-600/10',
    border: 'border-sky-500/30',
  },
  {
    icon: TrendingUp,
    title: 'Market Prices',
    desc: 'Live mandi prices from Agmarknet — know the best time and market to sell your harvest.',
    to: '/market',
    gradient: 'from-yellow-400 to-orange-500',
    glow: 'shadow-yellow-500/40',
    bg: 'from-yellow-500/20 to-orange-500/10',
    border: 'border-yellow-500/30',
  },
  {
    icon: MapPin,
    title: 'Store Finder',
    desc: 'Locate nearby agricultural input shops using GPS. Find seeds, fertilizers, and pesticides.',
    to: '/stores',
    gradient: 'from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/40',
    bg: 'from-emerald-500/20 to-teal-600/10',
    border: 'border-emerald-500/30',
  },
  {
    icon: ShieldCheck,
    title: 'Treatment Guide',
    desc: 'Verified ICAR-sourced agricultural treatments with safety instructions and dosage info.',
    to: '/detect',
    gradient: 'from-cyan-400 to-indigo-600',
    glow: 'shadow-cyan-500/40',
    bg: 'from-cyan-500/20 to-indigo-600/10',
    border: 'border-cyan-500/30',
  },
]

const STATS = [
  { value: '38+', label: 'Crop Diseases', sub: 'Detected by AI' },
  { value: '14+', label: 'Crop Species', sub: 'Supported plants' },
  { value: '3', label: 'Languages', sub: 'TE · HI · EN' },
  { value: '99%', label: 'Free APIs', sub: 'Open-Meteo & more' },
]

const STEPS = [
  { num: '01', title: 'Upload Leaf Photo', desc: 'Take or upload a clear image of your crop leaf from any device', color: 'text-emerald-400' },
  { num: '02', title: 'AI Analyzes', desc: 'MobileNetV2 model identifies diseases with real confidence scores', color: 'text-purple-400' },
  { num: '03', title: 'Get Treatment', desc: 'Receive verified ICAR-backed treatment recommendations instantly', color: 'text-sky-400' },
  { num: '04', title: 'Find Support', desc: 'Locate nearby agri stores and consult the multilingual AI chatbot', color: 'text-orange-400' },
]

export default function Home() {
  return (
    <div className="space-y-0 -mx-4 md:-mx-6 lg:-mx-8 overflow-hidden">

      {/* ━━━━━━━━ HERO ━━━━━━━━ */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#050d0a] overflow-hidden px-6 py-20">
        {/* Animated background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/60 rounded-full animate-bounce"
              style={{
                left: `${5 + (i * 4.7) % 90}%`,
                top: `${10 + (i * 7.3) % 80}%`,
                animationDuration: `${2 + (i % 4)}s`,
                animationDelay: `${(i * 0.3) % 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-8 backdrop-blur-sm">
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
            AI-Powered Smart Farming for Indian Farmers
            <Sparkles size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
              Kisan
            </span>
            <span className="text-white">AI</span>
            <br />
            <span className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-200">
              Your Intelligent
            </span>
            <br />
            <span className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Farming Partner
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Detect crop diseases with AI, get verified treatments, find nearby stores, and ask our
            multilingual chatbot — all in <span className="text-emerald-400 font-semibold">Telugu, Hindi & English</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/detect"
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg overflow-hidden shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #10b981, #0d9488, #059669)' }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Scan size={22} />
              Detect Crop Disease
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/chat"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg border border-purple-500/50 bg-purple-500/10 backdrop-blur-sm hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <MessageCircle size={22} className="text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Ask AI Assistant</span>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div
                key={s.label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-white font-semibold text-sm mt-1">{s.label}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ FEATURES GRID ━━━━━━━━ */}
      <section className="bg-[#070f0b] px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm font-medium mb-5">
              <Zap size={13} /> Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Complete Farming{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Six powerful AI tools built specifically for Indian farmers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <Link
                key={f.title}
                to={f.to}
                className={`group relative bg-gradient-to-br ${f.bg} border ${f.border} rounded-3xl p-6 overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-xl ${f.glow} cursor-pointer`}
              >
                {/* Glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.bg} opacity-0 group-hover:opacity-60 transition-opacity rounded-3xl`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <f.icon size={26} className="text-white" />
                  </div>

                  <h3 className="text-white font-bold text-xl mb-2 group-hover:text-white transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                    {f.desc}
                  </p>

                  <div className={`inline-flex items-center gap-1.5 mt-4 text-sm font-semibold bg-gradient-to-r ${f.gradient} bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Explore <ArrowRight size={14} className="text-current" style={{ color: 'inherit' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ HOW IT WORKS ━━━━━━━━ */}
      <section className="bg-[#050d0a] px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-sm font-medium mb-5">
              <Star size={13} /> Simple 4-Step Process
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              How{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                KisanAI
              </span>{' '}
              Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="relative bg-white/5 border border-white/10 rounded-3xl p-7 hover:bg-white/8 hover:border-white/20 transition-all duration-300 group overflow-hidden"
              >
                {/* Step number background */}
                <div className="absolute -top-4 -right-4 text-[100px] font-black text-white/[0.03] leading-none select-none">
                  {step.num}
                </div>
                <div className={`text-5xl font-black ${step.color} mb-4`}>{step.num}</div>
                <h3 className="text-white font-bold text-xl mb-2">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ SUPPORTED CROPS MARQUEE ━━━━━━━━ */}
      <section className="bg-[#070f0b] py-10 overflow-hidden border-y border-white/5">
        <div className="text-center mb-6">
          <span className="text-gray-500 text-sm font-medium uppercase tracking-widest">Supported Crops</span>
        </div>
        <div className="flex gap-4 animate-marquee whitespace-nowrap">
          {['🍅 Tomato', '🥔 Potato', '🌽 Corn', '🍎 Apple', '🍇 Grape', '🫑 Bell Pepper', '🍑 Peach', '🍒 Cherry', '🍓 Strawberry', '🍊 Orange', '🫛 Squash', '🌱 Soybean', '🫐 Blueberry', '🍃 Wheat', '🌾 Rice', '🧅 Onion',
            '🍅 Tomato', '🥔 Potato', '🌽 Corn', '🍎 Apple', '🍇 Grape', '🫑 Bell Pepper', '🍑 Peach', '🍒 Cherry', '🍓 Strawberry', '🍊 Orange', '🫛 Squash', '🌱 Soybean', '🫐 Blueberry', '🍃 Wheat', '🌾 Rice', '🧅 Onion',
          ].map((crop, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-gray-300 text-sm font-medium shrink-0 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
            >
              {crop}
            </span>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━ CTA BANNER ━━━━━━━━ */}
      <section className="bg-[#050d0a] px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 30%, #0f172a 70%, #1e1b4b 100%)' }}
          >
            {/* Glow spots */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative z-10">
              <div className="text-5xl mb-4">🌿</div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Ready to Transform
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Your Farming?
                </span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of Indian farmers using AI to protect their crops and maximise yield.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/detect"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg hover:scale-105 transition-all shadow-2xl shadow-emerald-500/30"
                  style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                >
                  <Scan size={20} /> Start Detecting Free
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━ DISCLAIMER ━━━━━━━━ */}
      <section className="bg-[#070f0b] px-6 py-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 flex gap-3">
            <ShieldCheck className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <p className="text-amber-200/80 text-sm leading-relaxed">
              <strong className="text-amber-300">Important:</strong> KisanAI is a decision-support tool.
              AI confidence scores reflect model predictions and do not guarantee correctness. Always verify
              results with a qualified agricultural officer or Krishi Vigyan Kendra (KVK) before taking action.
              Helpline: <span className="text-amber-300 font-semibold">1800-180-1551</span> (toll-free).
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
