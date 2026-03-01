import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'
import api from '../utils/api'

export default function SecurityDashboard() {
  const { user } = useContext(AuthContext)
  const isAdmin = user?.role === 'admin' || user?.role === 'hod'
  
  const [myHistory, setMyHistory] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [allUsersHistory, setAllUsersHistory] = useState([])
  const [allUsersStats, setAllUsersStats] = useState(null)
  const [suspiciousUsers, setSuspiciousUsers] = useState([])
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [viewMode, setViewMode] = useState('my')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [verifying, setVerifying] = useState(false)
  
  const [filters, setFilters] = useState({
    email: '',
    eventType: '',
    isSuspicious: '',
    startDate: '',
    endDate: ''
  })
  
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  })

  useEffect(() => {
    fetchMyData()
    if (isAdmin) {
      fetchAllUsersData()
      fetchSuspiciousUsers()
      fetchUsersList()
    }
  }, [isAdmin])

  async function fetchMyData() {
    try {
      const [historyRes, statsRes] = await Promise.all([
        api.get('/api/security/history'),
        api.get('/api/security/stats')
      ])
      setMyHistory(historyRes.data)
      setMyStats(statsRes.data)
    } catch (error) {
      console.error('Failed to fetch personal security data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllUsersData(newOffset = 0) {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: newOffset,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v)
        )
      })
      
      const res = await api.get(`/api/security/admin/all-users?${params}`)
      setAllUsersHistory(res.data.logs)
      setPagination(prev => ({ ...prev, offset: newOffset, total: res.data.total }))
    } catch (error) {
      console.error('Failed to fetch all users data:', error)
    }
  }

  async function fetchAllUsersStats() {
    try {
      const res = await api.get('/api/security/admin/stats')
      setAllUsersStats(res.data)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    }
  }

  async function fetchSuspiciousUsers() {
    try {
      const res = await api.get('/api/security/admin/suspicious-users?days=7')
      setSuspiciousUsers(res.data)
    } catch (error) {
      console.error('Failed to fetch suspicious users:', error)
    }
  }

  async function fetchUsersList() {
    try {
      const res = await api.get('/api/security/admin/users-list')
      setUsersList(res.data)
    } catch (error) {
      console.error('Failed to fetch users list:', error)
    }
  }

  async function fetchUserDetails(userId) {
    try {
      const res = await api.get(`/api/security/admin/user/${userId}`)
      setSelectedUser(res.data)
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    }
  }

  async function verifyBlockchain(event) {
    if (!event.algorandTxId) return
    setVerifying(true)
    try {
      const res = await api.get(`/api/security/verify/${event.algorandTxId}`)
      setSelectedEvent({ ...event, verified: res.data })
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setVerifying(false)
    }
  }

  async function syncAuth0Logs() {
    try {
      const res = await api.get('/api/security/sync-auth0')
      alert(`Synced ${res.data.synced} of ${res.data.total} logs from Auth0`)
      fetchAllUsersData()
    } catch (error) {
      console.error('Sync failed:', error)
      alert('Failed to sync logs')
    }
  }

  function applyFilters() {
    setPagination(prev => ({ ...prev, offset: 0 }))
    fetchAllUsersData(0)
  }

  function clearFilters() {
    setFilters({
      email: '',
      eventType: '',
      isSuspicious: '',
      startDate: '',
      endDate: ''
    })
    fetchAllUsersData(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Login Activity & Security</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={syncAuth0Logs}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            >
              Sync from Auth0
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('my')}
          className={`px-4 py-2 rounded ${viewMode === 'my' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          My Activity
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => { setViewMode('all'); fetchAllUsersStats(); fetchAllUsersData(); }}
              className={`px-4 py-2 rounded ${viewMode === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              All Users
            </button>
            <button
              onClick={() => setViewMode('suspicious')}
              className={`px-4 py-2 rounded ${viewMode === 'suspicious' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              Suspicious ({suspiciousUsers.length})
            </button>
          </>
        )}
      </div>

      {viewMode === 'my' && (
        <>
          {myStats && <StatsCards stats={myStats} />}
          <LoginHistoryTable 
            history={myHistory} 
            onVerify={verifyBlockchain}
            verifying={verifying}
          />
        </>
      )}

      {viewMode === 'all' && isAdmin && (
        <>
          {allUsersStats && <AdminStatsCards stats={allUsersStats} />}
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <div className="grid grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Email search..."
                value={filters.email}
                onChange={(e) => setFilters(f => ({ ...f, email: e.target.value }))}
                className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
              />
              <select
                value={filters.eventType}
                onChange={(e) => setFilters(f => ({ ...f, eventType: e.target.value }))}
                className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value="">All Events</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="mfa_required">MFA Required</option>
              </select>
              <select
                value={filters.isSuspicious}
                onChange={(e) => setFilters(f => ({ ...f, isSuspicious: e.target.value }))}
                className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value="">All Status</option>
                <option value="true">Suspicious Only</option>
                <option value="false">Normal Only</option>
              </select>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
              >
                Clear
              </button>
            </div>
          </div>

          <LoginHistoryTable 
            history={allUsersHistory} 
            onVerify={verifyBlockchain}
            verifying={verifying}
            showUser={true}
            onViewUser={fetchUserDetails}
          />

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAllUsersData(pagination.offset - pagination.limit)}
                disabled={pagination.offset === 0}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchAllUsersData(pagination.offset + pagination.limit)}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {viewMode === 'suspicious' && isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Users with Suspicious Activity (Last 7 Days)
            </h2>
          </div>
          {suspiciousUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No suspicious activity detected</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Suspicious Events</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reasons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {suspiciousUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                    <td className="px-6 py-4">
                      <div className="font-medium">{u.email}</div>
                      <div className="text-xs text-gray-500">ID: {u._id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                        {u.suspiciousCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(u.lastSuspicious).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.reasons.flat().map((reason, i) => (
                          <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {reason.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => fetchUserDetails(u._id)}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">User Security Details</h3>
                  <p className="text-sm text-gray-500">{selectedUser.history[0]?.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <p className="text-xs text-gray-500">Total Logins (30d)</p>
                  <p className="text-xl font-bold">{selectedUser.stats.totalLogins}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <p className="text-xs text-gray-500">Failed Attempts</p>
                  <p className="text-xl font-bold text-red-500">{selectedUser.stats.failedAttempts}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <p className="text-xs text-gray-500">Suspicious Events</p>
                  <p className="text-xl font-bold text-orange-500">{selectedUser.stats.suspiciousEvents}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <p className="text-xs text-gray-500">Unique Devices</p>
                  <p className="text-xl font-bold">{selectedUser.stats.uniqueDevices}</p>
                </div>
              </div>
              
              <h4 className="font-semibold mb-3">Recent Activity</h4>
              <LoginHistoryTable 
                history={selectedUser.history} 
                onVerify={verifyBlockchain}
                verifying={verifying}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      {selectedEvent?.verified && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-green-600">✓ Blockchain Verified</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Transaction ID:</p>
                <p className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                  {selectedEvent.algorandTxId}
                </p>
              </div>
              <div>
                <p className="font-medium">Verified Data:</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedEvent.verified.data, null, 2)}
                </pre>
              </div>
              <a
                href={selectedEvent.verified.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-500 hover:underline"
              >
                View on Algorand Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Logins (30 days)</p>
        <p className="text-2xl font-bold">{stats.totalLogins}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Failed Attempts</p>
        <p className="text-2xl font-bold text-red-500">{stats.failedAttempts}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Suspicious Events</p>
        <p className="text-2xl font-bold text-orange-500">{stats.suspiciousEvents}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Unique Devices</p>
        <p className="text-2xl font-bold">{stats.uniqueDevices}</p>
      </div>
    </div>
  )
}

function AdminStatsCards({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Logins (24h)</p>
        <p className="text-2xl font-bold">{stats.last24Hours.totalLogins}</p>
        <p className="text-xs text-gray-400">{stats.last24Hours.activeUsers} active users</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Failed (24h)</p>
        <p className="text-2xl font-bold text-red-500">{stats.last24Hours.failedLogins}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Suspicious (24h)</p>
        <p className="text-2xl font-bold text-orange-500">{stats.last24Hours.suspiciousEvents}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <p className="text-sm text-gray-500">Logins (7d)</p>
        <p className="text-2xl font-bold">{stats.last7Days.totalLogins}</p>
      </div>
    </div>
  )
}

function LoginHistoryTable({ history, onVerify, verifying, showUser = false, onViewUser, compact = false }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500">
        No login history found
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
            {showUser && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {history.map((event) => (
            <tr 
              key={event._id} 
              className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                event.isSuspicious ? 'bg-red-50 dark:bg-red-900/20' : ''
              }`}
            >
              <td className={`px-4 py-3 ${compact ? 'text-xs' : 'text-sm'}`}>
                {new Date(event.timestamp).toLocaleString()}
              </td>
              {showUser && (
                <td className="px-4 py-3">
                  <div className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                    {event.userId?.name || event.email}
                  </div>
                  {event.userId?.role && (
                    <div className="text-xs text-gray-500">{event.userId.role}</div>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                  event.eventType === 'success' ? 'bg-green-100 text-green-800' :
                  event.eventType === 'failed' ? 'bg-red-100 text-red-800' :
                  event.eventType === 'mfa_required' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {event.eventType}
                </span>
              </td>
              <td className={`px-4 py-3 font-mono ${compact ? 'text-xs' : 'text-sm'}`}>
                {event.ipAddress}
                {event.city && <span className="text-gray-400 ml-1">({event.city})</span>}
              </td>
              <td className="px-4 py-3">
                <div className={compact ? 'text-xs' : 'text-sm'}>{event.browser} on {event.os}</div>
                <div className="text-xs text-gray-500">{event.deviceType}</div>
              </td>
              <td className="px-4 py-3">
                {event.isSuspicious ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-red-500 text-xs">⚠️ Suspicious</span>
                    <div className="flex flex-wrap gap-1">
                      {event.suspicionReasons?.map((reason, i) => (
                        <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                          {reason.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-green-500 text-xs">✓ Normal</span>
                )}
              </td>
              <td className="px-4 py-3">
                {event.algorandTxId ? (
                  <button
                    onClick={() => onVerify(event)}
                    className="text-blue-500 hover:underline text-xs"
                    disabled={verifying}
                  >
                    {verifying ? 'Verifying...' : 'View Chain'}
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
