import axios from 'axios'

// In production (Vercel): use relative /api — rewrites route to backend
// In development: VITE_API_URL can override, defaults to relative path (vite proxy handles it)
const API_BASE = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
})

// Inject auth token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisan_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401s
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kisan_token')
      localStorage.removeItem('kisan_user')
    }
    return Promise.reject(err)
  }
)

export const uploadLeafImage = async (file: File, sessionId?: string) => {
  const form = new FormData()
  form.append('file', file)
  if (sessionId) form.append('session_id', sessionId)
  const { data } = await api.post('/disease/predict', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000,
  })
  return data
}

export const getTreatments = async (diseaseId: number) => {
  const { data } = await api.get(`/treatments/${diseaseId}`)
  return data
}

export const getWeather = async (lat: number, lon: number, locationName?: string) => {
  const { data } = await api.get('/weather', {
    params: { lat, lon, location_name: locationName || 'Your Location' },
  })
  return data
}

export const getMarketPrices = async (commodity?: string, state?: string) => {
  const { data } = await api.get('/market-prices', { params: { commodity, state } })
  return data
}

export const getNearbyStores = async (lat: number, lon: number, radiusKm = 10) => {
  const { data } = await api.get('/stores/nearby', { params: { lat, lon, radius_km: radiusKm } })
  return data
}

export const sendChatMessage = async (
  message: string,
  language: string,
  conversationId?: string,
  scanContextId?: string
) => {
  const { data } = await api.post('/chat', {
    message, language,
    conversation_id: conversationId,
    scan_context_id: scanContextId,
  })
  return data
}

export const getDashboard = async () => {
  const { data } = await api.get('/farmers/dashboard')
  return data
}

export const loginFarmer = async (identifier: string, password: string) => {
  const form = new URLSearchParams()
  form.append('username', identifier)
  form.append('password', password)
  const { data } = await api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export const registerFarmer = async (payload: {
  name: string; email?: string; phone?: string
  password: string; preferred_language: string; state?: string
}) => {
  const { data } = await api.post('/auth/register', payload)
  return data
}
