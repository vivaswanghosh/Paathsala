// client/src/components/lab/CodeEditor.jsx
import React from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGE_MAP = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'cpp',
    sql: 'sql'
}

function CodeEditor({ language, code, onChange }) {
    const mappedLanguage = LANGUAGE_MAP[language] || 'plaintext'

    return (
        <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm">
                {language}
            </div>
            <Editor
                language={mappedLanguage}
                value={code}
                onChange={(value) => onChange(value || '')}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    scrollBeyondLastLine: false
                }}
            />
        </div>
    )
}

export default CodeEditor
