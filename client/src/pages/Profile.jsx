import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { HiOutlineCalculator, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

const GRADE_POINTS = {
  O: 10,
  E: 9,
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  F: 0
}

function Profile() {
  const { user, role, department } = useAuth()

  // GPA Calculator State
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Subject 1', credits: 3, grade: 'A' },
    { id: 2, name: 'Subject 2', credits: 4, grade: 'O' }
  ])

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), name: `Subject ${subjects.length + 1}`, credits: 3, grade: 'A' }])
  }

  const removeSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id))
  }

  const updateSubject = (id, field, value) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  // Calculate SGPA
  const totalCredits = subjects.reduce((sum, s) => sum + Number(s.credits), 0)
  const totalPoints = subjects.reduce((sum, s) => sum + (Number(s.credits) * GRADE_POINTS[s.grade]), 0)
  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card md:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center shadow-inner">
              <span className="text-4xl font-bold text-primary-700">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user?.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Role</p>
              <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{role}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Department</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{department || 'Not assigned'}</p>
            </div>
            {role === 'student' && user?.batch && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Batch</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{user.batch}</p>
              </div>
            )}
          </div>
        </div>

        {/* GPA Calculator Card */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <HiOutlineCalculator className="w-6 h-6 text-primary-600" /> SGPA Calculator
            </h2>
            <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg font-bold text-xl border border-primary-100 shadow-sm">
              SGPA: {sgpa}
            </div>
          </div>

          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-500 dark:text-gray-400 px-2">
              <div className="col-span-5">Subject</div>
              <div className="col-span-3 text-center">Credits</div>
              <div className="col-span-3 text-center">Grade</div>
              <div className="col-span-1 text-center"></div>
            </div>

            {/* Subjects List */}
            {subjects.map((subject, index) => (
              <div key={subject.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={subject.name}
                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                    placeholder="Subject Name"
                  />
                </div>
                <div className="col-span-3">
                  <select
                    value={subject.credits}
                    onChange={(e) => updateSubject(subject.id, 'credits', Number(e.target.value))}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none text-center"
                  >
                    {[1, 2, 3, 4, 5].map(cr => (
                      <option key={cr} value={cr}>{cr}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <select
                    value={subject.grade}
                    onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary-500 outline-none text-center font-medium"
                  >
                    {Object.keys(GRADE_POINTS).map(g => (
                      <option key={g} value={g}>{g} ({GRADE_POINTS[g]} pts)</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => removeSubject(subject.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Subject"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addSubject}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors p-2"
          >
            <HiOutlinePlus className="w-4 h-4" /> Add Subject
          </button>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <span>Total Credits: <strong>{totalCredits}</strong></span>
            <span>Total Points: <strong>{totalPoints}</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
