// client/src/components/lab/LabHeader.jsx
import React from 'react'

function LabHeader({ lab, onRun, onSubmit, running, submitting }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{lab.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lab.language} • {lab.points} points</p>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onRun}
                    disabled={running}
                    className="btn-secondary"
                >
                    {running ? 'Running...' : 'Run Tests'}
                </button>
                <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="btn-primary"
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>
        </div>
    )
}

export default LabHeader
