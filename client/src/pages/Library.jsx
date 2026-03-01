import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineSearch, HiOutlineDownload, HiOutlineUpload, HiOutlineLink, HiOutlineDocument } from 'react-icons/hi'

function Library() {
  const { role } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ subject: '', type: '' })
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    type: 'file',
    subject: '',
    file: null,
    url: ''
  })

  useEffect(() => {
    fetchResources()
  }, [filter])

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filter.subject) params.append('subject', filter.subject)
      if (filter.type) params.append('type', filter.type)
      
      const response = await api.get(`/library?${params.toString()}`)
      setResources(response.data.resources || [])
    } catch (error) {
      toast.error('Failed to load library')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchResources()
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    
    try {
      const formData = new FormData()
      formData.append('title', uploadData.title)
      formData.append('description', uploadData.description)
      formData.append('subject', uploadData.subject)
      
      if (uploadData.type === 'file') {
        formData.append('file', uploadData.file)
      } else {
        formData.append('url', uploadData.url)
      }

      await api.post('/library', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast.success('Resource uploaded successfully')
      setShowUploadModal(false)
      setUploadData({ title: '', description: '', type: 'file', subject: '', file: null, url: '' })
      fetchResources()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload')
    }
  }

  const downloadResource = async (id, filename) => {
    try {
      const response = await api.get(`/library/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      toast.error('Failed to download')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Central Library</h1>
        {(role === 'teacher' || role === 'admin') && (
          <button onClick={() => setShowUploadModal(true)} className="btn-primary">
            <HiOutlineUpload className="w-5 h-5 mr-2 inline" />
            Upload Resource
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={filter.subject}
            onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
            className="input-field w-40"
          >
            <option value="">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Computer Science">Computer Science</option>
          </select>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="input-field w-32"
          >
            <option value="">All Types</option>
            <option value="file">Files</option>
            <option value="link">Links</option>
          </select>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => (
          <div key={resource._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`badge ${resource.type === 'file' ? 'badge-blue' : 'badge-green'}`}>
                {resource.type === 'file' ? 'File' : 'Link'}
              </span>
              <span className="text-xs text-gray-400">{resource.subject}</span>
            </div>
            
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{resource.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{resource.description}</p>
            
            <div className="text-xs text-gray-400 mb-4">
              Added {new Date(resource.uploadedAt).toLocaleDateString()}
            </div>
            
            {resource.type === 'file' ? (
              <button
                onClick={() => downloadResource(resource._id, resource.fileName)}
                className="btn-secondary w-full text-center"
              >
                <HiOutlineDownload className="w-4 h-4 mr-2 inline" />
                Download
              </button>
            ) : (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full text-center block"
              >
                <HiOutlineLink className="w-4 h-4 mr-2 inline" />
                Open Link
              </a>
            )}
          </div>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="text-center py-12">
          <HiOutlineDocument className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No resources found</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Upload Resource</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="input-field"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="label">Subject</label>
                <select
                  value={uploadData.subject}
                  onChange={(e) => setUploadData({ ...uploadData, subject: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>
              
              <div>
                <label className="label">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={uploadData.type === 'file'}
                      onChange={() => setUploadData({ ...uploadData, type: 'file' })}
                    />
                    File
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={uploadData.type === 'link'}
                      onChange={() => setUploadData({ ...uploadData, type: 'link' })}
                    />
                    Link
                  </label>
                </div>
              </div>
              
              {uploadData.type === 'file' ? (
                <div>
                  <label className="label">File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                    className="input-field"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="label">URL</label>
                  <input
                    type="url"
                    value={uploadData.url}
                    onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                    required
                  />
                </div>
              )}
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Library
