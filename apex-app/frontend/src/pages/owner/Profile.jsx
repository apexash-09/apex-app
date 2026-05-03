import { useState, useEffect } from 'react'
import { shopService } from '../../services'
import useAuthStore from '../../store/authStore'

export default function OwnerProfile() {
  const { user } = useAuthStore()
  const shopId = user?.shop_id
  const [shop, setShop]     = useState(null)
  const [form, setForm]     = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')
  const [noShop, setNoShop] = useState(false)

  // If owner has no shop yet — show create form
  const [createForm, setCreateForm] = useState({
    name: '', address: '', area: '', city: '', phone: '', description: '', category: 'salon'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!shopId) { setLoading(false); setNoShop(true); return }
    shopService.get(shopId)
      .then(r => { setShop(r.data); setForm(r.data) })
      .catch(() => setNoShop(true))
      .finally(() => setLoading(false))
  }, [shopId])

  const saveShop = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { data } = await shopService.update(shopId, {
        name: form.name, description: form.description,
        address: form.address, area: form.area, city: form.city, phone: form.phone
      })
      setShop(data); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed')
    }
    setSaving(false)
  }

  const createShop = async () => {
    setCreating(true); setError('')
    try {
      const { data } = await shopService.create(createForm)
      setShop(data); setForm(data); setNoShop(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create shop')
    }
    setCreating(false)
  }

  if (loading) return <div className="p-6 animate-pulse text-gray-400">Loading…</div>

  if (noShop) return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Register Your Shop</h2>
      <p className="text-sm text-gray-500">Fill in your salon details. It will go live after admin approval (within 24 hrs).</p>
      <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: '#E5E7EB' }}>
        {[
          { key: 'name', label: 'Salon Name', placeholder: 'e.g. Glamour Studio' },
          { key: 'address', label: 'Full Address', placeholder: 'Street address' },
          { key: 'area', label: 'Area / Locality', placeholder: 'e.g. Koramangala' },
          { key: 'city', label: 'City', placeholder: 'e.g. Bengaluru' },
          { key: 'phone', label: 'Business Phone', placeholder: '9876543210' },
          { key: 'description', label: 'About Your Salon (optional)', placeholder: 'A short description…' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
            <input type="text" placeholder={f.placeholder} value={createForm[f.key]}
              onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button disabled={creating || !createForm.name || !createForm.area || !createForm.city}
          onClick={createShop}
          className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-50">
          {creating ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Shop Profile</h2>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
          shop?.status === 'active' ? 'bg-green-100 text-green-700' :
          shop?.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
        }`}>
          {shop?.status?.toUpperCase()}
        </span>
      </div>

      {shop?.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          ⏳ Your shop is under review. Admin will approve within 24 hours.
        </div>
      )}

      <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: '#E5E7EB' }}>
        {[
          { key: 'name',        label: 'Salon Name' },
          { key: 'address',     label: 'Address' },
          { key: 'area',        label: 'Area' },
          { key: 'city',        label: 'City' },
          { key: 'phone',       label: 'Business Phone' },
          { key: 'description', label: 'About' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{f.label}</label>
            <input type="text" value={form[f.key] || ''}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        ))}

        <div className="pt-2 border-t" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Avg Rating: <strong className="text-gray-800">{shop?.avg_rating || 'N/A'}</strong></span>
            <span>Reviews: <strong className="text-gray-800">{shop?.review_count || 0}</strong></span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button disabled={saving} onClick={saveShop}
          className={`w-full py-3.5 rounded-2xl font-bold transition ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
