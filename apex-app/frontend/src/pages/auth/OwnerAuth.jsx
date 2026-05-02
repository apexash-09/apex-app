import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ownerAuthService } from '../../services'
import useAuthStore from '../../store/authStore'

export function OwnerLogin() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await ownerAuthService.login(form)
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/owner')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏪</div>
          <h1 className="text-2xl font-bold text-gray-900">Business Login</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your salon on Apex</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          <input
            type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password" placeholder="Password" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Logging in…' : 'Login to Dashboard'}
          </button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <Link to="/owner/register" className="text-sm text-blue-600 hover:underline">Register your business →</Link>
          <br />
          <Link to="/login" className="text-sm text-gray-500 hover:underline">Customer login</Link>
        </div>
      </div>
    </div>
  )
}

export function OwnerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await ownerAuthService.register(form)
      navigate('/owner/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏪</div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Business</h1>
          <p className="text-gray-500 text-sm mt-1">Join Apex — first 6 months free</p>
        </div>
        <form onSubmit={handle} className="space-y-4">
          {['name','email','phone','password'].map(field => (
            <input key={field}
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={e => setForm({...form, [field]: e.target.value})}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Registering…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-500">
          Already registered? <Link to="/owner/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default OwnerLogin
