import { useState, useEffect } from 'react'
import { bookingService } from '../../services'
import useAuthStore from '../../store/authStore'

const STATUS_ACTIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show:   [],
}
const STATUS_COLOR = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show:   'bg-red-100 text-red-600',
}
const ACTION_LABEL = {
  confirmed: '✓ Confirm',
  completed: '✅ Complete',
  cancelled: '✗ Cancel',
  no_show:   '⚠ No Show',
}
const ACTION_COLOR = {
  confirmed: 'bg-green-500 text-white',
  completed: 'bg-blue-500 text-white',
  cancelled: 'bg-gray-200 text-gray-700',
  no_show:   'bg-red-100 text-red-600',
}

function fmt(d) { return d.toISOString().split('T')[0] }

export default function OwnerBookings() {
  const { user } = useAuthStore()
  const shopId   = user?.shop_id
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [date, setDate]         = useState(fmt(new Date()))
  const [updating, setUpdating] = useState(null)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    if (!shopId) return
    setLoading(true)
    bookingService.shopBookings(shopId, date)
      .then(r => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [shopId, date])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await bookingService.updateStatus(id, status)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    } catch {}
    setUpdating(null)
  }

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i - 1); return d
  })

  const shown = bookings.filter(b => filter === 'all' || b.status === filter)

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Bookings</h2>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map(d => {
          const s = fmt(d)
          const isToday = s === fmt(new Date())
          return (
            <button key={s} onClick={() => setDate(s)}
              className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition min-w-[60px]"
              style={{
                background: date === s ? '#2563EB' : '#fff',
                color: date === s ? '#fff' : '#374151',
                borderColor: date === s ? '#2563EB' : '#E5E7EB',
              }}>
              <span className="text-xs">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              <span className="font-bold text-base leading-tight">{d.getDate()}</span>
              {isToday && <span className="text-xs opacity-70">Today</span>}
            </button>
          )
        })}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition"
            style={{
              background: filter === f ? '#1E40AF' : '#fff',
              color: filter === f ? '#fff' : '#6B7280',
              borderColor: filter === f ? '#1E40AF' : '#E5E7EB',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">{shown.length} booking{shown.length !== 1 ? 's' : ''}</p>

      {/* List */}
      {loading && [1,2,3].map(i => (
        <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
      ))}

      {!loading && shown.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-3xl mb-2">📅</p>
          <p className="text-gray-500">No bookings for this day</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map(b => (
          <div key={b.id} className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">{b.slot_time?.slice(0,5)} – {b.slot_end_time?.slice(0,5)}</p>
                <p className="text-sm text-gray-500 mt-0.5">Code: {b.confirmation_code}</p>
                {b.notes && <p className="text-xs text-gray-400 mt-1 italic">"{b.notes}"</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_COLOR[b.status]}`}>
                {b.status.replace('_',' ')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">₹{b.amount_paid}</span>
              <div className="flex gap-2">
                {STATUS_ACTIONS[b.status]?.map(action => (
                  <button key={action}
                    disabled={updating === b.id}
                    onClick={() => updateStatus(b.id, action)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${ACTION_COLOR[action]}`}>
                    {updating === b.id ? '…' : ACTION_LABEL[action]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
