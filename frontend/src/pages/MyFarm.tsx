import { Link } from 'react-router-dom'
import { Wheat, Scan, Cloud, TrendingUp, MessageCircle } from 'lucide-react'

export default function MyFarm() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Farm</h1>
        <p className="text-gray-500 mt-1">Manage your farm profile and crop records</p>
      </div>

      {/* Farm profile placeholder */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Wheat size={24} className="text-primary-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Farm Profile</h2>
            <p className="text-sm text-gray-500">Complete your farm details for better recommendations</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Farm Name', placeholder: 'e.g. Krishna Farms' },
            { label: 'Land Area (acres)', placeholder: 'e.g. 5.5' },
            { label: 'Primary Crops', placeholder: 'e.g. Tomato, Rice, Cotton' },
            { label: 'Irrigation Type', placeholder: 'e.g. Drip, Flood, Sprinkler' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
              <input placeholder={f.placeholder} className="input-field" />
            </div>
          ))}
        </div>

        <button className="btn-primary mt-5">Save Farm Profile</button>
        <p className="text-xs text-gray-400 mt-2">Farm profile data is stored locally and used to personalize recommendations.</p>
      </div>

      {/* Quick links */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Farm Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/detect',  icon: Scan,          label: 'Scan Crop',      color: 'bg-primary-50 text-primary-700' },
            { to: '/weather', icon: Cloud,          label: 'Weather',        color: 'bg-sky-50 text-sky-700'         },
            { to: '/market',  icon: TrendingUp,     label: 'Prices',         color: 'bg-yellow-50 text-yellow-700'   },
            { to: '/chat',    icon: MessageCircle,  label: 'AI Assistant',   color: 'bg-purple-50 text-purple-700'   },
          ].map(tool => (
            <Link key={tool.to} to={tool.to} className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors hover:opacity-80 ${tool.color}`}>
              <tool.icon size={22} />
              <span className="text-sm font-medium">{tool.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
        <p className="text-sm text-primary-800">
          <strong>Coming soon:</strong> Crop calendar, irrigation scheduling, soil health tracking, and farm expense logger.
        </p>
      </div>
    </div>
  )
}
