import { Navigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import LoginButton from '../components/auth/LoginButton.jsx'

function Home() {
  const { isAuthenticated, isLoading } = useAuth0()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Paathsala
        </h1>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Your all-in-one education platform for routines, assignments, exams, AI mentoring, and more.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <LoginButton />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
          <div className="bg-white dark:bg-gray-800/10 rounded-lg p-4">
            <div className="text-3xl font-bold">Smart</div>
            <div className="text-sm text-primary-200">Routine</div>
          </div>
          <div className="bg-white dark:bg-gray-800/10 rounded-lg p-4">
            <div className="text-3xl font-bold">Lab</div>
            <div className="text-sm text-primary-200">Assignments</div>
          </div>
          <div className="bg-white dark:bg-gray-800/10 rounded-lg p-4">
            <div className="text-3xl font-bold">AI</div>
            <div className="text-sm text-primary-200">Mentor</div>
          </div>
          <div className="bg-white dark:bg-gray-800/10 rounded-lg p-4">
            <div className="text-3xl font-bold">Secure</div>
            <div className="text-sm text-primary-200">Exams</div>
          </div>
        </div>

        <p className="mt-8 text-primary-200 text-sm">
          Powered by Auth0 • Protected by JWT Authentication
        </p>
      </div>
    </div>
  )
}

export default Home
