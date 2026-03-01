import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

function ExamPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const hasAutoSubmitted = useRef(false)
  const timerRef = useRef(null)

  const autoSubmit = useCallback(async (reason) => {
    if (hasAutoSubmitted.current) return
    hasAutoSubmitted.current = true

    try {
      await api.post(`/exam/${id}/auto-submit`, { reason })
      toast.error(`Exam auto-submitted: ${reason}`)
      navigate('/app/exams')
    } catch (error) {
      console.error('Auto-submit error:', error)
      navigate('/app/exams')
    }
  }, [id, navigate])

  useEffect(() => {
    fetchExam()
  }, [id])

  useEffect(() => {
    if (started && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            autoSubmit('time_up')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, timeLeft, autoSubmit])

  useEffect(() => {
    if (!started) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        autoSubmit('fullscreen_exit')
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        autoSubmit('tab_switch')
      }
    }

    const handleBlur = () => {
      autoSubmit('window_blur')
    }

    const handleContextMenu = (e) => e.preventDefault()

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(e.key))
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [started, autoSubmit])

  const fetchExam = async () => {
    try {
      const response = await api.get(`/exam/${id}`)
      if (!response.data.exam) {
        toast.error('Exam not found')
        navigate('/app/exams')
        return
      }
      setExam(response.data.exam)
      if (response.data.attempt) {
        setAnswers(response.data.attempt.answers || {})
        setTimeLeft(response.data.timeLeft || response.data.exam.duration * 60)
        setStarted(true)
      }
    } catch (error) {
      toast.error('Failed to load exam')
      navigate('/app/exams')
    } finally {
      setLoading(false)
    }
  }

  const startExam = async () => {
    try {
      await document.documentElement.requestFullscreen()
      const response = await api.post(`/exam/${id}/start`)
      setTimeLeft(exam.duration * 60)
      setStarted(true)
      toast.success('Exam started. Do NOT switch tabs or exit fullscreen!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start exam')
    }
  }

  const submitExam = async () => {
    if (!confirm('Are you sure you want to submit?')) return

    try {
      await api.post(`/exam/${id}/submit`, { answers })
      toast.success('Exam submitted successfully')
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      navigate('/app/exams')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit exam')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{exam.subject}</p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">Important Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Exam will open in fullscreen mode</li>
              <li>• Switching tabs will AUTO-SUBMIT immediately</li>
              <li>• Exiting fullscreen will AUTO-SUBMIT immediately</li>
              <li>• Right-click and keyboard shortcuts are disabled</li>
              <li>• Time limit: {exam.duration} minutes</li>
            </ul>
          </div>
          
          <button onClick={startExam} className="btn-primary w-full py-3 text-lg">
            Start Exam
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold">{exam.title}</h1>
          <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {exam.questions.map((question, index) => (
          <div key={question._id || index} className="card">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-4">{question.text}</p>
                
                {question.type === 'mcq' ? (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                          answers[question._id] === optIndex
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question._id}
                          checked={answers[question._id] === optIndex}
                          onChange={() => setAnswers({ ...answers, [question._id]: optIndex })}
                          className="text-primary-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[question._id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [question._id]: e.target.value })}
                    className="input-field min-h-[100px]"
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Object.keys(answers).length} of {exam.questions.length} answered
          </p>
          <button onClick={submitExam} className="btn-primary px-8">
            Submit Exam
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExamPage
