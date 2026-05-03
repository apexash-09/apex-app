import { useState, useEffect } from 'react'
import { shopService } from '../../services'
import useAuthStore from '../../store/authStore'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DEFAULT_DAY = { open_time: '09:00', close_time: '19:00', is_working_day: true, buffer_minutes: 10, max_concurrent: 1 }

export default function OwnerSchedule() {
  const { user } = useAuthStore()
  const shopId = user?.shop_id
  const [schedule, setSchedule] = useState(
    DAYS.map((_, i) => ({ day_of_week: i, ...DEFAULT_DAY }))
  )
  const [saving, setSaving]       = useState(null)
  const [saved, setSaved]         = useState(null)
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blocking, setBlocking]   = useState(false)
  const [blockedMsg, setBlockedMsg] = useState('')

  const update = (dayIdx, field, value) => {
    setSchedule(prev => prev.map((d, i) => i === dayIdx ? { ...d, [field]: value } : d))
  }

  const saveDay = async (dayIdx) => {
    setSaving(dayIdx); setSaved(null)
    try {
      await shopService.setSchedule(shopId, schedule[dayIdx])
      setSaved(dayIdx)
      setTimeout(() => setSaved(null), 2000)
    } catch {}
    setSaving(null)
  }

  const addBlockDate = async () => {
    if (!blockDate) return
    setBlocking(true)
    try {
      await shopService.blockDate(shopId, { blocked_date: blockDate, reason: blockReason || undefined })
      setBlockedMsg(`${blockDate} blocked ✓`)
      setBlockDate(''); setBlockReason('')
      setTimeout(() => setBlockedMsg(''), 3000)
    } catch (err) {
      setBlockedMsg(err.response?.data?.detail || 'Failed')
    }
    setBlocking(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Schedule & Availability</h2>

      {/* Weekly hours */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <div className="px-4 py-3 border-b bg-gray-50" style={{ borderColor: '#E5E7EB' }}>
          <h3 className="font-semibold text-gray-800">Weekly Working Hours</h3>
          <p className="text-xs text-gray-500 mt-0.5">Set hours for each day and save individually</p>
        </div>

        {DAYS.map((day, i) => (
          <div key={day} className={`px-4 py-4 border-b last:border-b-0 ${!schedule[i].is_working_day ? 'bg-gray-50' : ''}`}
            style={{ borderColor: '#F3F4F6' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => update(i, 'is_working_day', !schedule[i].is_working_day)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${schedule[i].is_working_day ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${schedule[i].is_working_day ? 'left-5' : 'left-0.5'}`} />
                </button>
                <span className="font-semibold text-gray-800 text-sm">{day}</span>
              </div>
              {schedule[i].is_working_day && (
                <button onClick={() => saveDay(i)}
                  disabled={saving === i}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${saved === i ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {saving === i ? '…' : saved === i ? '✓ Saved' : 'Save'}
                </button>
              )}
            </div>

            {schedule[i].is_working_day && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Open</label>
                  <input type="time" value={schedule[i].open_time}
                    onChange={e => update(i, 'open_time', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Close</label>
                  <input type="time" value={schedule[i].close_time}
                    onChange={e => update(i, 'close_time', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Buffer (min)</label>
                  <input type="number" min={0} max={60} value={schedule[i].buffer_minutes}
                    onChange={e => update(i, 'buffer_minutes', parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Max concurrent</label>
                  <input type="number" min={1} max={10} value={schedule[i].max_concurrent}
                    onChange={e => update(i, 'max_concurrent', parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Block a date */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E7EB' }}>
        <h3 className="font-semibold text-gray-800 mb-1">Block a Date</h3>
        <p className="text-xs text-gray-500 mb-4">Holidays, personal leaves, maintenance days</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Date to block</label>
            <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Reason (optional)</label>
            <input type="text" placeholder="e.g. Public holiday" value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {blockedMsg && (
            <p className={`text-sm font-medium ${blockedMsg.includes('✓') ? 'text-green-600' : 'text-red-500'}`}>{blockedMsg}</p>
          )}

          <button disabled={!blockDate || blocking} onClick={addBlockDate}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-red-600">
            {blocking ? 'Blocking…' : '🚫 Block This Date'}
          </button>
        </div>
      </div>
    </div>
  )
}
