import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import RoleRoute from './components/auth/RoleRoute.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { useEffect } from 'react' // Import useEffect
import { useAuth0 } from '@auth0/auth0-react' // Import useAuth0

import Layout from './components/common/Layout.jsx'
import Home from './pages/Home.jsx'
import Callback from './pages/Callback.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Routine from './pages/Routine.jsx'
import Labs from './pages/Labs.jsx'
import LabDetail from './pages/LabDetail.jsx'
import Exams from './pages/Exams.jsx'
import ExamPage from './pages/ExamPage.jsx'
import Calendar from './pages/Calendar.jsx'
import AIMentor from './pages/AIMentor.jsx'
import Library from './pages/Library.jsx'
import Jobs from './pages/Jobs.jsx'
import Attendance from './pages/Attendance.jsx'
import Feedback from './pages/Feedback.jsx'
import Forum from './pages/Forum.jsx'
import StudyRoom from './pages/StudyRoom.jsx'
import Profile from './pages/Profile.jsx'
import Help from './pages/Help.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Assignments from './pages/Assignments.jsx'
import AssignmentDetail from './pages/AssignmentDetail.jsx'
import Events from './pages/Events.jsx'
import Notifications from './pages/Notifications.jsx'

// Component to handle session checks
const SessionHandler = ({ children }) => {
  const { isAuthenticated, logout } = useAuth0()

  useEffect(() => {
    // If user is authenticated according to Auth0
    if (isAuthenticated) {
      // Check if our session flag exists in sessionStorage
      const isSessionActive = sessionStorage.getItem('app_session_active')

      if (!isSessionActive) {
        // If no flag, it means tab was closed (sessionStorage cleared) but localStorage (Auth0) persisted
        // We must log them out to enforce "Tab Close = Logout"
        console.log('Session expired (tab closed), logging out...')
        logout({ logoutParams: { returnTo: window.location.origin } })
      } else {
        // If flag exists, it's a reload, do nothing (stay logged in)
        // Ensure the flag is set (refresh it)
        sessionStorage.setItem('app_session_active', 'true')
      }
    }
  }, [isAuthenticated, logout])

  // Set the flag whenever user logs in
  useEffect(() => {
    if (isAuthenticated) {
      sessionStorage.setItem('app_session_active', 'true')
    }
  }, [isAuthenticated])

  return children
}

const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'your-tenant.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your_client_id',
  cacheLocation: 'localstorage', // CHANGED: Use localstorage to survive reloads
  authorizationParams: {
    redirect_uri: window.location.origin + '/callback',
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://smart-college-api',
    scope: 'openid profile email'
  }
}

function App() {
  return (
    <Auth0Provider {...auth0Config}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* Wrap everything in SessionHandler to check tab-close logic */}
            <SessionHandler>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/change-password" element={<ChangePassword />} />

                <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="routine" element={<Routine />} />
                  <Route path="labs" element={<Labs />} />
                  <Route path="labs/:id" element={<LabDetail />} />
                  <Route path="exams" element={<Exams />} />
                  <Route path="exams/:id" element={<ExamPage />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="ai-mentor" element={<AIMentor />} />
                  <Route path="library" element={<Library />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="feedback" element={<Feedback />} />
                  <Route path="forum" element={<Forum />} />
                  <Route path="study-room/:roomId" element={<StudyRoom />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="help" element={<Help />} />
                  <Route path="assignments" element={<Assignments />} />
                  <Route path="assignments/:id" element={<AssignmentDetail />} />
                  <Route path="events" element={<Events />} />
                  <Route path="notifications" element={<Notifications />} />

                  <Route path="admin/*" element={
                    <RoleRoute allowedRoles={['admin']}>
                      <AdminPanel />
                    </RoleRoute>
                  } />
                </Route>
              </Routes>
              <Toaster position="top-right" />
            </SessionHandler>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </Auth0Provider>
  )
}

export default App
