export interface PredictionResult {
  scan_id: string
  crop_name: string
  disease_name: string
  disease_name_hindi?: string
  disease_name_telugu?: string
  confidence_score: number
  is_healthy: boolean
  is_low_confidence: boolean
  reliability_note: string
  symptoms?: string
  causes?: string
  prevention?: string
  description?: string
  top_predictions: TopPrediction[]
  image_url: string
  has_treatment: boolean
  created_at: string
}

export interface TopPrediction {
  class_label: string
  confidence: number
  rank: number
}

export interface TreatmentItem {
  id: number
  treatment_category: string
  product_name?: string
  active_ingredient?: string
  official_dosage?: string
  application_method?: string
  safety_instructions?: string
  pre_harvest_interval_days?: number
  source_reference?: string
  verification_date?: string
  is_verified: boolean
  notes?: string
}

export interface TreatmentResponse {
  disease_id: number
  disease_name: string
  crop_name: string
  treatments: TreatmentItem[]
  disclaimer: string
}

export interface WeatherData {
  location: string
  latitude: number
  longitude: number
  temperature_c: number
  feels_like_c: number
  humidity_percent: number
  wind_speed_kmh: number
  rainfall_mm: number
  weather_code: number
  weather_description: string
  uv_index?: number
  forecast: ForecastDay[]
  farming_advisory: string
  last_updated: string
  source: string
}

export interface ForecastDay {
  date: string
  weather_code: number
  description: string
  temp_max_c?: number
  temp_min_c?: number
  precipitation_mm: number
}

export interface MarketRecord {
  commodity: string
  variety?: string
  market: string
  district: string
  state: string
  min_price: number
  max_price: number
  modal_price: number
  unit: string
  arrival_date: string
  source: string
}

export interface StoreResult {
  id?: string
  name: string
  address?: string
  phone?: string
  distance_km?: number
  operating_hours?: string
  latitude?: number
  longitude?: number
  maps_url?: string
  is_verified: boolean
  stock_note: string
  source: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface FarmerProfile {
  id: string
  name: string
  email?: string
  phone?: string
  preferred_language: string
  state?: string
  district?: string
  village?: string
  is_active: boolean
  created_at: string
}

export interface DashboardStats {
  total_scans: number
  healthy_crops: number
  disease_detected: number
  recent_scans: ScanSummary[]
  recent_conversations: number
  saved_recommendations: number
}

export interface ScanSummary {
  id: string
  crop_name?: string
  predicted_class?: string
  confidence_score?: number
  is_healthy: boolean
  image_url: string
  created_at: string
}
