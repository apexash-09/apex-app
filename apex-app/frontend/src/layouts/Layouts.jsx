// CustomerLayout.jsx
import { Outlet, Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export function CustomerLayout() {
  const { isAuthenticated, logout } = useAuthStore()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">✂️</span>
          <span className="font-bold text-gray-900">Apex</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">My Bookings</Link>
              <button onClick={logout} className="text-sm text-red-500">Logout</button>
            </>
          ) : (
            <Link to="/login" className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium">Login</Link>
          )}
        </div>
      </header>
      <main className="max-w-2xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}

// OwnerLayout.jsx
export function OwnerLayout() {
  const { user, logout } = useAuthStore()
  const navItems = [
    { to: '/owner',           label: '🏠 Home' },
    { to: '/owner/bookings',  label: '📅 Bookings' },
    { to: '/owner/services',  label: '✂️ Services' },
    { to: '/owner/schedule',  label: '🗓️ Schedule' },
    { to: '/owner/analytics', label: '📊 Analytics' },
    { to: '/owner/profile',   label: '🏪 Profile' },
  ]
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 fixed h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <p className="font-bold text-gray-900">✂️ Apex Owner</p>
          <p className="text-xs text-gray-500 truncate">{user?.name || user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(n => (
            <Link key={n.to} to={n.to}
              className="block px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={logout} className="w-full text-sm text-red-500 py-2 hover:bg-red-50 rounded-xl">
            Logout
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-6 max-w-3xl">
        <Outlet />
      </main>
    </div>
  )
}

// AdminLayout.jsx
export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navItems = [
    { to: '/admin',           label: '🏠 Dashboard' },
    { to: '/admin/shops',     label: '🏪 Shops' },
    { to: '/admin/users',     label: '👥 Users' },
    { to: '/admin/analytics', label: '📊 Revenue' },
  ]
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <aside className="w-56 bg-gray-800 border-r border-gray-700 fixed h-full flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <p className="font-bold text-white">🛡️ Apex Admin</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(n => (
            <Link key={n.to} to={n.to}
              className="block px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-purple-900 hover:text-purple-200 font-medium transition">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <button onClick={logout} className="w-full text-sm text-red-400 py-2 hover:bg-red-900/30 rounded-xl">
            Logout
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default CustomerLayout
