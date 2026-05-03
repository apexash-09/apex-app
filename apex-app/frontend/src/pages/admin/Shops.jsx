import { useState, useEffect } from 'react'
import { adminService } from '../../services'

const STATUS_COLOR = {
  active:    'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-600',
}

export default function AdminShops() {
  const [shops, setShops]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [acting, setActing] = useState(null)

  useEffect(() => {
    // Fetch pending + all active via stats — for now fetch pending and show
    adminService.pendingShops()
      .then(r => setShops(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const approve = async (id) => {
    setActing(id)
    try {
      await adminService.approveShop(id)
      setShops(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s))
    } catch {}
    setActing(null)
  }

  const suspend = async (id) => {
    const reason = prompt('Reason for suspension?') || 'Policy violation'
    setActing(id)
    try {
      await adminService.suspendShop(id, reason)
      setShops(prev => prev.map(s => s.id === id ? { ...s, status: 'suspended' } : s))
    } catch {}
    setActing(null)
  }

  const shown = shops.filter(s =>
    (filter === 'all' || s.status === filter) &&
    (!search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.area?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Shop Management</h2>

      <input type="text" placeholder="Search by name or area…" value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />

      <div className="flex gap-2">
        {['all','pending','active','suspended'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition"
            style={{
              background: filter === f ? '#7C3AED' : 'transparent',
              color: filter === f ? '#fff' : '#9CA3AF',
              borderColor: filter === f ? '#7C3AED' : '#374151',
            }}>
            {f}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-400">{shown.length} shops</p>

      {loading && [1,2,3].map(i => <div key={i} className="bg-gray-800 rounded-2xl h-24 animate-pulse" />)}

      <div className="space-y-3">
        {shown.map(shop => (
          <div key={shop.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-white">{shop.name}</p>
                <p className="text-sm text-gray-400">{shop.category} · {shop.area}, {shop.city}</p>
                <p className="text-xs text-gray-500 mt-0.5">{shop.phone}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_COLOR[shop.status] || STATUS_COLOR.pending}`}>
                {shop.status || 'pending'}
              </span>
            </div>
            <div className="flex gap-2">
              {(!shop.status || shop.status === 'pending') && (
                <button disabled={acting === shop.id} onClick={() => approve(shop.id)}
                  className="flex-1 bg-green-600 text-white text-sm py-2 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
                  {acting === shop.id ? '…' : '✓ Approve'}
                </button>
              )}
              {shop.status === 'active' && (
                <button disabled={acting === shop.id} onClick={() => suspend(shop.id)}
                  className="flex-1 bg-red-900 text-red-300 text-sm py-2 rounded-xl font-semibold hover:bg-red-800 disabled:opacity-50">
                  {acting === shop.id ? '…' : 'Suspend'}
                </button>
              )}
              {shop.status === 'suspended' && (
                <button disabled={acting === shop.id} onClick={() => approve(shop.id)}
                  className="flex-1 bg-gray-700 text-gray-300 text-sm py-2 rounded-xl font-semibold hover:bg-gray-600 disabled:opacity-50">
                  Reinstate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
