import { useState, useEffect } from 'react'
import { adminService } from '../../services'

const ROLE_COLOR = { customer: 'text-blue-400', owner: 'text-green-400', admin: 'text-purple-400' }

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [role, setRole]     = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminService.listUsers(role || undefined)
      .then(r => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [role])

  const shown = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Users ({users.length})</h2>

      <input type="text" placeholder="Search name, phone, email…" value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />

      <div className="flex gap-2">
        {['', 'customer', 'owner', 'admin'].map(r => (
          <button key={r} onClick={() => setRole(r)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition"
            style={{
              background: role === r ? '#7C3AED' : 'transparent',
              color: role === r ? '#fff' : '#9CA3AF',
              borderColor: role === r ? '#7C3AED' : '#374151',
            }}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {loading && [1,2,3,4].map(i => <div key={i} className="bg-gray-800 h-16 rounded-2xl animate-pulse" />)}

      <div className="space-y-2">
        {shown.map(u => (
          <div key={u.id} className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-white text-sm">{u.name || 'Unnamed'}</p>
              <p className="text-xs text-gray-400">{u.phone}{u.email ? ` · ${u.email}` : ''}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold uppercase ${ROLE_COLOR[u.role]}`}>{u.role}</span>
              <p className="text-xs text-gray-500 mt-0.5">{u.is_verified ? '✓ verified' : '⚠ unverified'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
