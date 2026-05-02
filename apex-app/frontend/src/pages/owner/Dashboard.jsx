import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsService } from '../../services'
import useAuthStore from '../../store/authStore'

export default function OwnerDashboard() {
  const { user } = useAuthStore()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const shopId = user?.shop_id

  useEffect(() => {
    if (!shopId) return
    analyticsService.overview(shopId)
      .then(r => setOverview(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [shopId])

  if (!shopId) return (
    <div className="p-6 text-center">
      <p className="text-gray-500 mb-4">You don't have a shop registered yet.</p>
      <Link to="/owner/profile" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
        Register Your Shop
      </Link>
    </div>
  )

  if (loading) return <div className="p-6 text-gray-400 animate-pulse">Loading dashboard…</div>

  const stats = [
    { label: "Bookings Today",      value: overview?.total_bookings_today ?? 0,    color: "bg-blue-50 text-blue-700" },
    { label: "Pending Confirm",     value: overview?.pending_confirmations ?? 0,   color: "bg-yellow-50 text-yellow-700" },
    { label: "Revenue Today (₹)",   value: overview?.revenue_today?.toFixed(0) ?? 0, color: "bg-green-50 text-green-700" },
  ]

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Good morning! 👋</h2>
        <p className="text-gray-500 text-sm">{overview?.date}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/owner/bookings",  icon: "📅", label: "View Bookings" },
            { to: "/owner/services",  icon: "✂️", label: "Manage Services" },
            { to: "/owner/schedule",  icon: "🗓️", label: "Set Schedule" },
            { to: "/owner/analytics", icon: "📊", label: "Analytics" },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50 transition">
              <span className="text-2xl">{a.icon}</span>
              <span className="font-medium text-gray-800 text-sm">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming bookings */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Upcoming Today</h3>
        {overview?.upcoming_bookings?.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No bookings in the next 3 hours</p>
        )}
        <div className="space-y-3">
          {overview?.upcoming_bookings?.map(b => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{b.slot_time}</p>
                <p className="text-sm text-gray-500">Code: {b.confirmation_code}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
