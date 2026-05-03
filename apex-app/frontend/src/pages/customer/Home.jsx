import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { shopService } from '../../services'

const AREAS = ['Jayanagar', 'Koramangala', 'Indiranagar', 'BTM Layout', 'HSR Layout', 'Whitefield']

export default function Home() {
  const [query, setQuery]   = useState('')
  const [area, setArea]     = useState('')
  const [shops, setShops]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    shopService.list({ category: 'salon', area: area || undefined })
      .then(r => setShops(r.data))
      .catch(() => setShops([]))
      .finally(() => setLoading(false))
  }, [area])

  const filtered = shops.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #C0622F 0%, #E8874A 60%, #F4A86A 100%)' }}
        className="px-5 pt-10 pb-14 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: '#fff' }} />
        <div className="absolute top-4 -right-4 w-24 h-24 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="relative">
          <p className="text-orange-100 text-sm font-medium tracking-widest uppercase mb-1">Your Neighbourhood</p>
          <h1 className="text-white text-3xl font-bold leading-tight mb-1">Book Local</h1>
          <h1 className="text-orange-100 text-3xl font-bold leading-tight mb-5">Salons Instantly ✂️</h1>
          <p className="text-orange-100 text-sm opacity-80 mb-6">No calls. No walk-ins. Book your slot in 3 taps.</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Search salons…" value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl text-gray-800 text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              style={{ background: '#FFFDF9' }} />
          </div>
        </div>
      </div>

      {/* Area chips */}
      <div className="px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All Areas', ...AREAS].map(a => (
            <button key={a} onClick={() => setArea(a === 'All Areas' ? '' : (a === area ? '' : a))}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-2 transition"
              style={{
                background: (a === 'All Areas' && area === '') || a === area ? '#C0622F' : '#FFFDF9',
                color: (a === 'All Areas' && area === '') || a === area ? '#fff' : '#7C4A2D',
                borderColor: (a === 'All Areas' && area === '') || a === area ? '#C0622F' : '#E8C4A8',
              }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">{area ? `Salons in ${area}` : 'All Salons'}</h2>
          <span className="text-sm text-gray-400">{filtered.length} found</span>
        </div>

        {loading && [1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" style={{ borderColor: '#F0DFD0' }} />
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-gray-500 font-medium">No salons found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different area</p>
          </div>
        )}

        {filtered.map(shop => <ShopCard key={shop.id} shop={shop} />)}
      </div>

      <div className="px-4 pb-10 text-center">
        <p className="text-xs text-gray-400">Are you a salon owner?{' '}
          <Link to="/owner/register" className="underline" style={{ color: '#C0622F' }}>List your business free →</Link>
        </p>
      </div>
    </div>
  )
}

function ShopCard({ shop }) {
  const rating = Math.round(shop.avg_rating)
  return (
    <Link to={`/shop/${shop.id}`}>
      <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 hover:shadow-md transition"
        style={{ borderColor: '#F0DFD0' }}>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 text-3xl"
          style={{ background: '#FDF0E5' }}>✂️</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 truncate">{shop.name}</h3>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${shop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {shop.status === 'active' ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{shop.area}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs" style={{ color: '#C0622F' }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
            <span className="text-xs text-gray-400">
              {shop.avg_rating > 0 ? `${shop.avg_rating} · ${shop.review_count} reviews` : 'New'}
            </span>
          </div>
        </div>
        <span className="text-gray-300">›</span>
      </div>
    </Link>
  )
}
