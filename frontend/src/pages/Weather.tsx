import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Cloud, Thermometer, Droplets, Wind, AlertTriangle, MapPin, RefreshCw } from 'lucide-react'
import { getWeather } from '../lib/api'
import type { WeatherData } from '../types'
import toast from 'react-hot-toast'

export default function Weather() {
  const { t } = useTranslation()
  const [data, setData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationName, setLocationName] = useState('')

  const fetchWeather = async (lat: number, lon: number, name: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getWeather(lat, lon, name)
      setData(result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to fetch weather.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const name = `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`
        fetchWeather(pos.coords.latitude, pos.coords.longitude, locationName || name)
      },
      () => {
        setLoading(false)
        toast.error('Location access denied. Using default location (Hyderabad).')
        fetchWeather(17.385, 78.4867, 'Hyderabad, Telangana')
      }
    )
  }

  // Load default on mount
  useEffect(() => { fetchWeather(17.385, 78.4867, 'Hyderabad, Telangana') }, [])

  const WMO_ICONS: Record<number, string> = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
    80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('weather.title')}</h1>
          <p className="text-gray-500 mt-1">{t('weather.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            placeholder="Location name (optional)"
            className="input-field w-48 py-2"
          />
          <button onClick={getLocation} disabled={loading} className="btn-primary flex items-center gap-2 py-2">
            <MapPin size={16} /> {loading ? 'Fetching...' : 'My Location'}
          </button>
          {data && (
            <button onClick={() => data && fetchWeather(data.latitude, data.longitude, data.location)} disabled={loading} className="btn-secondary p-2">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>
      )}

      {loading && !data && (
        <div className="card flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Cloud size={40} className="text-gray-300 mx-auto animate-pulse" />
            <p className="text-gray-500">Fetching weather...</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Current Weather */}
          <div className="bg-gradient-to-br from-sky-500 to-blue-700 text-white rounded-2xl p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="opacity-80" />
                  <span className="text-sky-100 font-medium">{data.location}</span>
                </div>
                <div className="text-7xl font-bold">
                  {data.temperature_c?.toFixed(1)}°C
                </div>
                <div className="text-sky-100 mt-2">{data.weather_description}</div>
                <div className="text-sky-200 text-sm mt-1">
                  Feels like {data.feels_like_c?.toFixed(1)}°C
                </div>
              </div>
              <div className="text-7xl">{WMO_ICONS[data.weather_code] || '🌡️'}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-sky-400/50">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="opacity-70" />
                <div>
                  <p className="text-sky-200 text-xs">{t('weather.humidity')}</p>
                  <p className="font-semibold">{data.humidity_percent}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Cloud size={18} className="opacity-70" />
                <div>
                  <p className="text-sky-200 text-xs">{t('weather.rainfall')}</p>
                  <p className="font-semibold">{data.rainfall_mm} mm</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind size={18} className="opacity-70" />
                <div>
                  <p className="text-sky-200 text-xs">{t('weather.wind')}</p>
                  <p className="font-semibold">{data.wind_speed_kmh} km/h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Farming Advisory */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-amber-900">{t('weather.advisory')}</h3>
                <p className="text-amber-800 text-sm mt-1 leading-relaxed">{data.farming_advisory}</p>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          {data.forecast && data.forecast.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">{t('weather.forecast')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {data.forecast.map((day) => (
                  <div key={day.date} className="bg-gray-50 rounded-xl p-3 text-center hover:bg-primary-50 transition-colors">
                    <p className="text-xs font-medium text-gray-500">
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                    </p>
                    <div className="text-2xl my-1">{WMO_ICONS[day.weather_code] || '🌡️'}</div>
                    <p className="text-xs font-semibold text-gray-800">
                      {day.temp_max_c !== undefined ? `${day.temp_max_c?.toFixed(0)}°` : '—'}
                      <span className="text-gray-400"> / </span>
                      {day.temp_min_c !== undefined ? `${day.temp_min_c?.toFixed(0)}°` : '—'}
                    </p>
                    {day.precipitation_mm > 0 && (
                      <p className="text-xs text-blue-600 mt-0.5">💧 {day.precipitation_mm}mm</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">{t('weather.source')}</p>
        </>
      )}
    </div>
  )
}
