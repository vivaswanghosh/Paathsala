import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../utils/api.js'
import toast from 'react-hot-toast'
import { HiOutlineChatAlt2, HiOutlineThumbUp, HiThumbUp, HiOutlineSearch, HiOutlineTag, HiCheckCircle } from 'react-icons/hi'

function Forum() {
    const { user } = useAuth()
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)

    // Create state
    const [showCreate, setShowCreate] = useState(false)
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '', tags: '' })

    // View state
    const [selectedQuestion, setSelectedQuestion] = useState(null)
    const [answerContent, setAnswerContent] = useState('')

    // Filter state
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('newest')

    useEffect(() => {
        fetchQuestions()
    }, [sort])

    const fetchQuestions = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/forum?sort=${sort}&search=${search}`)
            setQuestions(response.data.questions)
        } catch (error) {
            toast.error('Failed to load forum')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        fetchQuestions()
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const tagsArray = newQuestion.tags.split(',').map(t => t.trim()).filter(t => t)
            await api.post('/forum', { ...newQuestion, tags: tagsArray })
            toast.success('Question posted!')
            setShowCreate(false)
            setNewQuestion({ title: '', content: '', tags: '' })
            fetchQuestions()
        } catch (error) {
            toast.error('Failed to post question')
        }
    }

    const viewQuestion = async (id) => {
        try {
            const response = await api.get(`/forum/${id}`)
            setSelectedQuestion(response.data.question)
        } catch (error) {
            toast.error('Failed to load question details')
        }
    }

    const handleAnswer = async (e) => {
        e.preventDefault()
        if (!answerContent.trim()) return
        try {
            const response = await api.post(`/forum/${selectedQuestion._id}/answers`, { content: answerContent })
            toast.success('Answer posted! (+5 XP if accepted later)')
            setAnswerContent('')
            viewQuestion(selectedQuestion._id) // Refresh
        } catch (error) {
            toast.error('Failed to post answer')
        }
    }

    const handleUpvote = async (id, isQuestion = true) => {
        try {
            const endpoint = isQuestion ? `/forum/${id}/upvote` : null // Simplify: only question upvotes for now
            if (!endpoint) return

            const response = await api.post(endpoint)

            // Update local state optimizing without full refetch
            if (selectedQuestion && selectedQuestion._id === id) {
                setSelectedQuestion(prev => ({
                    ...prev,
                    upvotes: response.data.hasUpvoted ? [...prev.upvotes, user._id] : prev.upvotes.filter(u => u !== user._id)
                }))
            }

            setQuestions(prev => prev.map(q => {
                if (q._id === id) {
                    const upvotes = response.data.hasUpvoted ? [...q.upvotes, user._id] : q.upvotes.filter(u => u !== user._id)
                    return { ...q, upvotes }
                }
                return q
            }))

        } catch (error) {
            toast.error('Action failed')
        }
    }

    const handleAcceptAnswer = async (answerId) => {
        try {
            await api.post(`/forum/${selectedQuestion._id}/answers/${answerId}/accept`)
            toast.success('Answer accepted! Author rewarded XP.')
            viewQuestion(selectedQuestion._id)
        } catch (error) {
            toast.error('Failed to accept answer')
        }
    }

    const hasUserUpvoted = (upvoteArray) => upvoteArray?.some(v => v === user?._id || v?._id === user?._id)

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-l-4 border-primary-600 pl-3">Campus Discussion</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-4">Ask questions, share knowledge, and earn XP.</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <form onSubmit={handleSearch} className="flex-1 md:w-64 relative">
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <HiOutlineSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <button type="submit" className="hidden"></button>
                    </form>

                    <button
                        onClick={() => { setShowCreate(true); setSelectedQuestion(null); }}
                        className="btn btn-primary whitespace-nowrap"
                    >
                        Ask Question
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Sidebar / List */}
                <div className={`w-full ${selectedQuestion || showCreate ? 'lg:w-1/3 border-r pr-6 border-gray-100 dark:border-gray-700 hidden lg:block' : 'lg:w-full'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-gray-700 dark:text-gray-300">Recent Discussions</h2>
                        <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border-none bg-gray-50 dark:bg-gray-900 rounded-md py-1 px-2 text-gray-600 dark:text-gray-400 font-medium">
                            <option value="newest">Newest</option>
                            <option value="popular">Popular</option>
                            <option value="unanswered">Unanswered</option>
                        </select>
                    </div>

                    {loading && !questions.length ? (
                        <div className="text-center py-10"><div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin mx-auto"></div></div>
                    ) : questions.length === 0 ? (
                        <p className="text-center py-10 text-gray-500 dark:text-gray-400 border border-dashed rounded-xl">No discussions found.</p>
                    ) : (
                        <div className="space-y-3">
                            {questions.map(q => (
                                <div
                                    key={q._id}
                                    onClick={() => { viewQuestion(q._id); setShowCreate(false); }}
                                    className={`card p-4 cursor-pointer hover:shadow-md transition-all ${selectedQuestion?._id === q._id ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/20' : ''}`}
                                >
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{q.title}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2">
                                        <HiOutlineChatAlt2 className="w-4 h-4" /> {q.answers?.length || 0} answers
                                        <span className="mx-1">•</span>
                                        <HiThumbUp className={`w-4 h-4 ${hasUserUpvoted(q.upvotes) ? 'text-primary-600' : 'text-gray-400'}`} /> {q.upvotes?.length || 0}
                                    </p>
                                    <div className="flex gap-2 mt-3 flex-wrap">
                                        {q.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full lowercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Detail Pane */}
                {(selectedQuestion || showCreate) && (
                    <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[500px]">
                        {showCreate ? (
                            // Create Form
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ask a Question</h2>
                                    <button onClick={() => setShowCreate(false)} className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:text-gray-400">Cancel</button>
                                </div>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                        <input autoFocus required type="text" value={newQuestion.title} onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })} className="input font-medium" placeholder="What's your question? Be specific." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details</label>
                                        <textarea required rows={8} value={newQuestion.content} onChange={e => setNewQuestion({ ...newQuestion, content: e.target.value })} className="input resize-none" placeholder="Provide context, code snippets, or what you've tried..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                            <HiOutlineTag className="text-gray-400" /> Tags (comma separated)
                                        </label>
                                        <input type="text" value={newQuestion.tags} onChange={e => setNewQuestion({ ...newQuestion, tags: e.target.value })} className="input text-sm" placeholder="e.g. react, data-structures, syllabus" />
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                        <button type="submit" className="btn btn-primary px-8">Post Question</button>
                                    </div>
                                </form>
                            </div>
                        ) : selectedQuestion ? (
                            // Detail View
                            <div className="animate-in fade-in duration-300">
                                <button onClick={() => setSelectedQuestion(null)} className="lg:hidden mb-4 text-sm font-medium text-primary-600">&larr; Back to list</button>

                                {/* Question Header */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center mt-1">
                                        <button
                                            onClick={() => handleUpvote(selectedQuestion._id)}
                                            className={`p-1.5 rounded-full ${hasUserUpvoted(selectedQuestion.upvotes) ? 'bg-primary-100 text-primary-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:bg-gray-100 dark:bg-gray-800'} transition-colors`}
                                        >
                                            <HiThumbUp className="w-6 h-6" />
                                        </button>
                                        <span className={`font-bold mt-1 ${hasUserUpvoted(selectedQuestion.upvotes) ? 'text-primary-700' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {selectedQuestion.upvotes.length}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">{selectedQuestion.title}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedQuestion.author?.name}</span>
                                            <span>•</span>
                                            <span>{new Date(selectedQuestion.createdAt).toLocaleString()}</span>
                                            <span>•</span>
                                            <span>{selectedQuestion.views} views</span>
                                            <span>•</span>
                                            <span className="uppercase font-bold tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-sm">{selectedQuestion.author?.department}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="prose prose-sm max-w-none text-gray-800 dark:text-gray-200 mb-8 pl-10 whitespace-pre-wrap font-medium">
                                    {selectedQuestion.content}
                                </div>

                                <div className="flex gap-2 mb-8 pl-10">
                                    {selectedQuestion.tags.map(tag => (
                                        <span key={tag} className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-md lowercase">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <hr className="border-gray-100 dark:border-gray-700 mb-8" />

                                {/* Answers Section */}
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 border-l-4 border-green-500 pl-2">
                                    {selectedQuestion.answers.length} Answers
                                </h3>

                                <div className="space-y-6 mb-8">
                                    {selectedQuestion.answers.map(answer => (
                                        <div key={answer._id} className={`flex gap-4 p-4 rounded-xl border ${answer.isAccepted ? 'border-green-300 bg-green-50/30' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                            <div className="flex flex-col items-center mt-1">
                                                {answer.isAccepted ? (
                                                    <div className="text-green-600 bg-green-100 p-1.5 rounded-full" title="Accepted Answer">
                                                        <HiCheckCircle className="w-6 h-6" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-500 dark:text-gray-400">
                                                        {answer.author?.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex justify-between">
                                                    <div><span className="font-semibold text-gray-700 dark:text-gray-300">{answer.author?.name}</span> • {new Date(answer.createdAt).toLocaleString()}</div>

                                                    {/* Accept Button (Only for author) */}
                                                    {user._id === selectedQuestion.author?._id && !answer.isAccepted && (
                                                        <button
                                                            onClick={() => handleAcceptAnswer(answer._id)}
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Accept Answer
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
                                                    {answer.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Your Answer */}
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Answer</h4>
                                    <form onSubmit={handleAnswer}>
                                        <textarea
                                            required rows={4}
                                            value={answerContent}
                                            onChange={e => setAnswerContent(e.target.value)}
                                            className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-3"
                                            placeholder="Know the answer? Help your peer out..."
                                        ></textarea>
                                        <div className="mt-3 flex justify-end">
                                            <button type="submit" className="btn btn-primary px-6">Post Answer</button>
                                        </div>
                                    </form>
                                </div>

                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Forum
