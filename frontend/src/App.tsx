import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

const Home            = lazy(() => import('./pages/Home'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const DiseaseDetection= lazy(() => import('./pages/DiseaseDetection'))
const TreatmentGuide  = lazy(() => import('./pages/TreatmentGuide'))
const StoreFinder     = lazy(() => import('./pages/StoreFinder'))
const Chatbot         = lazy(() => import('./pages/Chatbot'))
const Weather         = lazy(() => import('./pages/Weather'))
const MarketPrices    = lazy(() => import('./pages/MarketPrices'))
const MyFarm          = lazy(() => import('./pages/MyFarm'))
const Settings        = lazy(() => import('./pages/Settings'))
const Login           = lazy(() => import('./pages/Login'))
const Register        = lazy(() => import('./pages/Register'))

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard"       element={<Dashboard />} />
            <Route path="detect"          element={<DiseaseDetection />} />
            <Route path="treatment/:diseaseId" element={<TreatmentGuide />} />
            <Route path="treatment"       element={<TreatmentGuide />} />
            <Route path="stores"          element={<StoreFinder />} />
            <Route path="chat"            element={<Chatbot />} />
            <Route path="weather"         element={<Weather />} />
            <Route path="market"          element={<MarketPrices />} />
            <Route path="farm"            element={<MyFarm />} />
            <Route path="settings"        element={<Settings />} />
            <Route path="login"           element={<Login />} />
            <Route path="register"        element={<Register />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
