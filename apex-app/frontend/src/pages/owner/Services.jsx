import { useState, useEffect } from 'react'
import { shopService } from '../../services'
import useAuthStore from '../../store/authStore'

const EMPTY = { name: '', description: '', price: '', duration_minutes: '', category: '' }
const CATEGORIES = ['Haircare', 'Skincare', 'Nailcare', 'Makeup', 'Threading', 'Waxing', 'Massage', 'Other']

export default function OwnerServices() {
  const { user } = useAuthStore()
  const shopId   = user?.shop_id
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!shopId) return
    shopService.getServices(shopId)
      .then(r => setServices(r.data))
      .finally(() => setLoading(false))
  }, [shopId])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setError(''); setShowForm(true) }
  const openEdit = (svc) => {
    setEditing(svc.id)
    setForm({ name: svc.name, description: svc.description||'', price: svc.price, duration_minutes: svc.duration_minutes, category: svc.category||'' })
    setError(''); setShowForm(true)
  }

  const save = async () => {
    setError(''); setSaving(true)
    try {
      const payload = { ...form, price: parseFloat(form.price), duration_minutes: parseInt(form.duration_minutes) }
      if (editing) {
        const { data } = await shopService.updateService(editing, payload)
        setServices(prev => prev.map(s => s.id === editing ? data : s))
      } else {
        const { data } = await shopService.addService(shopId, payload)
        setServices(prev => [...prev, data])
      }
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save')
    }
    setSaving(false)
  }

  const toggle = async (svc) => {
    const { data } = await shopService.updateService(svc.id, { is_available: !svc.is_available })
    setServices(prev => prev.map(s => s.id === svc.id ? data : s))
  }

  const del = async (id) => {
    if (!confirm('Delete this service?')) return
    await shopService.deleteService(id)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Services</h2>
        <button onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
          + Add Service
        </button>
      </div>

      {loading && [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}

      {!loading && services.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-2">✂️</p>
          <p className="text-gray-500 mb-3">No services yet</p>
          <button onClick={openAdd} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold">
            Add Your First Service
          </button>
        </div>
      )}

      <div className="space-y-3">
        {services.map(svc => (
          <div key={svc.id} className="bg-white rounded-2xl p-4 border flex items-center gap-4"
            style={{ borderColor: '#E5E7EB', opacity: svc.is_available ? 1 : 0.6 }}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{svc.name}</p>
                {svc.category && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{svc.category}</span>
                )}
                {!svc.is_available && (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Unavailable</span>
                )}
              </div>
              {svc.description && <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>}
              <p className="text-xs text-gray-400 mt-1">⏱ {svc.duration_minutes} min</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">₹{svc.price}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => toggle(svc)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium ${svc.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {svc.is_available ? 'On' : 'Off'}
                </button>
                <button onClick={() => openEdit(svc)} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-medium">Edit</button>
                <button onClick={() => del(svc.id)} className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 font-medium">Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-up form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            {[
              { key: 'name', label: 'Service Name', placeholder: 'e.g. Haircut & Style', type: 'text' },
              { key: 'description', label: 'Description (optional)', placeholder: 'Brief description', type: 'text' },
              { key: 'price', label: 'Price (₹)', placeholder: '350', type: 'number' },
              { key: 'duration_minutes', label: 'Duration (minutes)', placeholder: '45', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button disabled={saving || !form.name || !form.price || !form.duration_minutes}
              onClick={save}
              className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold disabled:opacity-50">
              {saving ? 'Saving…' : editing ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
