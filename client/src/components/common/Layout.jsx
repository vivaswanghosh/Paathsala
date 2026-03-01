import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import LogoutButton from '../auth/LogoutButton.jsx'
import NotificationBell from './NotificationBell.jsx'
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineBookOpen,
  HiOutlineClipboardCheck,
  HiOutlineDocumentText,
  HiOutlineLibrary,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineSpeakerphone,
  HiOutlineChatAlt2,
  HiOutlineChat,
  HiOutlineQuestionMarkCircle,
  HiOutlineClipboardList, // Added Icon
  HiOutlineTicket,
  HiOutlineSun,
  HiOutlineMoon
} from 'react-icons/hi'

const menuItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: HiOutlineHome, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/routine', label: 'Routine', icon: HiOutlineCalendar, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/labs', label: 'Lab Assignments', icon: HiOutlineClipboardCheck, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/assignments', label: 'Assignments', icon: HiOutlineClipboardList, roles: ['student', 'teacher', 'admin', 'hod'] }, // Added Item
  { path: '/app/exams', label: 'Exams', icon: HiOutlineDocumentText, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/attendance', label: 'Attendance', icon: HiOutlineUserGroup, roles: ['student', 'teacher', 'admin'] },
  { path: '/app/feedback', label: 'Grievance Cell', icon: HiOutlineSpeakerphone, roles: ['student', 'admin', 'hod'] },
  { path: '/app/calendar', label: 'Calendar', icon: HiOutlineCalendar, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/ai-mentor', label: 'AI Mentor', icon: HiOutlineChat, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/forum', label: 'Campus Forum', icon: HiOutlineChatAlt2, roles: ['student', 'teacher', 'admin'] },
  { path: '/app/library', label: 'Library', icon: HiOutlineLibrary, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/jobs', label: 'Placements', icon: HiOutlineBriefcase, roles: ['student', 'tpo', 'admin', 'hod'] },
  { path: '/app/events', label: 'Events & Workshops', icon: HiOutlineTicket, roles: ['student', 'teacher', 'admin', 'hod'] },
  { path: '/app/help', label: 'Support & Help', icon: HiOutlineQuestionMarkCircle, roles: ['student', 'teacher', 'admin', 'hod', 'tpo'] },
  { path: '/app/admin', label: 'Admin Panel', icon: HiOutlineCog, roles: ['admin', 'hod'] },
]

function Layout() {
  const { user, role } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filteredMenu = menuItems.filter(item => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/app" className="text-xl font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
              <img src="/logo.png" alt="Paathsala Logo" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
              <span>Paathsala</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-400 font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mr-4"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {filteredMenu.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
            </h1>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <HiOutlineSun className="w-6 h-6" /> : <HiOutlineMoon className="w-6 h-6" />}
              </button>
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
