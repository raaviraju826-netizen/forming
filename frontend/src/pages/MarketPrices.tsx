import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Search, AlertCircle } from 'lucide-react'
import { getMarketPrices } from '../lib/api'
import type { MarketRecord } from '../types'

const INDIAN_STATES = [
  '', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

export default function MarketPrices() {
  const { t } = useTranslation()
  const [records, setRecords] = useState<MarketRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [crop, setCrop] = useState('')
  const [state, setState] = useState('')
  const [searched, setSearched] = useState(false)

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMarketPrices(crop || undefined, state || undefined)
      setRecords(data.records || [])
      setSearched(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to fetch market prices.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchPrices()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('market.title')}</h1>
        <p className="text-gray-500 mt-1">{t('market.subtitle')}</p>
      </div>

      {/* Search bar */}
      <div className="card">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[150px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={crop}
              onChange={e => setCrop(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('market.searchCrop')}
              className="input-field pl-9"
            />
          </div>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="input-field flex-1 min-w-[150px]"
          >
            <option value="">{t('market.selectState')}</option>
            {INDIAN_STATES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={fetchPrices} disabled={loading} className="btn-primary flex items-center gap-2">
            <TrendingUp size={16} />
            {loading ? 'Fetching...' : 'Get Prices'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">{t('market.unavailable')}</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              {error.includes('AGMARKNET_API_KEY') && (
                <div className="mt-2 text-xs text-red-600 space-y-1">
                  <p>To enable market prices:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Register at <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" className="underline">data.gov.in</a></li>
                    <li>Get a free API key</li>
                    <li>Add <code className="bg-red-100 px-1 rounded">AGMARKNET_API_KEY=your_key</code> to <code className="bg-red-100 px-1 rounded">backend/.env</code></li>
                    <li>Restart the backend</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {searched && records.length === 0 && !loading && !error && (
        <div className="card text-center py-10">
          <TrendingUp size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No market records found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different crop name or state filter.</p>
        </div>
      )}

      {/* Results table */}
      {records.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Market Prices</h2>
            <span className="text-sm text-gray-500">{records.length} records</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Commodity', 'Variety', 'Market', 'State', 'Min (₹)', 'Modal (₹)', 'Max (₹)', 'Date'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{r.commodity}</td>
                  <td className="py-3 px-3 text-gray-500">{r.variety || '—'}</td>
                  <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{r.market}</td>
                  <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{r.state}</td>
                  <td className="py-3 px-3 text-blue-700 font-medium">₹{r.min_price?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-green-700 font-bold">₹{r.modal_price?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-red-700 font-medium">₹{r.max_price?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-gray-400 whitespace-nowrap">{r.arrival_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">{t('market.disclaimer')}</p>
        </div>
      )}
    </div>
  )
}
