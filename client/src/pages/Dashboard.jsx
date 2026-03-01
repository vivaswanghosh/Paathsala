import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import { HiOutlineClipboardCheck, HiOutlineDocumentText, HiOutlineCalendar, HiOutlineBookOpen, HiOutlineTrendingUp, HiOutlineSpeakerphone, HiOutlineTicket, HiOutlineDownload } from 'react-icons/hi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import DigitalIDCard from '../components/common/DigitalIDCard.jsx'

function Dashboard() {
  const { user, role } = useAuth()
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [
          api.get('/dashboard/stats'),
          api.get('/admin/leaderboard'),
          api.get('/events/my-certificates')
        ]

        if (role === 'student') {
          promises.push(api.get('/dashboard/analytics').catch(() => ({ data: null })))
        }

        const responses = await Promise.all(promises)

        setStats(responses[0].data)
        setLeaderboard(responses[1].data.leaderboard || [])
        setCertificates(responses[2].data.certificates || [])

        if (responses[3] && responses[3].data) {
          setAnalytics(responses[3].data)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Pending Labs', value: stats?.stats?.pendingLabs || 0, icon: HiOutlineClipboardCheck, color: 'blue' },
    { label: 'Upcoming Exams', value: stats?.stats?.upcomingExams || 0, icon: HiOutlineDocumentText, color: 'orange' },
    { label: 'Classes Today', value: stats?.stats?.classesToday || 0, icon: HiOutlineCalendar, color: 'green' },
    { label: 'Library Resources', value: stats?.stats?.libraryResources || 0, icon: HiOutlineBookOpen, color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {user?.name}!</h1>
          <p className="text-gray-500 dark:text-gray-400">Here's what's happening today</p>
        </div>
        <span className={`badge badge-${role === 'admin' ? 'red' : role === 'teacher' ? 'blue' : 'green'}`}>
          {role}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
            {stats?.todaySchedule?.length > 0 ? (
              <div className="space-y-3">
                {stats.todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{item.time}</div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{item.subject}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.room} • {item.teacher}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No classes scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">Take a break or work on assignments!</p>
              </div>
            )}
          </div>

          {/* Student Analytics Charting */}
          {role === 'student' && analytics && (
            <div className="card border-primary-100 bg-gradient-to-r from-white to-primary-50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <HiOutlineTrendingUp className="text-primary-600" /> My Performance Analytics
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${analytics.health.status === 'Excellent' ? 'bg-green-100 text-green-700 border-green-200' : analytics.health.status === 'Needs Attention' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                  {analytics.health.status}
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{analytics.health.message}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center uppercase">Exam Trend</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={analytics.examTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 text-center uppercase">Lab Performance (%)</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={analytics.labTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="score" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ID Card, Certificates & More */}
        <div className="space-y-6">
          {/* Digital ID Card Section */}
          <div className="card lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">My ID Card</h2>
            <DigitalIDCard />
          </div>

          {/* My Certificates */}
          {certificates.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiOutlineTicket className="text-primary-600" /> My Certificates
              </h2>
              <div className="space-y-3">
                {certificates.map(cert => (
                  <div key={cert._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{cert.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(cert.date).toLocaleDateString()}</p>
                    </div>
                    <a
                      href={`/app/events`}
                      className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🏆</span> Top Students (XP)
            </h2>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:bg-gray-900 rounded-md transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-gray-200 text-gray-600 dark:text-gray-400' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-primary-50 text-primary-600'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.department}</p>
                      </div>
                    </div>
                    <div className="font-semibold text-primary-600 text-sm">{student.xp || 0} XP</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No XP data available yet</p>
            )}
          </div>

          {/* Announcements */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
            {stats?.announcements?.length > 0 ? (
              <div className="space-y-3">
                {stats.announcements.map((item, index) => (
                  <div key={index} className="p-3 bg-blue-50/50 rounded-lg border-l-4 border-blue-400">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">No recent announcements</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
