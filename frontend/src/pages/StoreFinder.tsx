import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Navigation, Search, Info } from 'lucide-react'
import { getNearbyStores } from '../lib/api'
import type { StoreResult } from '../types'
import toast from 'react-hot-toast'

export default function StoreFinder() {
  const { t } = useTranslation()
  const location = useLocation()
  const diseaseName = (location.state as { disease?: string })?.disease
  const [stores, setStores] = useState<StoreResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [radius, setRadius] = useState(10)

  const findStores = async () => {
    setLoading(true)
    setError(null)
    setStores([])
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported.')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const data = await getNearbyStores(pos.coords.latitude, pos.coords.longitude, radius)
          setStores(data.stores || [])
          setSearched(true)
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to fetch stores.'
          setError(msg)
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLoading(false)
        toast.error('Location access denied. Please allow location access to find nearby stores.')
      }
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('stores.title')}</h1>
        <p className="text-gray-500 mt-1">{t('stores.subtitle')}</p>
      </div>

      {diseaseName && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex gap-3">
          <Info className="text-primary-600 shrink-0 mt-0.5" size={18} />
          <p className="text-primary-800 text-sm">
            Finding stores near you that may stock agricultural inputs for treating <strong>{diseaseName}</strong>.
          </p>
        </div>
      )}

      <div className="card">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Radius</label>
            <select
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="input-field"
            >
              {[5, 10, 20, 50].map(r => <option key={r} value={r}>{r} km</option>)}
            </select>
          </div>
          <button
            onClick={findStores}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <MapPin size={16} />
            {loading ? 'Searching...' : t('stores.findNearMe')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Could not load stores</p>
          <p>{error}</p>
          {error.includes('GOOGLE_PLACES_API_KEY') && (
            <p className="mt-2 text-xs">
              Configure <code className="bg-red-100 px-1 rounded">GOOGLE_PLACES_API_KEY</code> in backend/.env for live results.
            </p>
          )}
        </div>
      )}

      {searched && stores.length === 0 && !loading && !error && (
        <div className="card text-center py-10">
          <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('stores.noStores')}</p>
          <p className="text-gray-400 text-sm mt-1">Try increasing the search radius or searching manually.</p>
        </div>
      )}

      {stores.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{stores.length} store{stores.length !== 1 ? 's' : ''} found nearby</p>
          {stores.map((store, i) => (
            <div key={store.id || i} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{store.name}</h3>
                    {store.is_verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Verified</span>
                    )}
                    {store.distance_km !== undefined && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {store.distance_km.toFixed(1)} {t('stores.distance')}
                      </span>
                    )}
                  </div>

                  {store.address && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-600">{store.address}</p>
                    </div>
                  )}

                  {store.operating_hours && (
                    <p className="text-xs text-gray-400 mt-1">🕐 {store.operating_hours}</p>
                  )}

                  <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-yellow-800">
                      ⚠️ {t('stores.stockNote')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {store.phone && (
                    <a
                      href={`tel:${store.phone}`}
                      className="btn-secondary text-sm py-1.5 flex items-center gap-1.5"
                    >
                      <Phone size={14} /> {t('stores.callStore')}
                    </a>
                  )}
                  {store.maps_url && (
                    <a
                      href={store.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm py-1.5 flex items-center gap-1.5"
                    >
                      <Navigation size={14} /> {t('stores.getDirections')}
                    </a>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Source: {store.source}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs text-amber-800">{t('stores.disclaimer')}</p>
      </div>
    </div>
  )
}
