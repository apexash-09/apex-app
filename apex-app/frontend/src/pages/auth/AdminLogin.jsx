import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAuthService } from '../../services'
import useAuthStore from '../../store/authStore'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await adminAuthService.login(form)
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-400 text-sm mt-1">Apex Platform — Founder Dashboard</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <input
            type="email" placeholder="Admin Email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
            required
          />
          <input
            type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
            required
          />
          {error && (
            <div className="bg-red-900/40 border border-red-500 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 text-white rounded-xl py-3 font-semibold hover:bg-purple-700 disabled:opacity-60">
            {loading ? 'Authenticating…' : 'Enter Admin Panel'}
          </button>
        </form>
        <p className="text-center mt-6 text-xs text-gray-500">
          This portal is restricted to platform administrators only.
        </p>
      </div>
    </div>
  )
}
