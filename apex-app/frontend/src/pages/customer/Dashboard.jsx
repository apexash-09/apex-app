import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookingService } from '../../services'
import useAuthStore from '../../store/authStore'

const STATUS_STYLE = {
  pending:   { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: '🟡' },
  confirmed: { bg: 'bg-green-50',  text: 'text-green-700',  dot: '🟢' },
  completed: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: '🔵' },
  cancelled: { bg: 'bg-gray-100',  text: 'text-gray-500',   dot: '⚫' },
  no_show:   { bg: 'bg-red-50',    text: 'text-red-600',    dot: '🔴' },
}

export default function CustomerDashboard() {
  const { user, logout } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('upcoming')
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    bookingService.myBookings()
      .then(r => setBookings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const now = new Date().toISOString().split('T')[0]
  const upcoming = bookings.filter(b => b.slot_date >= now && !['cancelled','no_show'].includes(b.status))
  const past     = bookings.filter(b => b.slot_date < now  || ['completed','cancelled','no_show'].includes(b.status))
  const shown    = tab === 'upcoming' ? upcoming : past

  const cancel = async (id) => {
    setCancelling(id)
    try {
      await bookingService.cancel(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    } catch {}
    setCancelling(null)
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }} className="px-5 pt-10 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">Hello,</p>
            <h1 className="text-white text-xl font-bold">{user?.name || 'Guest'} 👋</h1>
            <p className="text-orange-100 text-xs mt-0.5">{user?.phone}</p>
          </div>
          <button onClick={logout} className="bg-white/20 text-white text-sm px-4 py-2 rounded-xl font-medium">
            Logout
          </button>
        </div>
        {/* Summary chips */}
        <div className="flex gap-3 mt-5">
          <Chip label="Upcoming" value={upcoming.length} />
          <Chip label="Completed" value={past.filter(b => b.status === 'completed').length} />
          <Chip label="Cancelled" value={bookings.filter(b => b.status === 'cancelled').length} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-4 flex gap-1 bg-white rounded-2xl p-1 border" style={{ borderColor: '#F0DFD0' }}>
        {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
            style={{ background: tab === k ? '#C0622F' : 'transparent', color: tab === k ? '#fff' : '#9B7560' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="px-4 py-4 space-y-3 pb-10">
        {loading && [1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
        ))}

        {!loading && shown.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500 font-medium">No {tab} bookings</p>
            {tab === 'upcoming' && (
              <Link to="/" className="mt-4 inline-block text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
                style={{ background: '#C0622F' }}>Browse Salons</Link>
            )}
          </div>
        )}

        {shown.map(b => {
          const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending
          return (
            <div key={b.id} className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#F0DFD0' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-base">{b.confirmation_code}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(b.slot_date + 'T00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
                    {' at '}
                    {b.slot_time?.slice(0,5)}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${s.bg} ${s.text}`}>
                  {s.dot} {b.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-medium">
                    💳 {b.payment_status}
                  </span>
                  <span className="text-sm font-bold text-gray-800">₹{b.amount_paid}</span>
                </div>
                {b.status === 'pending' || b.status === 'confirmed' ? (
                  <button
                    disabled={cancelling === b.id}
                    onClick={() => cancel(b.id)}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-50 disabled:opacity-50">
                    {cancelling === b.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                ) : b.status === 'completed' ? (
                  <Link to={`/shop/${b.shop_id}`}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium border"
                    style={{ color: '#C0622F', borderColor: '#E8C4A8' }}>
                    Rebook
                  </Link>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t max-w-2xl mx-auto px-4 py-3 flex justify-around"
        style={{ borderColor: '#F0DFD0' }}>
        <Link to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-600">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Home</span>
        </Link>
        <div className="flex flex-col items-center gap-1" style={{ color: '#C0622F' }}>
          <span className="text-xl">📅</span>
          <span className="text-xs font-semibold">Bookings</span>
        </div>
        <Link to="/login" className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-600">
          <span className="text-xl">👤</span>
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  )
}

function Chip({ label, value }) {
  return (
    <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
      <p className="text-white font-bold text-lg leading-none">{value}</p>
      <p className="text-orange-100 text-xs mt-0.5">{label}</p>
    </div>
  )
}
