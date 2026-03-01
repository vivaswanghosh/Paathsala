// client/src/pages/LabDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api.js'
import toast from 'react-hot-toast'

// Import the new components
import LabHeader from '../components/lab/LabHeader.jsx'
import CodeEditor from '../components/lab/CodeEditor.jsx'
import TestResults from '../components/lab/TestResults.jsx'

function LabDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lab, setLab] = useState(null)
  const [code, setCode] = useState('')
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLab()
  }, [id])

  const fetchLab = async () => {
    try {
      const response = await api.get(`/lab/${id}`)
      setLab(response.data.lab)
      setCode(response.data.lab.starterCode || '')
      if (response.data.submission) {
        setCode(response.data.submission.code)
        setResults(response.data.submission.testResults)
      }
    } catch (error) {
      toast.error('Failed to load lab')
      navigate('/app/labs')
    } finally {
      setLoading(false)
    }
  }

  const runTests = async () => {
    setRunning(true)
    setResults(null)
    try {
      const response = await api.post(`/lab/${id}/run`, { code })
      setResults(response.data.results)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to run tests')
    } finally {
      setRunning(false)
    }
  }

  const submitLab = async () => {
    setSubmitting(true)
    try {
      const response = await api.post(`/lab/${id}/submit`, { code })
      setResults(response.data.results)
      toast.success(`Lab submitted! Score: ${response.data.score}/${response.data.totalPoints}`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit lab')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!lab) {
    return <div>Lab not found</div>
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header Component */}
      <LabHeader
        lab={lab}
        onRun={runTests}
        onSubmit={submitLab}
        running={running}
        submitting={submitting}
      />

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Editor Component */}
        <CodeEditor
          language={lab.language}
          code={code}
          onChange={setCode}
        />

        {/* Results Component */}
        <TestResults results={results} />
      </div>
    </div>
  )
}

export default LabDetail
