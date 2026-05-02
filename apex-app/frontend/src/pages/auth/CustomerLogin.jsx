import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services'
import useAuthStore from '../../store/authStore'

export default function CustomerLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [otp, setOtp]     = useState('')
  const [name, setName]   = useState('')
  const [step, setStep]   = useState('phone')  // 'phone' | 'otp'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await authService.sendOtp(phone)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await authService.verifyOtp(phone, otp, name || undefined)
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate(data.user.role === 'owner' ? '/owner' : '/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">✂️</div>
          <h1 className="text-2xl font-bold text-gray-900">Apex</h1>
          <p className="text-gray-500 text-sm mt-1">Book local salons instantly</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold text-base hover:bg-green-600 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Get OTP on WhatsApp'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600 bg-green-50 rounded-xl p-3">
              OTP sent to <strong>{phone}</strong> on WhatsApp
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xl tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-gray-400">(first time)</span>
              </label>
              <input
                type="text"
                placeholder="Priya"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold hover:bg-green-600 disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </button>
            <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-gray-500 py-2">
              ← Change number
            </button>
          </form>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">Are you a business owner?</p>
          <Link to="/owner/login" className="text-sm text-green-600 font-medium hover:underline">
            Owner Login →
          </Link>
        </div>
      </div>
    </div>
  )
}
