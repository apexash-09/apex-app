import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FDF6EE' }}>
      <div className="text-8xl mb-4">✂️</div>
      <h1 className="text-6xl font-bold mb-2" style={{ color: '#C0622F' }}>404</h1>
      <p className="text-xl font-bold text-gray-800 mb-2">Page Not Found</p>
      <p className="text-gray-500 text-sm mb-8">
        Looks like this page got a haircut and disappeared.
      </p>
      <Link to="/" className="px-8 py-4 rounded-2xl text-white font-bold text-base"
        style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }}>
        Back to Home
      </Link>
    </div>
  )
}
