import { useState, useEffect } from 'react'
import { analyticsService } from '../../services'
import useAuthStore from '../../store/authStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function OwnerAnalytics() {
  const { user } = useAuthStore()
  const shopId = user?.shop_id
  const [period, setPeriod]     = useState('month')
  const [revenue, setRevenue]   = useState([])
  const [popular, setPopular]   = useState(null)
  const [overview, setOverview] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!shopId) return
    setLoading(true)
    Promise.all([
      analyticsService.revenue(shopId, period),
      analyticsService.popular(shopId),
      analyticsService.overview(shopId),
    ]).then(([r, p, o]) => {
      setRevenue(r.data)
      setPopular(p.data)
      setOverview(o.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [shopId, period])

  const totalRevenue = revenue.reduce((sum, r) => sum + (r.revenue || 0), 0)
  const totalBookings = revenue.reduce((sum, r) => sum + (r.bookings || 0), 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow text-sm">
        <p className="text-gray-500 mb-1">{label}</p>
        <p className="font-bold text-blue-700">₹{payload[0]?.value?.toFixed(0)}</p>
        {payload[1] && <p className="text-gray-600">{payload[1]?.value} bookings</p>}
      </div>
    )
    return null
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Analytics</h2>

      {/* Period selector */}
      <div className="flex gap-2">
        {['week','month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition capitalize"
            style={{
              background: period === p ? '#1E40AF' : '#fff',
              color: period === p ? '#fff' : '#6B7280',
              borderColor: period === p ? '#1E40AF' : '#E5E7EB',
            }}>
            Last {p === 'week' ? '7 days' : '30 days'}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Revenue',  value: `₹${totalRevenue.toFixed(0)}`,  color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Bookings', value: totalBookings,                   color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Today',    value: `₹${overview?.revenue_today?.toFixed(0) ?? 0}`, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(c => (
          <div key={c.label} className={`rounded-2xl p-4 ${c.bg}`}>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-semibold text-gray-800 mb-4">Revenue Trend</h3>
        {loading ? (
          <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
        ) : revenue.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No revenue data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={revenue.map(r => ({ ...r, date: r.date?.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak hours */}
      {popular?.peak_hours?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-semibold text-gray-800 mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={popular.peak_hours.map(h => ({ hour: `${h.hour}:00`, bookings: h.bookings }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top services */}
      {popular?.top_services?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-semibold text-gray-800 mb-3">Most Booked Services</h3>
          <div className="space-y-3">
            {popular.top_services.map((s, i) => (
              <div key={s.service_id} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{s.service_id?.slice(0,8)}…</span>
                    <span className="text-sm font-bold text-gray-900">{s.bookings}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(s.bookings / popular.top_services[0].bookings) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
