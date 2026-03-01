// client/src/components/lab/TestResults.jsx
import React from 'react'

function TestResults({ results }) {
    return (
        <div className="w-full sm:w-96 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-sm">
                Test Results
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {results ? (
                    results.map((result, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${result.passed ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    Test Case {index + 1}
                                </span>
                                <span className={`text-xs font-medium ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {result.passed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                            {!result.isHidden && (
                                <>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <strong>Input:</strong> {result.input}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        <strong>Expected:</strong> {result.expected}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        <strong>Output:</strong> {result.output}
                                    </p>
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                        Run tests to see results
                    </p>
                )}
            </div>
        </div>
    )
}

export default TestResults
