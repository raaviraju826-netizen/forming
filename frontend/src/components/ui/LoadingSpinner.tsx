import { Loader2 } from 'lucide-react'

interface Props { fullPage?: boolean; size?: number; message?: string }

export default function LoadingSpinner({ fullPage, size = 32, message }: Props) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <Loader2 size={48} className="animate-spin text-primary-600" />
        <p className="mt-4 text-gray-600 font-medium">{message || 'Loading...'}</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={size} className="animate-spin text-primary-600" />
      {message && <p className="mt-3 text-gray-500 text-sm">{message}</p>}
    </div>
  )
}
