import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShieldCheck, Leaf, Bug, FlaskConical, AlertTriangle,
  ArrowLeft, Stethoscope, CheckCircle2, BookOpen, Phone
} from 'lucide-react'
import { getTreatments } from '../lib/api'

// Built-in treatment database mirroring backend DISEASE_DB
// Always available even without DB seed data
const BUILTIN_TREATMENTS: Record<string, {
  cultural: string; biological: string; ipm: string; note?: string
}> = {
  'Early Blight': {
    cultural: 'Remove and destroy infected leaves and plant debris promptly. Practice crop rotation — avoid planting Solanaceae (tomato, potato, brinjal) in the same field for 2–3 consecutive seasons. Maintain adequate plant spacing (60–90 cm) to allow airflow. Mulch the soil surface to prevent rain splash inoculation. Use drip irrigation instead of overhead watering to keep foliage dry.',
    biological: 'Apply Trichoderma-based biocontrol formulations as a soil drench or foliar spray per product label instructions. Neem oil-based formulations (Azadirachtin) may be used as a supplementary measure to reduce disease severity.',
    ipm: 'Monitor fields twice weekly. Set action threshold at first appearance of lesions. Prioritise cultural and biological controls. Remove infected leaves before spraying. If chemical control is necessary, consult your local agricultural extension officer (KVK) for state-approved fungicide options. Always follow official product label instructions.',
    note: 'Early blight is most severe during warm (24–29°C), wet conditions. Early detection and removal of infected lower leaves is the most effective management step.',
  },
  'Late Blight': {
    cultural: 'Plant only certified, disease-free seed material. Remove and destroy all infected plant material immediately — do not compost. Improve field drainage to avoid waterlogging. Avoid overhead irrigation. Maintain plant spacing for good airflow. Hill up potatoes to protect tubers.',
    biological: 'No highly effective biological agents are currently registered for late blight control. Copper-based formulations (copper hydroxide, copper oxychloride) are approved for organic use and can reduce spread — consult product label for approved crops and dosages.',
    ipm: 'Monitor weather conditions — late blight spreads rapidly in cool (10–20°C), wet and humid conditions. Use weather-based disease forecasting if available. Prioritise removal of infected plants. Consult KVK or state Department of Agriculture for approved fungicide options if disease pressure is high.',
    note: 'Late blight (Phytophthora infestans) can destroy an entire crop within days under favourable conditions. Act immediately upon first symptoms.',
  },
  'Leaf Mold': {
    cultural: 'Reduce humidity inside greenhouses by improving ventilation and spacing plants adequately. Avoid overhead irrigation. Remove and destroy infected leaves. Ensure good air circulation around plants.',
    biological: 'Some Trichoderma-based products may offer supplementary protection — consult product label.',
    ipm: 'Target relative humidity below 85%. Prune lower leaves to improve airflow. Monitor closely in high-humidity environments. If chemical control is needed, consult extension officer for locally approved options.',
    note: 'Leaf mold (Passalora fulva) is primarily a problem in protected cultivation (greenhouses/polyhouses) where humidity is high.',
  },
  'Septoria Leaf Spot': {
    cultural: 'Remove infected lower leaves and debris. Avoid working in the field when plants are wet. Use drip irrigation. Stake or trellis plants to improve airflow. Practice crop rotation with non-Solanaceous crops.',
    biological: 'Copper-based formulations may reduce disease spread as a preventive measure per product label.',
    ipm: 'Begin monitoring after transplanting. First infections appear on lowest leaves. Remove infected material promptly before the disease moves up the plant canopy.',
    note: 'Septoria leaf spot spreads upward through the canopy. Early management of lower leaves prevents spread to fruiting portions.',
  },
  'Spider Mites': {
    cultural: 'Maintain adequate soil moisture — water-stressed plants are more susceptible. Avoid dusty conditions near fields. Remove heavily infested plant material. Avoid broad-spectrum pesticides that kill natural predators.',
    biological: 'Encourage and conserve natural predatory mites (Phytoseiidae family). Neem oil-based formulations can help reduce mite populations per product label.',
    ipm: 'Monitor with a hand lens — look for stippling and webbing on leaf undersides. Act early before populations explode. Avoid applications during peak heat (11am–3pm).',
    note: 'Spider mite populations explode in hot, dry conditions. Keeping plants well-watered and avoiding dust on leaves reduces risk significantly.',
  },
  'Target Spot': {
    cultural: 'Practice crop rotation. Maintain plant spacing for good airflow. Remove infected plant debris after harvest. Avoid overhead irrigation.',
    biological: 'Trichoderma-based products may offer some protection as a preventive soil treatment per product label.',
    ipm: 'Monitor regularly. Remove infected leaves early. Consult your local agricultural extension officer for locally approved management options.',
    note: 'Target spot can affect all parts of the plant. Good field sanitation and crop rotation are the most effective preventive measures.',
  },
  'Yellow Leaf Curl Virus': {
    cultural: 'Remove and destroy infected plants immediately — there is no cure for virus-infected plants. Use insect-proof netting in nurseries. Use reflective silver mulch to deter whiteflies. Plant resistant varieties where available.',
    biological: 'Encourage natural enemies of whiteflies such as parasitoid wasps. Yellow sticky traps can monitor whitefly populations.',
    ipm: 'Control the whitefly vector (Bemisia tabaci) to prevent spread. Monitor with yellow sticky traps. Remove infected plants promptly. Consult KVK for approved whitefly management options in your state.',
    note: 'Once a plant is infected with TYLCV, there is no treatment. Prevention through vector control and resistant varieties is the only effective strategy.',
  },
  'Tomato Mosaic Virus': {
    cultural: 'Remove and destroy infected plants. Disinfect tools and hands with soap and water or 10% bleach solution between plants. Wash hands before handling plants. Use certified virus-free seed.',
    biological: 'No effective biological control — focus on prevention and sanitation.',
    ipm: 'Control aphid vectors. Remove infected plants promptly. Avoid tobacco products near tomato plants (tobacco mosaic virus cross-infection risk). Use resistant varieties where available.',
    note: 'Tomato mosaic virus spreads easily through mechanical contact. Good field hygiene and tool disinfection are critical for prevention.',
  },
  'Common Rust': {
    cultural: 'Plant early-maturing varieties to escape peak rust pressure. Use resistant hybrid varieties — the most effective control. Remove heavily infected crop residue after harvest.',
    biological: 'No highly effective biological agents are registered for corn rust. Keeping plants vigorous through balanced fertilisation reduces severity.',
    ipm: 'Monitor fields from V6 growth stage. If more than 50% of plants show pustules on upper leaves before silking, consult extension officer for approved fungicide options.',
    note: 'Common rust of maize (Puccinia sorghi) is most effectively managed by using resistant hybrids. Under Indian conditions, yield losses are rarely severe in resistant varieties.',
  },
  'Northern Leaf Blight': {
    cultural: 'Use resistant hybrids (most effective control). Practice crop rotation. Reduce surface residue through tillage. Plant early to avoid peak disease pressure.',
    biological: 'No commercially significant biological control is available. Maintaining good crop nutrition supports plant resistance.',
    ipm: 'Scout fields from V8 growth stage. Consult local KVK or state department of agriculture for approved fungicide options if disease pressure warrants chemical intervention.',
    note: 'Northern leaf blight can cause significant yield losses in susceptible hybrids. Variety selection is the most cost-effective management strategy.',
  },
  'Healthy': {
    cultural: 'Your crop appears healthy. Continue good agricultural practices: appropriate irrigation schedule, balanced soil nutrition based on soil test results, crop rotation, and regular scouting.',
    biological: 'Maintain healthy soil biology through addition of compost or farmyard manure. Encourage beneficial insects.',
    ipm: 'Continue regular field monitoring (at least twice per week). Early detection of any new symptoms allows for prompt management action.',
    note: 'No disease symptoms detected. Upload images regularly to track your crop health over time.',
  },
}

