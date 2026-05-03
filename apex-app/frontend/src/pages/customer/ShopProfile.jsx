import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { shopService } from '../../services'
import useAuthStore from '../../store/authStore'

export default function ShopProfile() {
  const { shopId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [shop, setShop]         = useState(null)
  const [services, setServices] = useState([])
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('services')

  useEffect(() => {
    Promise.all([
      shopService.get(shopId),
      shopService.getServices(shopId),
      shopService.getReviews(shopId),
    ]).then(([s, sv, r]) => {
      setShop(s.data); setServices(sv.data); setReviews(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [shopId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6EE' }}>
      <div className="text-4xl animate-spin">✂️</div>
    </div>
  )

  if (!shop) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FDF6EE' }}>
      <p className="text-gray-500">Shop not found</p>
    </div>
  )

  const rating = Math.round(shop.avg_rating)

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>

      {/* Header banner */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
        <Link to="/" className="absolute top-4 left-4 bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg">‹</Link>
        <div className="flex items-center justify-center py-14">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl">✂️</div>
        </div>
      </div>

      {/* Shop info card */}
      <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-md p-5" style={{ borderColor: '#F0DFD0', border: '1px solid' }}>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1 pr-3">{shop.name}</h1>
          <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold ${shop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {shop.status === 'active' ? '● Open' : '● Closed'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-3">📍 {shop.address}, {shop.area}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm" style={{ color: '#C0622F' }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
            <span className="text-sm text-gray-500">{shop.avg_rating > 0 ? `${shop.avg_rating}` : 'New'}</span>
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">{shop.review_count} reviews</span>
          <span className="text-gray-300">|</span>
          <a href={`tel:${shop.phone}`} className="text-sm font-medium" style={{ color: '#C0622F' }}>📞 Call</a>
        </div>
        {shop.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{shop.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-5 flex gap-1 bg-white rounded-2xl p-1 border" style={{ borderColor: '#F0DFD0' }}>
        {['services', 'reviews'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition capitalize"
            style={{
              background: tab === t ? '#C0622F' : 'transparent',
              color: tab === t ? '#fff' : '#9B7560',
            }}>
            {t === 'services' ? `Services (${services.length})` : `Reviews (${reviews.length})`}
          </button>
        ))}
      </div>

      {/* Services tab */}
      {tab === 'services' && (
        <div className="mx-4 mt-4 space-y-3 pb-32">
          {services.length === 0 && (
            <p className="text-center text-gray-400 py-10">No services listed yet</p>
          )}
          {services.map(svc => (
            <div key={svc.id} className="bg-white rounded-2xl p-4 border flex items-center justify-between"
              style={{ borderColor: '#F0DFD0' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                  {!svc.is_available && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>
                {svc.description && <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>}
                <p className="text-xs text-gray-400 mt-1">⏱ {svc.duration_minutes} min</p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-gray-900">₹{svc.price}</p>
                {svc.is_available && shop.status === 'active' && (
                  <button
                    onClick={() => isAuthenticated
                      ? navigate(`/book/${shopId}?service=${svc.id}`)
                      : navigate(`/login?next=/book/${shopId}?service=${svc.id}`)
                    }
                    className="mt-2 text-xs px-4 py-2 rounded-xl font-semibold text-white"
                    style={{ background: '#C0622F' }}>
                    Book
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && (
        <div className="mx-4 mt-4 space-y-3 pb-32">
          {reviews.length === 0 && (
            <p className="text-center text-gray-400 py-10">No reviews yet — be the first!</p>
          )}
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#F0DFD0' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">Customer</span>
                <span className="text-sm" style={{ color: '#C0622F' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sticky CTA */}
      {shop.status === 'active' && services.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t max-w-2xl mx-auto" style={{ borderColor: '#F0DFD0' }}>
          <button
            onClick={() => isAuthenticated ? navigate(`/book/${shopId}`) : navigate('/login')}
            className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg"
            style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
            Book an Appointment →
          </button>
        </div>
      )}
    </div>
  )
}
