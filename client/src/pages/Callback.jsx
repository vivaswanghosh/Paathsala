import { useAuth0 } from '@auth0/auth0-react'
import { Navigate } from 'react-router-dom'

function Callback() {
  const { isLoading, error, loginWithRedirect } = useAuth0()

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-3">Authentication Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error.message}</p>

          <button
            onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })}
            className="btn-primary w-full py-2.5 shadow-sm"
          >
            Log In with a Different Account
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Completing authentication...</p>
        </div>
      </div>
    )
  }

  return <Navigate to="/app/dashboard" replace />
}

export default Callback
