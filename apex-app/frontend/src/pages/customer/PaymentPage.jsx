import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { bookingService, paymentService } from '../../services'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    bookingService.get(bookingId)
      .then(r => setBooking(r.data))
      .catch(() => setError('Booking not found'))
      .finally(() => setLoading(false))
  }, [bookingId])

  const handlePay = async () => {
    setPaying(true); setError('')
    try {
      // 1. Create Razorpay order on backend
      const { data: order } = await paymentService.createOrder({
        booking_id: bookingId,
        amount: booking.amount_paid,
      })

      // 2. Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(booking.amount_paid * 100),
        currency: 'INR',
        name: 'Apex Local App',
        description: `Booking ${booking.confirmation_code}`,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          // 3. Verify signature on backend
          try {
            await paymentService.verify({
              booking_id: bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            })
            navigate(`/track/${bookingId}?paid=1`)
          } catch {
            setError('Payment verification failed. Contact support with your payment ID.')
          }
        },
        prefill: {},
        theme: { color: '#C0622F' },
        modal: {
          ondismiss: () => setPaying(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed. Try again.')
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6EE' }}>
      <div className="text-4xl animate-spin">✂️</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }} className="px-5 pt-10 pb-8">
        <Link to={`/track/${bookingId}`} className="text-orange-100 text-sm block mb-4">← Back</Link>
        <h1 className="text-white text-xl font-bold">Complete Payment</h1>
        <p className="text-orange-100 text-sm mt-1">Secure payment via Razorpay</p>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Order summary */}
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: '#F0DFD0' }}>
          <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Booking Code</span>
              <span className="font-semibold" style={{ color: '#C0622F' }}>{booking?.confirmation_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium text-gray-800">
                {booking?.slot_date} at {booking?.slot_time?.slice(0,5)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between" style={{ borderColor: '#F0DFD0' }}>
              <span className="font-semibold text-gray-800">Total Amount</span>
              <span className="font-bold text-gray-900 text-lg">₹{booking?.amount_paid}</span>
            </div>
          </div>
        </div>

        {/* Payment methods info */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Accepted Payment Methods</p>
          <div className="flex flex-wrap gap-2">
            {['UPI (Free)', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'].map(m => (
              <span key={m} className="text-xs bg-white border border-green-200 text-green-700 px-3 py-1 rounded-full">
                {m}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying || booking?.payment_status === 'paid'}
          className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
          {paying ? 'Opening Payment…'
            : booking?.payment_status === 'paid' ? '✓ Already Paid'
            : `Pay ₹${booking?.amount_paid} →`}
        </button>

        <p className="text-center text-xs text-gray-400">
          🔒 Powered by Razorpay. Your payment info is never stored on our servers.
        </p>

        <Link to={`/track/${bookingId}`}
          className="block text-center text-sm py-3 rounded-2xl border-2 font-medium"
          style={{ color: '#C0622F', borderColor: '#E8C4A8' }}>
          Pay Later (Cash at Salon)
        </Link>
      </div>
    </div>
  )
}
