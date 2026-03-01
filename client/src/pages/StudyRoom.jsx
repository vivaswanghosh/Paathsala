import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { io } from 'socket.io-client'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import toast from 'react-hot-toast'
import { HiOutlineChatAlt, HiOutlinePaperAirplane, HiOutlineLink, HiOutlineHashtag } from 'react-icons/hi'

function StudyRoom() {
    const { roomId } = useParams()
    const { user } = useAuth()

    const [socket, setSocket] = useState(null)
    const [activeUsers, setActiveUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [showChat, setShowChat] = useState(false)

    const quillRef = useRef(null)
    const chatEndRef = useRef(null)

    useEffect(() => {
        if (!user) return

        // Connect to Socket.IO server (Fixed port to 5001)
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
            withCredentials: true,
        })

        setSocket(newSocket)

        newSocket.on('connect', () => {
            newSocket.emit('join_room', { roomId, user: { id: user._id, name: user.name } })
            setActiveUsers(prev => [...prev.filter(u => u.id !== user._id), { id: user._id, name: user.name + ' (You)', isMe: true }])
            toast.success(`Joined room: ${roomId}`)
        })

        newSocket.on('user_joined', ({ user: newUser }) => {
            setActiveUsers(prev => {
                if (!prev.find(u => u.id === newUser.id)) {
                    toast.success(`${newUser.name} joined the room`)
                    return [...prev, newUser]
                }
                return prev
            })
        })

        newSocket.on('user_left', ({ user: leftUser }) => {
            setActiveUsers(prev => prev.filter(u => u.id !== leftUser.id))
            toast(`${leftUser.name} left the room`, { icon: '👋' })
        })

        // LISTEN FOR DELTAS (Changes only)
        newSocket.on('document_delta', (delta) => {
            if (quillRef.current) {
                const editor = quillRef.current.getEditor()
                // 'api' source prevents infinite loop (won't re-emit this change)
                editor.updateContents(delta, 'api')
            }
        })

        newSocket.on('new_message', (message) => {
            setMessages(prev => [...prev, message])
        })

        return () => {
            newSocket.emit('leave_room', { roomId, user: { id: user._id, name: user.name } })
            newSocket.disconnect()
        }
    }, [roomId, user])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, showChat])

    // EMIT DELTAS (Changes only)
    const handleEditorChange = (content, delta, source, editor) => {
        // Only emit if the change came from the user (not from 'api' update)
        if (source === 'user' && socket) {
            socket.emit('document_delta', { roomId, delta })
        }
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !socket) return

        const msgData = {
            id: Date.now().toString(),
            text: newMessage.trim(),
            user: { id: user._id, name: user.name },
            timestamp: new Date()
        }

        socket.emit('send_message', { roomId, message: msgData })
        setMessages(prev => [...prev, msgData])
        setNewMessage('')
    }

    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Room link copied to clipboard!')
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col pt-2">
            {/* Room Header */}
            <div className="bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <HiOutlineHashtag className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Study Room</h1>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">{roomId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-row-reverse justify-end -space-x-2 space-x-reverse mr-4">
                        {activeUsers.slice(0, 5).map((u, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                                title={u.name}
                            >
                                {u.name.charAt(0)}
                            </div>
                        ))}
                        {activeUsers.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-bold shadow-sm">
                                +{activeUsers.length - 5}
                            </div>
                        )}
                    </div>

                    <button onClick={copyRoomLink} className="btn bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 hidden sm:flex items-center gap-2">
                        <HiOutlineLink className="w-4 h-4" /> Share Link
                    </button>

                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`btn ${showChat ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50' : 'btn-primary'} flex items-center gap-2`}
                    >
                        <HiOutlineChatAlt className="w-5 h-5" />
                        <span className="hidden sm:inline">{showChat ? 'Hide Chat' : 'Show Chat'}</span>
                    </button>
                </div>
            </div>

            {/* Main Workspace Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden border-x border-b border-gray-200 dark:border-gray-700 rounded-b-xl bg-white dark:bg-gray-800 relative">
                {/* Document Editor */}
                <div className={`flex-1 flex flex-col transition-all duration-300 ${showChat ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 relative editor-container">
                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            onChange={handleEditorChange}
                            className="h-full absolute inset-0 pb-10"
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                    ['link', 'code-block'],
                                    ['clean']
                                ]
                            }}
                            placeholder="Start typing... Everything here is synced with peers in real-time."
                        />
                    </div>
                </div>

                {/* Live Chat Sidebar */}
                {showChat && (
                    <div className="w-full lg:w-80 flex flex-col bg-gray-50 dark:bg-gray-900 shrink-0 lg:border-l border-gray-200 dark:border-gray-700 absolute inset-0 lg:relative z-20">
                        <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <HiOutlineChatAlt className="text-indigo-600" /> Live Chat
                            </h3>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                {activeUsers.length} Online
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                                    <HiOutlineChatAlt className="w-12 h-12" opacity={0.2} />
                                    <p className="text-sm">No messages yet.<br />Say hello!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.user.id === user._id
                                    return (
                                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium">{msg.user.name}</span>
                                            <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-200' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm'}`}>
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    className="w-full pl-3 pr-10 py-2 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-full text-sm transition-all shadow-inner"
                                    placeholder="Type a message..."
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-1 top-1 bottom-1 p-1.5 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                                >
                                    <HiOutlinePaperAirplane className="w-4 h-4 ml-0.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudyRoom
