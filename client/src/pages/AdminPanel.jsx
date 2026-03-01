import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineClipboardCheck } from 'react-icons/hi'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [reapprovalRequests, setReapprovalRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProvisionModal, setShowProvisionModal] = useState(false)
  const [csvData, setCsvData] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const response = await api.get('/admin/users')
        setUsers(response.data.users || [])
      } else if (activeTab === 'reapproval') {
        const response = await api.get('/admin/reapproval-requests')
        setReapprovalRequests(response.data.requests || [])
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const provisionUsers = async () => {
    try {
      const response = await api.post('/admin/provision-users', { csvData })
      toast.success(`Created ${response.data.successful} users`)
      setShowProvisionModal(false)
      setCsvData('')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to provision users')
    }
  }

  const approveReapproval = async (requestId) => {
    try {
      await api.post(`/admin/reapproval/${requestId}/approve`)
      toast.success('Re-approval granted')
      fetchData()
    } catch (error) {
      toast.error('Failed to approve')
    }
  }

  const rejectReapproval = async (requestId) => {
    try {
      await api.post(`/admin/reapproval/${requestId}/reject`)
      toast.success('Re-approval rejected')
      fetchData()
    } catch (error) {
      toast.error('Failed to reject')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'users', label: 'Users', icon: HiOutlineUserGroup },
          { id: 'reapproval', label: 'Exam Re-approvals', icon: HiOutlineDocumentText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowProvisionModal(true)} className="btn-primary">
              Provision Users from CSV
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500 dark:text-gray-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="p-3">
                      <span className={`badge badge-${user.role === 'admin' ? 'red' : user.role === 'teacher' ? 'blue' : 'green'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{user.department}</td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Re-approvals Tab */}
      {activeTab === 'reapproval' && (
        <div className="space-y-4">
          {reapprovalRequests.length === 0 ? (
            <div className="card text-center py-12">
              <HiOutlineClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending re-approval requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reapprovalRequests.map(request => (
                <div key={request._id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{request.studentName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{request.examTitle}</p>
                      <p className="text-sm text-red-600 mt-1">
                        Auto-submitted: {request.autoSubmitReason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveReapproval(request._id)}
                        className="btn-primary"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectReapproval(request._id)}
                        className="btn-danger"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provision Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Provision Users from CSV</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4 text-sm">
              <p className="font-medium mb-2">CSV Format:</p>
              <code className="text-gray-600 dark:text-gray-400">
                firstName,lastName,dateOfBirth,batchYear,role,department
              </code>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Example: John,Doe,2001-05-15,2023,student,Computer Science
              </p>
            </div>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="input-field h-48 font-mono text-sm"
              placeholder="firstName,lastName,dateOfBirth,batchYear,role,department
John,Doe,2001-05-15,2023,student,Computer Science
Jane,Smith,2000-08-22,2023,student,Computer Science"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowProvisionModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={provisionUsers} className="btn-primary flex-1">
                Create Users
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
