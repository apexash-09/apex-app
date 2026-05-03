import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { shopService, bookingService, paymentService } from '../../services'

const STEPS = ['Service', 'Date & Time', 'Confirm']

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function fmt(d) { return d.toISOString().split('T')[0] }
function display(d) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) }

export default function BookingFlow() {
  const { shopId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const preselect = searchParams.get('service')

  const [step, setStep]             = useState(preselect ? 1 : 0)
  const [shop, setShop]             = useState(null)
  const [services, setServices]     = useState([])
  const [selectedSvc, setSelectedSvc] = useState(null)
  const [selectedDate, setSelectedDate] = useState(fmt(addDays(new Date(), 1)))
  const [slots, setSlots]           = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [notes, setNotes]           = useState('')

  const dates = Array.from({ length: 10 }, (_, i) => addDays(new Date(), i + 1))

  useEffect(() => {
    Promise.all([shopService.get(shopId), shopService.getServices(shopId)])
      .then(([s, sv]) => {
        setShop(s.data)
        const avail = sv.data.filter(x => x.is_available)
        setServices(avail)
        if (preselect) setSelectedSvc(avail.find(x => x.id === preselect) || avail[0])
      })
  }, [shopId])

  useEffect(() => {
    if (!selectedSvc || !selectedDate) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    shopService.getSlots(shopId, { service_id: selectedSvc.id, slot_date: selectedDate })
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedSvc, selectedDate])

  const handleConfirm = async () => {
    if (!selectedSvc || !selectedSlot) return
    setSubmitting(true); setError('')
    try {
      const { data } = await bookingService.create({
        shop_id: shopId,
        service_id: selectedSvc.id,
        slot_date: selectedDate,
        slot_time: selectedSlot.time,
        notes: notes || undefined,
      })
      setBooking(data)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. Try another slot.')
    } finally { setSubmitting(false) }
  }

  if (step === 3 && booking) return <SuccessScreen booking={booking} shop={shop} service={selectedSvc} />

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }} className="px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(`/shop/${shopId}`)}
            className="bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center">‹</button>
          <h1 className="text-white font-bold text-lg">{shop?.name}</h1>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i <= step ? 'bg-white text-orange-600' : 'bg-white/30 text-white'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i <= step ? 'text-white' : 'text-white/50'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-white' : 'bg-white/30'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">

        {/* Step 0 — Select Service */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800 mb-4">Choose a Service</h2>
            {services.map(svc => (
              <button key={svc.id} onClick={() => { setSelectedSvc(svc); setStep(1) }}
                className="w-full text-left bg-white rounded-2xl p-4 border flex items-center justify-between transition hover:shadow-md"
                style={{ borderColor: selectedSvc?.id === svc.id ? '#C0622F' : '#F0DFD0', borderWidth: selectedSvc?.id === svc.id ? 2 : 1 }}>
                <div>
                  <p className="font-semibold text-gray-900">{svc.name}</p>
                  {svc.description && <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">⏱ {svc.duration_minutes} min</p>
                </div>
                <p className="font-bold text-gray-900 ml-4">₹{svc.price}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1 — Date & Time */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-bold text-gray-800 mb-3">Pick a Date</h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dates.map(d => (
                  <button key={fmt(d)} onClick={() => setSelectedDate(fmt(d))}
                    className="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border-2 transition"
                    style={{
                      background: selectedDate === fmt(d) ? '#C0622F' : '#fff',
                      color: selectedDate === fmt(d) ? '#fff' : '#374151',
                      borderColor: selectedDate === fmt(d) ? '#C0622F' : '#F0DFD0',
                    }}>
                    <span className="text-xs font-medium">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                    <span className="text-xs">{d.toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-gray-800 mb-3">Pick a Time</h2>
              {slotsLoading && (
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              )}
              {!slotsLoading && slots.length === 0 && (
                <p className="text-center text-gray-400 py-6">No slots available on this date</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {slots.map(slot => (
                  <button key={slot.time} disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className="py-3 rounded-xl text-sm font-semibold border-2 transition"
                    style={{
                      background: !slot.available ? '#F3F4F6' : selectedSlot?.time === slot.time ? '#C0622F' : '#fff',
                      color: !slot.available ? '#9CA3AF' : selectedSlot?.time === slot.time ? '#fff' : '#374151',
                      borderColor: !slot.available ? '#E5E7EB' : selectedSlot?.time === slot.time ? '#C0622F' : '#F0DFD0',
                      textDecoration: !slot.available ? 'line-through' : 'none',
                    }}>
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <button disabled={!selectedSlot} onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl font-bold text-white transition disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 mb-4">Confirm Booking</h2>

            <div className="bg-white rounded-2xl p-5 border space-y-3" style={{ borderColor: '#F0DFD0' }}>
              <Row label="Shop"    value={shop?.name} />
              <Row label="Service" value={selectedSvc?.name} />
              <Row label="Date"    value={display(new Date(selectedDate + 'T00:00:00'))} />
              <Row label="Time"    value={selectedSlot?.time} />
              <Row label="Duration" value={`${selectedSvc?.duration_minutes} min`} />
              <div className="border-t pt-3" style={{ borderColor: '#F0DFD0' }}>
                <Row label="Amount" value={`₹${selectedSvc?.price}`} bold />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="e.g. Prefer a female stylist"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                style={{ borderColor: '#E8C4A8' }} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              A confirmation will be sent to your WhatsApp
            </p>

            <button disabled={submitting} onClick={handleConfirm}
              className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
              {submitting ? 'Booking…' : '✓ Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900 text-base' : 'font-medium text-gray-800'}`}>{value}</span>
    </div>
  )
}

function SuccessScreen({ booking, shop, service }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FDF6EE' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
        style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
      <p className="text-gray-500 text-sm mb-6">Check your WhatsApp for the confirmation message</p>

      <div className="w-full bg-white rounded-2xl p-5 border mb-6 space-y-3 text-left" style={{ borderColor: '#F0DFD0' }}>
        <div className="text-center pb-3 border-b" style={{ borderColor: '#F0DFD0' }}>
          <p className="text-2xl font-bold tracking-widest" style={{ color: '#C0622F' }}>{booking.confirmation_code}</p>
          <p className="text-xs text-gray-400 mt-1">Your booking code</p>
        </div>
        <Row label="Shop"    value={shop?.name} />
        <Row label="Service" value={service?.name} />
        <Row label="Date"    value={booking.slot_date} />
        <Row label="Time"    value={booking.slot_time} />
        <Row label="Amount"  value={`₹${booking.amount_paid}`} bold />
      </div>

      <Link to="/dashboard" className="w-full block py-4 rounded-2xl font-bold text-white text-center mb-3"
        style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
        View My Bookings
      </Link>
      <Link to="/" className="text-sm text-gray-500 underline">Back to Home</Link>
    </div>
  )
}
