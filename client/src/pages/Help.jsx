import { useState } from 'react'
import { HiOutlineQuestionMarkCircle, HiOutlineSparkles, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineBriefcase, HiOutlineChat, HiOutlineCloud, HiOutlineNewspaper, HiOutlineCollection, HiOutlineCog } from 'react-icons/hi'

function Help() {
    const [openSection, setOpenSection] = useState('xp')

    const sections = {
        xp: {
            title: 'Gamification & XP System',
            icon: HiOutlineSparkles,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        The Smart College Platform uses a <strong>Experience Points (XP)</strong> system to track your progress and reward active participation.
                    </p>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-bold text-indigo-800 mb-2">🧮 How is XP Calculated?</h4>
                        <p className="text-indigo-700 font-mono text-lg mb-2">
                            XP Gained = (Your Exam Score) × 2
                        </p>
                        <p className="text-sm text-indigo-600">
                            <strong>Example:</strong> If you score <strong>85</strong> marks in an exam, you will receive <strong>170 XP</strong>.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🏆 Where can I see my XP?</h4>
                        <p className="text-gray-600 dark:text-gray-400">Your total XP is displayed on your <strong>Profile</strong> page and the <strong>Dashboard</strong> leaderboard (if enabled by admin).</p>
                    </div>
                </div>
            )
        },
        tabs: {
            title: 'Navigation & Tabs Guide',
            icon: HiOutlineCollection,
            content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineAcademicCap className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Dashboard</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your home screen. Shows upcoming deadlines, recent announcements, and your progress stats at a glance.</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineBookOpen className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Routine</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">View your weekly class schedule. You can see which classes are scheduled for today or later in the week.</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineCloud className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Labs</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Complete coding assignments. Submit your code to pass test cases. Graded automatically based on correctness.</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineNewspaper className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Exams</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Take timed MCQ and subjective tests. <strong>Important:</strong> Submit before the timer runs out to avoid auto-submission.</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineChat className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">AI Mentor</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">A 24/7 AI assistant to help you study, explain concepts, and clear doubts. Ask anything related to your subjects!</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineBriefcase className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Jobs</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Placement portal. Apply for internships and jobs. Track your application status (Applied, Shortlisted, Rejected).</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineQuestionMarkCircle className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Study Room</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Collaborate with peers in real-time. Share a document, chat, and code together live.</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <HiOutlineCog className="w-6 h-6 text-primary-600" />
                            <h4 className="font-bold">Feedback</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Report issues or suggest improvements to the college administration.</p>
                    </div>
                </div>
            )
        },
        operations: {
            title: 'How to Operate',
            icon: HiOutlineCog,
            content: (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🎓 Taking an Exam</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>Navigate to the <strong>Exams</strong> tab.</li>
                            <li>Find an exam with status "Available" or "Live Now".</li>
                            <li>Click "Start Exam". The timer starts immediately.</li>
                            <li>Answer questions and click "Submit" before time runs out.</li>
                            <li>Your score and XP are calculated instantly.</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">📝 Submitting a Lab</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>Go to <strong>Labs</strong> and select an assignment.</li>
                            <li>Write your code in the built-in editor (Monaco Editor).</li>
                            <li>Click <strong>Run Tests</strong> to check your code against test cases.</li>
                            <li>Once all tests pass, click <strong>Submit</strong>.</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">🤖 Using AI Mentor</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>Click <strong>AI Mentor</strong> in the sidebar.</li>
                            <li>Type your question (e.g., "Explain Binary Search").</li>
                            <li>The AI uses context from the web to answer.</li>
                            <li>You can ask follow-up questions in the same chat.</li>
                        </ol>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Support & Help Center</h1>
                <p className="text-gray-500 dark:text-gray-400">Find guides, learn about our XP system, and get help.</p>
            </div>

            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {Object.entries(sections).map(([key, section]) => (
                    <button
                        key={key}
                        onClick={() => setOpenSection(key)}
                        className={`flex items-center gap-2 px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${openSection === key
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <section.icon className="w-5 h-5" />
                        {section.title}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
                {sections[openSection].content}
            </div>
        </div>
    )
}

export default Help
