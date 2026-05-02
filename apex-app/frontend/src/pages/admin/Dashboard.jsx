import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services'

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminService.stats(), adminService.pendingShops()])
      .then(([s, p]) => { setStats(s.data); setPending(p.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const approveShop = async (id) => {
    await adminService.approveShop(id)
    setPending(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return <div className="p-6 text-gray-400 animate-pulse">Loading…</div>

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-white">Platform Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Users",    value: stats?.users?.total ?? 0 },
          { label: "Active Shops",   value: stats?.shops?.active ?? 0 },
          { label: "Pending Shops",  value: stats?.shops?.pending ?? 0 },
          { label: "Total Bookings", value: stats?.bookings?.total ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/admin/shops",     icon: "🏪", label: "All Shops" },
          { to: "/admin/users",     icon: "👥", label: "All Users" },
          { to: "/admin/analytics", icon: "📊", label: "Revenue" },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-2xl p-4 hover:border-purple-500 transition">
            <span className="text-2xl">{a.icon}</span>
            <span className="font-medium text-gray-200 text-sm">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Pending approvals */}
      <div>
        <h3 className="font-semibold text-gray-200 mb-3">
          Pending Approvals {pending.length > 0 && (
            <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
          )}
        </h3>
        {pending.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">No pending approvals</p>
        )}
        <div className="space-y-3">
          {pending.map(shop => (
            <div key={shop.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{shop.name}</p>
                <p className="text-sm text-gray-400">{shop.category} · {shop.area}, {shop.city}</p>
                <p className="text-xs text-gray-500">{shop.phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveShop(shop.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