function getBuiltinTreatment(diseaseName: string) {
  if (!diseaseName) return null
  // Try exact match first
  if (BUILTIN_TREATMENTS[diseaseName]) return BUILTIN_TREATMENTS[diseaseName]
  // Try partial match
  const key = Object.keys(BUILTIN_TREATMENTS).find(k =>
    diseaseName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(diseaseName.toLowerCase())
  )
  return key ? BUILTIN_TREATMENTS[key] : null
}

const CATEGORY_META = {
  cultural:   { label: 'Cultural Practices',          icon: Leaf,         color: 'border-emerald-800/50 bg-emerald-900/20', badge: 'bg-emerald-500/20 text-emerald-300' },
  biological: { label: 'Biological Control',          icon: Bug,          color: 'border-blue-800/50 bg-blue-900/20',     badge: 'bg-blue-500/20 text-blue-300' },
  ipm:        { label: 'Integrated Pest Management',  icon: ShieldCheck,  color: 'border-purple-800/50 bg-purple-900/20', badge: 'bg-purple-500/20 text-purple-300' },
}

export default function TreatmentGuide() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { diseaseId } = useParams<{ diseaseId?: string }>()
  const location = useLocation()
  const diseaseName = (location.state as { diseaseName?: string })?.diseaseName || ''
  const [dbData, setDbData] = useState<any>(null)

  // Try to fetch from DB (may fail if not seeded — fallback to builtin)
  useEffect(() => {
    if (diseaseId) {
      getTreatments(Number(diseaseId)).then(setDbData).catch(() => {})
    }
  }, [diseaseId])

  const builtin = getBuiltinTreatment(diseaseName)
  const isHealthy = diseaseName.toLowerCase().includes('healthy')

  if (!diseaseId && !diseaseName) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Treatment Guide</h1>
          <p className="text-gray-500 mt-1">Agricultural management information for detected diseases</p>
        </div>
        <div className="bg-[#0d1f17] border border-emerald-900/30 rounded-2xl p-16 text-center">
          <div className="inline-flex bg-emerald-500/10 p-5 rounded-2xl mb-4">
            <ShieldCheck size={36} className="text-emerald-500/40" />
          </div>
          <p className="text-gray-400 font-medium">No disease selected</p>
          <p className="text-gray-600 text-sm mt-2">Use the Disease Detection tool to scan a leaf image first.</p>
          <button
            onClick={() => navigate('/detect')}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#10b981,#0d9488)' }}
          >
            Go to Disease Detection →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex items-start gap-3">
          {isHealthy
            ? <CheckCircle2 size={28} className="text-emerald-400 mt-1 flex-shrink-0" />
            : <Stethoscope size={28} className="text-orange-400 mt-1 flex-shrink-0" />}
          <div>
            <h1 className="text-3xl font-black text-white">Treatment Guide</h1>
            {diseaseName && (
              <p className="text-gray-400 mt-1">
                For: <span className="text-emerald-400 font-semibold">{diseaseName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-400/80 text-sm leading-relaxed">
          This information is for reference only. Always follow official product labels and consult a qualified agricultural officer (KVK) before applying any treatment. Never use human medicines for crop diseases.
        </p>
      </div>

      {/* Healthy special case */}
      {isHealthy && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
          <h2 className="text-emerald-300 font-bold text-lg mb-2">No Disease Detected 🌿</h2>
          <p className="text-gray-400 text-sm">Your crop appears healthy. Maintain good agricultural practices to keep it that way.</p>
        </div>
      )}

      {/* Treatment categories */}
      {builtin && (
        <div className="space-y-4">
          {Object.entries({
            cultural: { label: CATEGORY_META.cultural.label, icon: CATEGORY_META.cultural.icon, color: CATEGORY_META.cultural.color, badge: CATEGORY_META.cultural.badge, text: builtin.cultural },
            biological: { label: CATEGORY_META.biological.label, icon: CATEGORY_META.biological.icon, color: CATEGORY_META.biological.color, badge: CATEGORY_META.biological.badge, text: builtin.biological },
            ipm: { label: CATEGORY_META.ipm.label, icon: CATEGORY_META.ipm.icon, color: CATEGORY_META.ipm.color, badge: CATEGORY_META.ipm.badge, text: builtin.ipm },
          }).map(([key, meta]) => {
            const Icon = meta.icon
            return (
              <div key={key} className={`border rounded-2xl overflow-hidden ${meta.color}`}>
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2.5">
                  <span className={`inline-flex p-1.5 rounded-lg ${meta.badge}`}>
                    <Icon size={14} />
                  </span>
                  <h3 className="font-bold text-white text-sm">{meta.label}</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-300 text-sm leading-relaxed">{meta.text}</p>
                </div>
              </div>
            )
          })}

          {/* Key note */}
          {builtin.note && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3">
              <BookOpen size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-300/80 text-sm leading-relaxed"><strong className="text-blue-300">Key Note:</strong> {builtin.note}</p>
            </div>
          )}
        </div>
      )}

      {/* DB treatments if available */}
      {dbData?.treatments?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <FlaskConical size={18} className="text-orange-400" /> Verified Product Information
          </h2>
          {dbData.treatments.map((item: any, i: number) => (
            <div key={i} className="bg-orange-900/10 border border-orange-800/30 rounded-xl p-5 space-y-2">
              {item.product_name && <p className="text-white font-semibold">{item.product_name}</p>}
              {item.active_ingredient && <p className="text-gray-400 text-sm">Active ingredient: <span className="text-gray-300">{item.active_ingredient}</span></p>}
              {item.official_dosage && <p className="text-gray-400 text-sm">Dosage: <span className="text-gray-300">{item.official_dosage}</span></p>}
              {item.application_method && <p className="text-gray-400 text-sm">Application: <span className="text-gray-300">{item.application_method}</span></p>}
              {item.safety_instructions && (
                <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mt-2">
                  <p className="text-red-300 text-xs">⚠️ <strong>Safety:</strong> {item.safety_instructions}</p>
                </div>
              )}
              {item.source_reference && <p className="text-gray-600 text-xs mt-1">Source: {item.source_reference}</p>}
            </div>
          ))}
        </div>
      )}

      {/* KVK consultation card */}
      <div className="bg-[#0d1f17] border border-emerald-900/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="bg-emerald-500/10 p-3 rounded-xl flex-shrink-0">
          <Phone size={20} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-bold mb-1">Consult a KVK Expert</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            For confirmed diagnosis and locally-approved treatment recommendations, contact your nearest <strong className="text-gray-400">Krishi Vigyan Kendra (KVK)</strong> or state Department of Agriculture extension officer.
          </p>
          <a
            href="https://kvk.icar.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Find your nearest KVK →
          </a>
        </div>
      </div>
    </div>
  )
}
