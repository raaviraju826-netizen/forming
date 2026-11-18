import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import {
  Upload, AlertTriangle, CheckCircle2,
  Loader2, Stethoscope, ShoppingBag,
  Leaf, FlaskConical, Shield, Info, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Prediction {
  class_label: string
  confidence: number
  rank: number
}

interface DetectionResult {
  scan_id: string
  crop_name: string
  disease_name: string
  confidence_score: number
  is_healthy: boolean
  is_low_confidence: boolean
  reliability_note: string
  symptoms?: string
  causes?: string
  prevention?: string
  top_predictions: Prediction[]
  image_url: string
  has_treatment: boolean
}

const CROP_OPTIONS = [
  { value: '', label: 'Auto-detect crop' },
  { value: 'tomato', label: '🍅 Tomato' },
  { value: 'potato', label: '🥔 Potato' },
  { value: 'corn', label: '🌽 Corn / Maize' },
  { value: 'rice', label: '🌾 Rice' },
  { value: 'wheat', label: '🌾 Wheat' },
  { value: 'apple', label: '🍎 Apple' },
  { value: 'grape', label: '🍇 Grape' },
]

export default function DiseaseDetection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cropHint, setCropHint] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/jpg': [], 'image/png': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleDetect = async () => {
    if (!file) { toast.error('Please upload a leaf image first'); return }
    setLoading(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append('file', file)
    if (cropHint) form.append('crop_hint', cropHint)

    try {
      const { data } = await api.post('/disease/predict', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })
      setResult(data)
      if (data.is_healthy) {
        toast.success('Great news — no disease detected! 🌿')
      } else {
        toast.error(`Disease detected: ${data.disease_name}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || 'Analysis failed. Please upload a clear leaf photo.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError(null)
  }

  const confidenceColor = (score: number) =>
    score >= 0.75 ? 'text-emerald-400' : score >= 0.55 ? 'text-yellow-400' : 'text-red-400'

  const confidenceBg = (score: number) =>
    score >= 0.75 ? 'bg-emerald-500' : score >= 0.55 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-4">
          <FlaskConical size={14} />
          AI-Powered Crop Disease Scanner
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Detect Crop Disease</h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          Upload a clear photo of a crop leaf. Our CV engine analyses colour patterns and texture to identify possible diseases instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Upload Panel */}
        <div className="space-y-4">
          {/* Crop selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Crop Type (optional)</label>
            <select
              value={cropHint}
              onChange={e => setCropHint(e.target.value)}
              className="w-full bg-[#0d1f17] border border-emerald-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              {CROP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200
              ${isDragActive
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-emerald-900/50 bg-[#0d1f17] hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Uploaded leaf"
                  className="w-full max-h-56 object-contain rounded-xl"
                />
                <button
                  onClick={e => { e.stopPropagation(); reset() }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-500/80 transition-colors"
                >
                  <XCircle size={18} />
                </button>
                <p className="text-xs text-gray-500 mt-2">{file?.name} · {((file?.size || 0) / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="py-6">
                <div className="inline-flex bg-emerald-500/10 p-4 rounded-2xl mb-4">
                  <Upload size={28} className="text-emerald-400" />
                </div>
                <p className="text-gray-400 font-medium mb-1">
                  {isDragActive ? 'Drop the image here…' : 'Drag & drop a leaf image'}
                </p>
                <p className="text-gray-600 text-sm">or click to browse files</p>
                <p className="text-gray-700 text-xs mt-3">JPG, PNG · Max 10 MB</p>
              </div>
            )}
          </div>

          {/* Detect button */}
          <button
            onClick={handleDetect}
            disabled={!file || loading}
            className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Analysing leaf…</>
            ) : (
              <><FlaskConical size={20} /> Analyse Disease</>
            )}
          </button>

          {/* Tips */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Info size={12} /> Tips for best results</p>
            <ul className="text-gray-500 text-xs space-y-1">
              <li>• Take photo in natural daylight</li>
              <li>• Fill the frame with the affected leaf</li>
              <li>• Capture both upper and lower leaf surface</li>
              <li>• Avoid blurry or dark images</li>
            </ul>
          </div>
        </div>

        {/* RIGHT — Results Panel */}
        <div>
          {!result && !error && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center bg-[#0d1f17] border border-emerald-900/30 rounded-2xl p-10">
              <div className="bg-emerald-500/10 p-5 rounded-2xl mb-4">
                <Leaf size={36} className="text-emerald-500/50" />
              </div>
              <p className="text-gray-600 font-medium">Upload a leaf image</p>
              <p className="text-gray-700 text-sm mt-1">Results will appear here</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-center bg-[#0d1f17] border border-emerald-900/30 rounded-2xl p-10">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-900 border-t-emerald-400 animate-spin" />
                <FlaskConical size={24} className="absolute inset-0 m-auto text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-semibold">Analysing leaf image…</p>
              <p className="text-gray-600 text-sm mt-2">Detecting colour patterns & texture</p>
              <div className="mt-4 space-y-1 text-xs text-gray-700">
                <p>✓ Image quality check</p>
                <p>✓ Colour signature extraction</p>
                <p>✓ Disease pattern matching</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex flex-col items-center text-center">
              <AlertTriangle size={36} className="text-red-400 mb-3" />
              <h3 className="text-red-400 font-bold mb-2">Analysis Failed</h3>
              <p className="text-gray-400 text-sm">{error}</p>
              <button onClick={reset} className="mt-4 text-sm text-emerald-400 hover:underline">Try again →</button>
            </div>
          )}

          {result && (
            <div className="bg-[#0d1f17] border border-emerald-900/40 rounded-2xl overflow-hidden">
              {/* Result header */}
              <div className={`p-5 ${result.is_healthy
                ? 'bg-gradient-to-r from-emerald-900/40 to-teal-900/20'
                : 'bg-gradient-to-r from-red-900/40 to-orange-900/20'}`}>
                <div className="flex items-start gap-3">
                  {result.is_healthy
                    ? <CheckCircle2 size={28} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle size={28} className="text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        result.is_healthy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {result.is_healthy ? '✓ Healthy' : '⚠ Disease Detected'}
                      </span>
                      <span className="text-xs text-gray-500">{result.crop_name}</span>
                    </div>
                    <h3 className="text-white font-black text-lg leading-tight">{result.disease_name}</h3>
                  </div>
                </div>

                {/* Confidence */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Analysis Confidence</span>
                    <span className={`font-bold ${confidenceColor(result.confidence_score)}`}>
                      {(result.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${confidenceBg(result.confidence_score)}`}
                      style={{ width: `${result.confidence_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Reliability note */}
              <div className="px-5 py-3 bg-yellow-500/5 border-b border-yellow-500/10">
                <p className="text-yellow-500/80 text-xs flex gap-1.5">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  {result.reliability_note}
                </p>
              </div>

              <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
                {/* Disease info cards */}
                {!result.is_healthy && result.symptoms && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-red-400 font-semibold text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Stethoscope size={12} /> Symptoms
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.symptoms}</p>
                  </div>
                )}

                {!result.is_healthy && result.causes && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                    <h4 className="text-orange-400 font-semibold text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <FlaskConical size={12} /> Causes
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.causes}</p>
                  </div>
                )}

                {result.prevention && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-emerald-400 font-semibold text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Shield size={12} /> Prevention & Management
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{result.prevention}</p>
                  </div>
                )}

                {/* Top predictions */}
                {result.top_predictions?.length > 0 && (
                  <div>
                    <h4 className="text-gray-500 text-xs uppercase tracking-wide mb-3 font-semibold">Top Predictions</h4>
                    <div className="space-y-2">
                      {result.top_predictions.slice(0, 4).map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-400 text-xs truncate">
                              {p.class_label.split('___').pop()?.replace(/_/g, ' ')}
                            </p>
                            <div className="h-1.5 bg-black/30 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-gray-600'}`}
                                style={{ width: `${p.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {(p.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  {result.has_treatment && (
                    <button
                      onClick={() => navigate('/treatment', { state: { scanId: result.scan_id, diseaseName: result.disease_name } })}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #10b981, #0d9488)' }}
                    >
                      <Stethoscope size={15} /> Treatment
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/stores', { state: { disease: result.disease_name } })}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white border border-emerald-700 bg-emerald-900/30 hover:bg-emerald-800/40 transition-all hover:scale-105 ${result.has_treatment ? '' : 'col-span-2'}`}
                  >
                    <ShoppingBag size={15} /> Find Stores
                  </button>
                </div>

                <button
                  onClick={reset}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-400 transition-colors"
                >
                  ← Scan another image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
