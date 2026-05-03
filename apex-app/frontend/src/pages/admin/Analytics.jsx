import { useState, useEffect } from 'react'
import { adminService } from '../../services'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminAnalytics() {
  const [revenue, setRevenue] = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminService.revenue(), adminService.stats()])
      .then(([r, s]) => { setRevenue(r.data); setStats(s.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total = revenue.reduce((sum, r) => sum + (r.revenue || 0), 0)
  const commission = total * 0.08

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Platform Revenue</h2>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'GMV (30d)',    value: `₹${total.toFixed(0)}`,       color: 'text-purple-400' },
          { label: 'Commission',  value: `₹${commission.toFixed(0)}`,   color: 'text-green-400' },
          { label: 'Active Shops', value: stats?.shops?.active ?? 0,    color: 'text-blue-400' },
          { label: 'Total Bookings', value: stats?.bookings?.total ?? 0, color: 'text-yellow-400' },
        ].map(c => (
          <div key={c.label} className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
        <h3 className="font-semibold text-gray-200 mb-4">Revenue — Last 30 Days</h3>
        {loading ? (
          <div className="h-40 bg-gray-700 rounded-xl animate-pulse" />
        ) : revenue.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No revenue data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenue.map(r => ({ ...r, date: r.date?.slice(5) }))}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
