import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingService } from '../../services'

const STEPS = [
  { key: 'pending',   label: 'Booking Received', icon: '📋', desc: 'Your booking is waiting for confirmation' },
  { key: 'confirmed', label: 'Confirmed',         icon: '✅', desc: 'Salon has confirmed your appointment' },
  { key: 'completed', label: 'Completed',          icon: '🌟', desc: 'Service completed. Thank you!' },
]

const STATUS_IDX = { pending: 0, confirmed: 1, completed: 2, cancelled: -1, no_show: -1 }

export default function OrderTracking() {
  const { orderId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const fetchBooking = () => {
    bookingService.get(orderId)
      .then(r => setBooking(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBooking()
    // Poll every 15s for live status updates
    intervalRef.current = setInterval(fetchBooking, 15000)
    return () => clearInterval(intervalRef.current)
  }, [orderId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6EE' }}>
      <div className="text-4xl animate-spin">✂️</div>
    </div>
  )

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6EE' }}>
      <div className="text-center">
        <p className="text-gray-500 mb-4">Booking not found</p>
        <Link to="/dashboard" className="text-sm underline" style={{ color: '#C0622F' }}>← My Bookings</Link>
      </div>
    </div>
  )

  const currentIdx = STATUS_IDX[booking.status] ?? 0
  const isCancelled = booking.status === 'cancelled' || booking.status === 'no_show'

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }} className="px-5 pt-10 pb-8">
        <Link to="/dashboard" className="text-orange-100 text-sm mb-4 block">← My Bookings</Link>
        <h1 className="text-white text-xl font-bold">Booking Status</h1>
        <p className="text-orange-100 text-sm mt-1">Live updates every 15 seconds</p>
      </div>

      <div className="px-4 -mt-2 space-y-4 pb-10">
        {/* Code card */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm" style={{ borderColor: '#F0DFD0' }}>
          <p className="text-xs text-gray-400 text-center mb-1">Confirmation Code</p>
          <p className="text-3xl font-bold tracking-widest text-center" style={{ color: '#C0622F' }}>
            {booking.confirmation_code}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-800">
                {new Date(booking.slot_date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-800">{booking.slot_time?.slice(0,5)} – {booking.slot_end_time?.slice(0,5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="font-bold text-gray-900">₹{booking.amount_paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <span className={`font-semibold ${booking.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {booking.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Cancelled state */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-3xl mb-2">❌</p>
            <p className="font-bold text-red-700 text-lg">Booking {booking.status.replace('_', ' ')}</p>
            <p className="text-red-500 text-sm mt-1">This appointment was cancelled</p>
            <Link to="/" className="mt-4 inline-block text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
              style={{ background: '#C0622F' }}>Book Again</Link>
          </div>
        )}

        {/* Status stepper */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#F0DFD0' }}>
            <h3 className="font-bold text-gray-800 mb-5">Appointment Status</h3>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
              <div className="space-y-6">
                {STEPS.map((step, i) => {
                  const done    = i < currentIdx
                  const active  = i === currentIdx
                  const pending = i > currentIdx
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 z-10 transition-all ${
                        done   ? 'bg-green-500 shadow-md' :
                        active ? 'shadow-lg ring-4 ring-orange-100' : 'bg-gray-100'
                      }`} style={active ? { background: 'linear-gradient(135deg, #C0622F, #E8874A)' } : {}}>
                        {done ? '✓' : step.icon}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className={`font-semibold text-sm ${pending ? 'text-gray-400' : 'text-gray-900'}`}>
                          {step.label}
                        </p>
                        {active && (
                          <p className="text-xs mt-0.5" style={{ color: '#C0622F' }}>{step.desc}</p>
                        )}
                        {done && <p className="text-xs text-green-600 mt-0.5">Done ✓</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pulse indicator for live */}
            {!isCancelled && booking.status !== 'completed' && (
              <div className="mt-5 flex items-center gap-2 text-xs text-gray-400 justify-center">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                Live tracking active — refreshes automatically
              </div>
            )}
          </div>
        )}

        {/* WhatsApp reminder */}
        {!isCancelled && booking.status !== 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-sm font-semibold text-green-800">WhatsApp updates on</p>
              <p className="text-xs text-green-600 mt-0.5">
                You'll get a WhatsApp message when the status changes and a reminder 2 hours before your appointment.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/dashboard" className="flex-1 text-center py-3.5 rounded-2xl border-2 font-semibold text-sm"
            style={{ borderColor: '#E8C4A8', color: '#C0622F' }}>
            ← My Bookings
          </Link>
          <Link to="/" className="flex-1 text-center py-3.5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
            Book Another
          </Link>
        </div>
      </div>
    </div>
  )
}
