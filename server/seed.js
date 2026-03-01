import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-college'

// ── Schemas (matching actual models exactly) ──────────────────────────────────

const userSchema = new mongoose.Schema({
  auth0Id: String, email: String, name: String, role: String,
  department: String, batch: Number, passwordChanged: Boolean,
  createdAt: { type: Date, default: Date.now }
})

const weeklyRoutineSchema = new mongoose.Schema({
  department: String, semester: Number, section: String, day: String,
  timeSlot: { start: String, end: String }, subject: String,
  teacherId: mongoose.Schema.Types.ObjectId, teacherName: String,
  room: String, status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
})

const labAssignmentSchema = new mongoose.Schema({
  title: String, description: String, department: String, semester: Number,
  subject: String, language: String, starterCode: String,
  testCases: [{ input: String, expectedOutput: String, isHidden: Boolean, points: Number }],
  dueDate: Date, maxAttempts: Number, points: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
})

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  questions: [{
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short', 'long'], required: true },
    options: [{ type: String }],
    correctAnswer: { type: String },
    points: { type: Number, default: 10 }
  }],
  duration: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalQuestions: Number,
  totalPoints: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  endDate: Date,
  type: {
    type: String,
    enum: ['holiday', 'special_holiday', 'exam', 'assignment_deadline', 'event'],
    default: 'event'
  },
  department: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdAt: { type: Date, default: Date.now }
})

const libraryResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['file', 'link'], required: true },
  filePath: String, fileName: String, fileSize: Number, fileType: String,
  url: String, department: String, subject: String, semester: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  uploadedAt: { type: Date, default: Date.now },
  downloads: { type: Number, default: 0 }
})

const User = mongoose.model('User', userSchema)
const WeeklyRoutine = mongoose.model('WeeklyRoutine', weeklyRoutineSchema)
const LabAssignment = mongoose.model('LabAssignment', labAssignmentSchema)
const Exam = mongoose.model('Exam', examSchema)
const CalendarEvent = mongoose.model('CalendarEvent', calendarEventSchema)
const LibraryResource = mongoose.model('LibraryResource', libraryResourceSchema)

// ── Department & Subject Configuration ───────────────────────────────────────

const DEPARTMENTS = [
  {
    name: 'Computer Science',
    code: 'CSE',
    rooms: ['CS-101', 'CS-102', 'CS-103', 'CS-104', 'CS-105'],
    teachers: [
      { email: 'teacher.cse1@aot.edu.in', name: 'Dr. Rajesh Kumar' },
      { email: 'teacher.cse2@aot.edu.in', name: 'Prof. Priya Sharma' }
    ],
    semesters: {
      1: ['Mathematics-I', 'Physics', 'Basic Electrical Engineering', 'Engineering Drawing', 'English'],
      2: ['Mathematics-II', 'Chemistry', 'Programming in C', 'Engineering Mechanics', 'Environmental Science'],
      3: ['Data Structures', 'Digital Logic Design', 'Discrete Mathematics', 'Object Oriented Programming', 'Economics for Engineers'],
      4: ['Algorithms', 'Computer Organization', 'Operating Systems', 'Database Management Systems', 'Probability & Statistics'],
      5: ['Computer Networks', 'Software Engineering', 'Theory of Computation', 'Compiler Design', 'Microprocessors'],
      6: ['Artificial Intelligence', 'Machine Learning', 'Cryptography & Network Security', 'Cloud Computing', 'Internet of Things'],
      7: ['Deep Learning', 'Big Data Analytics', 'Natural Language Processing', 'Distributed Systems', 'Elective-I'],
      8: ['Project Work', 'Blockchain Technology', 'Cyber Security', 'Elective-II', 'Seminar']
    }
  },
  {
    name: 'Electronics & Communication',
    code: 'ECE',
    rooms: ['EC-101', 'EC-102', 'EC-103', 'EC-104', 'EC-105'],
    teachers: [
      { email: 'teacher.ece1@aot.edu.in', name: 'Dr. Anirban Bose' },
      { email: 'teacher.ece2@aot.edu.in', name: 'Prof. Suman Dey' }
    ],
    semesters: {
      1: ['Mathematics-I', 'Physics', 'Basic Electrical Engineering', 'Engineering Drawing', 'English'],
      2: ['Mathematics-II', 'Chemistry', 'Programming in C', 'Engineering Mechanics', 'Environmental Science'],
      3: ['Analog Circuits', 'Signals & Systems', 'Network Theory', 'Electronic Devices', 'Digital Electronics'],
      4: ['Communication Systems', 'Control Systems', 'Electromagnetic Theory', 'Linear Integrated Circuits', 'Microprocessors'],
      5: ['Digital Signal Processing', 'VLSI Design', 'Antenna & Wave Propagation', 'Optical Communication', 'Embedded Systems'],
      6: ['Wireless Communication', 'Satellite Communication', 'Biomedical Instrumentation', 'Nanoelectronics', 'Radar Engineering'],
      7: ['Advanced Communication Systems', 'Robotics', 'Internet of Things', 'RF Circuit Design', 'Elective-I'],
      8: ['Project Work', 'Advanced VLSI', '5G Technology', 'Elective-II', 'Seminar']
    }
  },
  {
    name: 'Mechanical Engineering',
    code: 'ME',
    rooms: ['ME-101', 'ME-102', 'ME-103', 'ME-104', 'ME-105'],
    teachers: [
      { email: 'teacher.me1@aot.edu.in', name: 'Dr. Partha Ghosh' },
      { email: 'teacher.me2@aot.edu.in', name: 'Prof. Rina Mukherjee' }
    ],
    semesters: {
      1: ['Mathematics-I', 'Physics', 'Basic Electrical Engineering', 'Engineering Drawing', 'English'],
      2: ['Mathematics-II', 'Chemistry', 'Programming in C', 'Engineering Mechanics', 'Environmental Science'],
      3: ['Thermodynamics', 'Strength of Materials', 'Fluid Mechanics', 'Manufacturing Processes', 'Material Science'],
      4: ['Heat Transfer', 'Machine Design-I', 'Kinematics of Machines', 'Metrology & Quality Control', 'Industrial Engineering'],
      5: ['IC Engines', 'Machine Design-II', 'Dynamics of Machines', 'Turbo Machinery', 'CAD/CAM'],
      6: ['Refrigeration & Air Conditioning', 'Power Plant Engineering', 'Finite Element Analysis', 'Mechatronics', 'Automobile Engineering'],
      7: ['Robotics', 'Advanced Manufacturing', 'Composite Materials', 'Renewable Energy', 'Elective-I'],
      8: ['Project Work', '3D Printing Technology', 'Industrial Automation', 'Elective-II', 'Seminar']
    }
  },
  {
    name: 'Electrical Engineering',
    code: 'EEE',
    rooms: ['EE-101', 'EE-102', 'EE-103', 'EE-104', 'EE-105'],
    teachers: [
      { email: 'teacher.eee1@aot.edu.in', name: 'Dr. Kaustav Sen' },
      { email: 'teacher.eee2@aot.edu.in', name: 'Prof. Dipika Roy' }
    ],
    semesters: {
      1: ['Mathematics-I', 'Physics', 'Basic Electrical Engineering', 'Engineering Drawing', 'English'],
      2: ['Mathematics-II', 'Chemistry', 'Programming in C', 'Engineering Mechanics', 'Environmental Science'],
      3: ['Circuit Theory', 'Electrical Machines-I', 'Analog Electronics', 'Signals & Systems', 'Electrical Measurements'],
      4: ['Electrical Machines-II', 'Power Systems-I', 'Control Systems', 'Digital Electronics', 'Electromagnetic Fields'],
      5: ['Power Systems-II', 'Power Electronics', 'Microprocessors', 'Switchgear & Protection', 'Instrumentation'],
      6: ['Electric Drives', 'High Voltage Engineering', 'Renewable Energy Systems', 'PLC & SCADA', 'Industrial Electronics'],
      7: ['Smart Grid Technology', 'FACTS & HVDC', 'Advanced Control Systems', 'Electrical Vehicle Tech', 'Elective-I'],
      8: ['Project Work', 'Power System Optimization', 'Advanced Power Electronics', 'Elective-II', 'Seminar']
    }
  }
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TIME_SLOTS = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:15', end: '12:15' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' }
]

// ── Helper to create date offsets ────────────────────────────────────────────
const now = new Date()
function futureDate(days) { return new Date(now.getTime() + days * 86400000) }
function pastDate(days) { return new Date(now.getTime() - days * 86400000) }

// ── Exam question banks per department ───────────────────────────────────────

function makeExamQuestions(dept, subject) {
  const banks = {
    'Computer Science': [
      { text: `What is the time complexity of binary search?`, type: 'mcq', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 'O(log n)', points: 10 },
      { text: `Which data structure uses LIFO principle?`, type: 'mcq', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 'Stack', points: 10 },
      { text: `What is the worst case time complexity of QuickSort?`, type: 'mcq', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 'O(n²)', points: 10 },
      { text: `Explain the concept of normalization in databases.`, type: 'short', options: [], correctAnswer: '', points: 10 },
      { text: `Write a detailed comparison of TCP and UDP protocols.`, type: 'long', options: [], correctAnswer: '', points: 10 },
    ],
    'Electronics & Communication': [
      { text: `What is the Nyquist sampling rate?`, type: 'mcq', options: ['f', '2f', 'f/2', '4f'], correctAnswer: '2f', points: 10 },
      { text: `Which modulation technique is used in FM radio?`, type: 'mcq', options: ['AM', 'FM', 'PM', 'QAM'], correctAnswer: 'FM', points: 10 },
      { text: `What is the cutoff frequency of a low-pass filter?`, type: 'mcq', options: ['Where gain is -3dB', 'Where gain is 0dB', 'Where gain is maximum', 'Where phase is 90°'], correctAnswer: 'Where gain is -3dB', points: 10 },
      { text: `Explain the working principle of a BJT transistor.`, type: 'short', options: [], correctAnswer: '', points: 10 },
      { text: `Design a common-emitter amplifier and explain its characteristics.`, type: 'long', options: [], correctAnswer: '', points: 10 },
    ],
    'Mechanical Engineering': [
      { text: `What is the first law of thermodynamics?`, type: 'mcq', options: ['Energy conservation', 'Entropy increase', 'Absolute zero', 'Heat flow'], correctAnswer: 'Energy conservation', points: 10 },
      { text: `Which material property indicates resistance to deformation?`, type: 'mcq', options: ['Ductility', 'Hardness', 'Toughness', 'Elasticity'], correctAnswer: 'Hardness', points: 10 },
      { text: `What is Reynolds number used for?`, type: 'mcq', options: ['Heat transfer', 'Flow regime', 'Pressure drop', 'Vibration'], correctAnswer: 'Flow regime', points: 10 },
      { text: `Explain the Carnot cycle and its efficiency.`, type: 'short', options: [], correctAnswer: '', points: 10 },
      { text: `Derive the expression for bending stress in a simply supported beam.`, type: 'long', options: [], correctAnswer: '', points: 10 },
    ],
    'Electrical Engineering': [
      { text: `What is Kirchhoff's current law?`, type: 'mcq', options: ['Sum of currents at a node is zero', 'Sum of voltages in a loop is zero', 'Power is conserved', 'Current flows from high to low potential'], correctAnswer: 'Sum of currents at a node is zero', points: 10 },
      { text: `Which motor has the highest starting torque?`, type: 'mcq', options: ['Induction motor', 'Synchronous motor', 'DC series motor', 'DC shunt motor'], correctAnswer: 'DC series motor', points: 10 },
      { text: `What is the power factor of a purely resistive circuit?`, type: 'mcq', options: ['0', '0.5', '0.85', '1'], correctAnswer: '1', points: 10 },
      { text: `Explain the construction and working of a transformer.`, type: 'short', options: [], correctAnswer: '', points: 10 },
      { text: `Analyze a three-phase power system and calculate line and phase voltages.`, type: 'long', options: [], correctAnswer: '', points: 10 },
    ]
  }
  return banks[dept] || banks['Computer Science']
}

// ── Lab assignment templates ─────────────────────────────────────────────────

function makeLabAssignments(dept, semester, subjects, adminId) {
  const labs = []
  const langMap = {
    'Computer Science': 'python',
    'Electronics & Communication': 'c',
    'Mechanical Engineering': 'cpp',
    'Electrical Engineering': 'c'
  }
  const lang = langMap[dept] || 'python'

  const cseTemplates = [
    { title: 'Array Sorting Implementation', desc: 'Implement bubble sort and selection sort algorithms.', code: `def bubble_sort(arr):\n    # Write your code here\n    pass\n\ndef selection_sort(arr):\n    # Write your code here\n    pass\n\narr = list(map(int, input().split()))\nprint(bubble_sort(arr[:]))`, tc: [{ i: '5 3 8 1 2', o: '1 2 3 5 8', h: false, p: 50 }, { i: '9 7 4', o: '4 7 9', h: true, p: 50 }] },
    { title: 'Stack Implementation', desc: 'Implement a stack with push, pop, and peek operations.', code: `class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, item):\n        pass\n    def pop(self):\n        pass\n    def peek(self):\n        pass`, tc: [{ i: 'push 5\npush 3\npop\npeek', o: '3\n5', h: false, p: 50 }, { i: 'push 1\npush 2\npush 3\npop\npop', o: '3\n2', h: true, p: 50 }] },
    { title: 'Binary Search Tree', desc: 'Implement BST with insert and inorder traversal.', code: `class Node:\n    def __init__(self, key):\n        self.left = None\n        self.right = None\n        self.val = key\n\ndef insert(root, key):\n    pass\n\ndef inorder(root):\n    pass`, tc: [{ i: '50 30 70 20 40', o: '20 30 40 50 70', h: false, p: 50 }, { i: '10 5 15 3 7', o: '3 5 7 10 15', h: true, p: 50 }] },
    { title: 'Matrix Multiplication', desc: 'Write a program to multiply two matrices.', code: `def multiply_matrices(A, B):\n    # Write your code here\n    pass`, tc: [{ i: '2 2\n1 2\n3 4\n2 2\n5 6\n7 8', o: '19 22\n43 50', h: false, p: 50 }, { i: '1 3\n1 2 3\n3 1\n4\n5\n6', o: '32', h: true, p: 50 }] },
    { title: 'Graph BFS Traversal', desc: 'Implement Breadth-First Search on a graph.', code: `from collections import deque\n\ndef bfs(graph, start):\n    # Write your code here\n    pass`, tc: [{ i: '4\n0 1\n0 2\n1 3\n0', o: '0 1 2 3', h: false, p: 50 }, { i: '3\n0 1\n1 2\n0', o: '0 1 2', h: true, p: 50 }] },
  ]

  const eceTemplates = [
    { title: 'Signal Generation', desc: 'Generate and display a sine wave signal using C.', code: `#include <stdio.h>\n#include <math.h>\n\nint main() {\n    // Generate sine wave samples\n    // Your code here\n    return 0;\n}`, tc: [{ i: '10 1', o: 'Signal generated with 10 samples at 1 Hz', h: false, p: 50 }, { i: '20 2', o: 'Signal generated with 20 samples at 2 Hz', h: true, p: 50 }] },
    { title: 'Resistor Color Code Calculator', desc: 'Calculate resistance from color band inputs.', code: `#include <stdio.h>\n\nint main() {\n    // Read color bands and calculate resistance\n    return 0;\n}`, tc: [{ i: 'brown black red', o: '1000', h: false, p: 50 }, { i: 'red red orange', o: '22000', h: true, p: 50 }] },
    { title: 'Digital Logic Gate Simulator', desc: 'Simulate AND, OR, NOT, XOR gates.', code: `#include <stdio.h>\n\nint main() {\n    // Simulate logic gates\n    return 0;\n}`, tc: [{ i: 'AND 1 0', o: '0', h: false, p: 50 }, { i: 'XOR 1 1', o: '0', h: true, p: 50 }] },
    { title: 'ADC Converter Simulation', desc: 'Simulate analog-to-digital conversion with quantization.', code: `#include <stdio.h>\n\nint main() {\n    // Simulate ADC\n    return 0;\n}`, tc: [{ i: '3.7 8', o: 'Level: 189', h: false, p: 50 }, { i: '2.5 4', o: 'Level: 10', h: true, p: 50 }] },
    { title: 'Frequency Counter', desc: 'Count frequency of a periodic signal from sample data.', code: `#include <stdio.h>\n\nint main() {\n    // Count zero crossings\n    return 0;\n}`, tc: [{ i: '1 -1 1 -1 1 -1', o: 'Frequency: 2.5 Hz', h: false, p: 50 }, { i: '1 1 -1 -1 1 1', o: 'Frequency: 1.0 Hz', h: true, p: 50 }] },
  ]

  const meTemplates = [
    { title: 'Stress-Strain Calculator', desc: 'Calculate stress and strain for given load and dimensions.', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Calculate stress = F/A, strain = dL/L\n    return 0;\n}`, tc: [{ i: '1000 0.01 0.001 1.0', o: 'Stress: 100000.00 Pa\nStrain: 0.001000', h: false, p: 50 }, { i: '5000 0.05 0.002 2.0', o: 'Stress: 100000.00 Pa\nStrain: 0.001000', h: true, p: 50 }] },
    { title: 'Beam Deflection Calculator', desc: 'Calculate deflection for simply supported beam with point load.', code: `#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    // Calculate beam deflection\n    return 0;\n}`, tc: [{ i: '10 5000 2e11 8.33e-6', o: 'Max deflection: 0.0150 m', h: false, p: 50 }, { i: '5 3000 2e11 4.16e-6', o: 'Max deflection: 0.0045 m', h: true, p: 50 }] },
    { title: 'Heat Exchanger Efficiency', desc: 'Calculate effectiveness of a parallel flow heat exchanger.', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // NTU method for heat exchanger\n    return 0;\n}`, tc: [{ i: '100 30 80 50', o: 'Effectiveness: 71.43%', h: false, p: 50 }, { i: '150 25 120 60', o: 'Effectiveness: 76.00%', h: true, p: 50 }] },
    { title: 'Gear Train Ratio Calculator', desc: 'Calculate overall gear ratio for a compound gear train.', code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Gear ratio = product of driven/driver\n    return 0;\n}`, tc: [{ i: '20 40 15 45', o: 'Gear Ratio: 6.00', h: false, p: 50 }, { i: '10 30 20 60', o: 'Gear Ratio: 9.00', h: true, p: 50 }] },
    { title: 'Cam Profile Generator', desc: 'Generate displacement diagram for a simple harmonic motion cam.', code: `#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    // Simple harmonic cam profile\n    return 0;\n}`, tc: [{ i: '50 180 10', o: 'Cam profile generated: 10 points', h: false, p: 50 }, { i: '30 120 5', o: 'Cam profile generated: 5 points', h: true, p: 50 }] },
  ]

  const eeeTemplates = [
    { title: 'Ohms Law Calculator', desc: 'Calculate voltage, current, or resistance using Ohms law.', code: `#include <stdio.h>\n\nint main() {\n    // V = IR calculator\n    return 0;\n}`, tc: [{ i: 'V 5 10', o: 'Voltage: 50.00 V', h: false, p: 50 }, { i: 'I 100 20', o: 'Current: 5.00 A', h: true, p: 50 }] },
    { title: 'Power Factor Correction', desc: 'Calculate required capacitance for power factor correction.', code: `#include <stdio.h>\n#include <math.h>\n\nint main() {\n    // Calculate capacitor for PF correction\n    return 0;\n}`, tc: [{ i: '1000 0.7 0.95 50', o: 'Capacitance: 29.84 uF', h: false, p: 50 }, { i: '5000 0.8 0.98 60', o: 'Capacitance: 44.21 uF', h: true, p: 50 }] },
    { title: 'Transformer Efficiency Calculator', desc: 'Calculate efficiency of a transformer at various loads.', code: `#include <stdio.h>\n\nint main() {\n    // Transformer efficiency\n    return 0;\n}`, tc: [{ i: '10000 200 300 1.0', o: 'Efficiency: 95.24%', h: false, p: 50 }, { i: '5000 100 150 0.75', o: 'Efficiency: 93.75%', h: true, p: 50 }] },
    { title: 'Three-Phase Power Calculator', desc: 'Calculate active, reactive, and apparent power in a 3-phase system.', code: `#include <stdio.h>\n#include <math.h>\n\nint main() {\n    // Three-phase power calculations\n    return 0;\n}`, tc: [{ i: '400 10 0.8', o: 'Active: 5542.56 W\nReactive: 4156.92 VAR', h: false, p: 50 }, { i: '230 5 0.9', o: 'Active: 1793.84 W\nReactive: 868.45 VAR', h: true, p: 50 }] },
    { title: 'Motor Speed Control Simulation', desc: 'Simulate DC motor speed for varying armature voltage.', code: `#include <stdio.h>\n\nint main() {\n    // DC motor speed calculation\n    return 0;\n}`, tc: [{ i: '220 2 0.05 0.01', o: 'Speed: 1080.00 RPM', h: false, p: 50 }, { i: '110 1 0.05 0.01', o: 'Speed: 540.00 RPM', h: true, p: 50 }] },
  ]

  const templateMap = {
    'Computer Science': cseTemplates,
    'Electronics & Communication': eceTemplates,
    'Mechanical Engineering': meTemplates,
    'Electrical Engineering': eeeTemplates
  }
  const templates = templateMap[dept] || cseTemplates

  for (let i = 0; i < 5; i++) {
    const t = templates[i]
    const subject = subjects[i % subjects.length]
    labs.push({
      title: `${t.title}`,
      description: t.desc,
      department: dept,
      semester,
      subject,
      language: lang,
      starterCode: t.code,
      testCases: t.tc.map(c => ({ input: c.i, expectedOutput: c.o, isHidden: c.h, points: c.p })),
      dueDate: futureDate(7 + i * 3),
      maxAttempts: 5,
      points: 100,
      createdBy: adminId
    })
  }
  return labs
}

// ── Library resource templates ───────────────────────────────────────────────

function makeLibraryResources(dept, year, subjects, adminId) {
  const resources = []
  const urlBases = {
    'Computer Science': [
      { title: 'GeeksforGeeks - {subject}', url: 'https://www.geeksforgeeks.org/', desc: 'Comprehensive tutorials and practice problems' },
      { title: '{subject} - MIT OpenCourseWare', url: 'https://ocw.mit.edu/', desc: 'Free MIT course lectures and materials' },
      { title: '{subject} Notes PDF', url: 'https://nptel.ac.in/', desc: 'NPTEL lecture notes and video lectures' },
      { title: '{subject} - W3Schools', url: 'https://www.w3schools.com/', desc: 'Interactive tutorials and references' },
      { title: '{subject} - Tutorialspoint', url: 'https://www.tutorialspoint.com/', desc: 'Step-by-step learning guides' },
      { title: 'Previous Year Papers - {subject}', url: 'https://www.aot.edu.in/papers', desc: 'Last 5 years question papers' },
      { title: '{subject} Video Lectures', url: 'https://www.youtube.com/results?search_query={subject}', desc: 'Curated YouTube video lecture playlist' },
      { title: '{subject} - Programiz', url: 'https://www.programiz.com/', desc: 'Beginner-friendly programming tutorials' },
      { title: '{subject} Lab Manual', url: 'https://www.aot.edu.in/lab-manual', desc: 'Official lab manual with experiment procedures' },
      { title: '{subject} Reference Textbook', url: 'https://www.amazon.in/', desc: 'Recommended textbook reference' },
    ],
    'Electronics & Communication': [
      { title: 'Electronics Tutorials - {subject}', url: 'https://www.electronics-tutorials.ws/', desc: 'Comprehensive electronics tutorials' },
      { title: '{subject} - All About Circuits', url: 'https://www.allaboutcircuits.com/', desc: 'Free electrical engineering textbook and resources' },
      { title: '{subject} NPTEL Lectures', url: 'https://nptel.ac.in/', desc: 'NPTEL video lectures by IIT professors' },
      { title: '{subject} - CircuitDigest', url: 'https://circuitdigest.com/', desc: 'Circuit design tutorials and projects' },
      { title: '{subject} Lab Manual', url: 'https://www.aot.edu.in/ece-lab', desc: 'Official lab manual for ECE department' },
      { title: 'Previous Year Papers - {subject}', url: 'https://www.aot.edu.in/papers', desc: 'Last 5 years question papers' },
      { title: '{subject} - Neso Academy', url: 'https://www.youtube.com/@nesoacademy', desc: 'Video lectures on electronics fundamentals' },
      { title: '{subject} Simulation Tools', url: 'https://www.tinkercad.com/', desc: 'Online circuit simulation platform' },
      { title: '{subject} Reference Textbook', url: 'https://www.amazon.in/', desc: 'Recommended textbook for the subject' },
      { title: '{subject} Quick Revision Notes', url: 'https://www.gradeup.co/electronics', desc: 'Concise revision notes for competitive exams' },
    ],
    'Mechanical Engineering': [
      { title: '{subject} - NPTEL Lectures', url: 'https://nptel.ac.in/', desc: 'IIT professor video lectures on mechanical topics' },
      { title: '{subject} - MechanicalBooster', url: 'https://www.mechanicalbooster.com/', desc: 'Mechanical engineering concepts explained' },
      { title: '{subject} - LearnMech', url: 'https://learnmech.com/', desc: 'Detailed articles on mechanical subjects' },
      { title: '{subject} Formulas Handbook', url: 'https://www.aot.edu.in/me-handbook', desc: 'Essential formulas and reference tables' },
      { title: '{subject} Lab Manual', url: 'https://www.aot.edu.in/me-lab', desc: 'Official lab manual for ME department' },
      { title: 'Previous Year Papers - {subject}', url: 'https://www.aot.edu.in/papers', desc: 'Last 5 years question papers' },
      { title: '{subject} - Engineers Edge', url: 'https://www.engineersedge.com/', desc: 'Engineering reference and calculators' },
      { title: '{subject} Design Data Book', url: 'https://www.amazon.in/', desc: 'PSG Design Data Book reference' },
      { title: '{subject} Animation Videos', url: 'https://www.youtube.com/', desc: 'Animated explanations of mechanisms' },
      { title: '{subject} Reference Textbook', url: 'https://www.amazon.in/', desc: 'Recommended textbook for the subject' },
    ],
    'Electrical Engineering': [
      { title: '{subject} - NPTEL Lectures', url: 'https://nptel.ac.in/', desc: 'IIT professor video lectures on EE topics' },
      { title: '{subject} - Electrical4U', url: 'https://www.electrical4u.com/', desc: 'Comprehensive electrical engineering articles' },
      { title: '{subject} - EEPower', url: 'https://eepower.com/', desc: 'Power engineering resources and tutorials' },
      { title: '{subject} Lab Manual', url: 'https://www.aot.edu.in/eee-lab', desc: 'Official lab manual for EEE department' },
      { title: '{subject} Formulas Sheet', url: 'https://www.aot.edu.in/eee-formulas', desc: 'Quick reference formula sheet' },
      { title: 'Previous Year Papers - {subject}', url: 'https://www.aot.edu.in/papers', desc: 'Last 5 years question papers' },
      { title: '{subject} - CircuitGlobe', url: 'https://circuitglobe.com/', desc: 'Electrical engineering concepts with diagrams' },
      { title: '{subject} Simulation Lab', url: 'https://www.multisim.com/', desc: 'Circuit simulation and virtual lab' },
      { title: '{subject} Video Tutorials', url: 'https://www.youtube.com/', desc: 'Curated video tutorials playlist' },
      { title: '{subject} Reference Textbook', url: 'https://www.amazon.in/', desc: 'Recommended textbook reference' },
    ]
  }

  const templates = urlBases[dept] || urlBases['Computer Science']
  // sem1 = year1, sem2 = year1, sem3 = year2, ...
  const sem1 = (year - 1) * 2 + 1
  const sem2 = sem1 + 1

  for (let i = 0; i < 10; i++) {
    const t = templates[i]
    const subj = subjects[i % subjects.length]
    const sem = i < 5 ? sem1 : sem2
    resources.push({
      title: t.title.replace('{subject}', subj),
      description: t.desc,
      type: 'link',
      url: t.url,
      department: dept,
      subject: subj,
      semester: sem,
      uploadedBy: adminId,
      downloads: Math.floor(Math.random() * 150) + 10
    })
  }
  return resources
}

// ── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const admin = await User.findOne({ role: 'admin' })
  if (!admin) { console.error('No admin user found! Login first then run this script.'); process.exit(1) }
  console.log('Using admin:', admin.email)
  const adminId = admin._id

  // ── Create teachers for each department ──
  const teacherMap = {}
  for (const dept of DEPARTMENTS) {
    teacherMap[dept.name] = []
    for (const t of dept.teachers) {
      let teacher = await User.findOne({ email: t.email })
      if (!teacher) {
        teacher = await User.create({
          auth0Id: `${t.email}-mock`,
          email: t.email,
          name: t.name,
          role: 'teacher',
          department: dept.name,
          passwordChanged: true
        })
      }
      teacherMap[dept.name].push(teacher)
    }
  }
  console.log('✅ Teachers created/found (8 total)')

  // ── Clear old seeded data ──
  await WeeklyRoutine.deleteMany({})
  await LabAssignment.deleteMany({})
  await Exam.deleteMany({})
  await CalendarEvent.deleteMany({})
  await LibraryResource.deleteMany({})
  console.log('🗑  Cleared old data')

  // ── Weekly Routines ──
  const routines = []
  for (const dept of DEPARTMENTS) {
    for (let sem = 1; sem <= 8; sem++) {
      const subjects = dept.semesters[sem]
      const teachers = teacherMap[dept.name]
      for (let d = 0; d < DAYS.length; d++) {
        for (let s = 0; s < TIME_SLOTS.length; s++) {
          const subjIdx = (d * TIME_SLOTS.length + s) % subjects.length
          const tIdx = (d + s) % teachers.length
          routines.push({
            department: dept.name,
            semester: sem,
            section: 'A',
            day: DAYS[d],
            timeSlot: TIME_SLOTS[s],
            subject: subjects[subjIdx],
            teacherId: teachers[tIdx]._id,
            teacherName: teachers[tIdx].name,
            room: dept.rooms[s % dept.rooms.length]
          })
        }
      }
    }
  }
  await WeeklyRoutine.insertMany(routines)
  console.log(`✅ Weekly Routines seeded (${routines.length} slots)`)

  // ── Lab Assignments: 5 per department per semester = 160 total ──
  const allLabs = []
  for (const dept of DEPARTMENTS) {
    for (let sem = 1; sem <= 8; sem++) {
      const subjects = dept.semesters[sem]
      allLabs.push(...makeLabAssignments(dept.name, sem, subjects, adminId))
    }
  }
  await LabAssignment.insertMany(allLabs)
  console.log(`✅ Lab Assignments seeded (${allLabs.length} total)`)

  // ── Exams: 5 per department per year = 80 total ──
  const allExams = []
  for (const dept of DEPARTMENTS) {
    for (let year = 1; year <= 4; year++) {
      const sem1 = (year - 1) * 2 + 1
      const sem2 = sem1 + 1
      const subjects1 = dept.semesters[sem1]
      const subjects2 = dept.semesters[sem2]
      const questions = makeExamQuestions(dept.name)

      for (let i = 0; i < 5; i++) {
        const isOddSem = i < 3
        const sem = isOddSem ? sem1 : sem2
        const subjects = isOddSem ? subjects1 : subjects2
        const subj = subjects[i % subjects.length]
        const dayOffset = year * 7 + i * 3
        const duration = [30, 45, 60, 90, 120][i % 5]
        const examTypes = ['Mid-Semester Exam', 'Quiz', 'End-Semester Exam', 'Class Test', 'Practical Exam']

        allExams.push({
          title: `${subj} - ${examTypes[i]}`,
          subject: subj,
          department: dept.name,
          semester: sem,
          duration,
          startTime: futureDate(dayOffset),
          endTime: new Date(futureDate(dayOffset).getTime() + duration * 60000),
          isPublished: true,
          totalQuestions: questions.length,
          totalPoints: questions.reduce((s, q) => s + q.points, 0),
          createdBy: adminId,
          questions
        })
      }
    }
  }
  await Exam.insertMany(allExams)
  console.log(`✅ Exams seeded (${allExams.length} total)`)

  // ── Calendar Events: 20 ──
  const calendarEvents = [
    // Holidays
    { title: 'Republic Day', description: 'National Holiday', date: new Date('2026-01-26'), type: 'holiday', createdBy: adminId },
    { title: 'Holi', description: 'Festival of Colors', date: new Date('2026-03-14'), type: 'holiday', createdBy: adminId },
    { title: 'Good Friday', description: 'National Holiday', date: new Date('2026-04-03'), type: 'holiday', createdBy: adminId },
    { title: 'May Day', description: 'International Workers Day', date: new Date('2026-05-01'), type: 'holiday', createdBy: adminId },
    { title: 'Independence Day', description: 'National Holiday', date: new Date('2026-08-15'), type: 'holiday', createdBy: adminId },

    // College special events
    { title: 'AOT Foundation Day', description: 'Annual celebration of Paathsala founding', date: futureDate(10), type: 'special_holiday', createdBy: adminId },
    { title: 'Annual Sports Day', description: 'Inter-department sports competition', date: futureDate(20), endDate: futureDate(21), type: 'special_holiday', createdBy: adminId },
    { title: 'Saraswati Puja', description: 'Cultural celebration at campus', date: new Date('2026-02-12'), type: 'special_holiday', createdBy: adminId },

    // Events
    { title: 'Tech Fest 2026 - GENESIS', description: 'Annual technical festival with competitions, workshops, and guest lectures', date: futureDate(30), endDate: futureDate(32), type: 'event', createdBy: adminId },
    { title: 'Campus Recruitment Drive - TCS', description: 'TCS on-campus placement for final year students', date: futureDate(15), type: 'event', department: 'Computer Science', createdBy: adminId },
    { title: 'Workshop on IoT & Embedded Systems', description: 'Two-day hands-on workshop by industry experts', date: futureDate(12), endDate: futureDate(13), type: 'event', department: 'Electronics & Communication', createdBy: adminId },
    { title: 'Guest Lecture - AI in Healthcare', description: 'Talk by Dr. Arun Mehta, Google Research India', date: futureDate(8), type: 'event', department: 'Computer Science', createdBy: adminId },
    { title: 'Industrial Visit - Tata Steel Plant', description: 'Educational visit for 3rd year ME students', date: futureDate(18), type: 'event', department: 'Mechanical Engineering', createdBy: adminId },
    { title: 'National Science Day Seminar', description: 'Special seminar on emerging technologies', date: new Date('2026-02-28'), type: 'event', createdBy: adminId },
    { title: 'Alumni Meet 2026', description: 'Annual alumni reunion and mentoring session', date: futureDate(45), type: 'event', createdBy: adminId },

    // Exam deadlines
    { title: 'Mid-Semester Exams Begin', description: 'Mid-semester examinations for all departments', date: futureDate(7), type: 'exam', createdBy: adminId },
    { title: 'End-Semester Exams Begin', description: 'Final examinations for all departments', date: futureDate(50), type: 'exam', createdBy: adminId },

    // Assignment deadlines
    { title: 'Lab Assignment Submission Deadline - CSE', description: 'All pending lab assignments must be submitted', date: futureDate(14), type: 'assignment_deadline', department: 'Computer Science', createdBy: adminId },
    { title: 'Lab Assignment Submission Deadline - ECE', description: 'All pending lab assignments must be submitted', date: futureDate(14), type: 'assignment_deadline', department: 'Electronics & Communication', createdBy: adminId },
    { title: 'Project Proposal Deadline', description: 'Final year project proposals due for all departments', date: futureDate(25), type: 'assignment_deadline', createdBy: adminId },
  ]
  await CalendarEvent.insertMany(calendarEvents)
  console.log(`✅ Calendar Events seeded (${calendarEvents.length} total)`)

  // ── Library Resources: 10 per department per year = 160 total ──
  const allResources = []
  for (const dept of DEPARTMENTS) {
    for (let year = 1; year <= 4; year++) {
      const sem1 = (year - 1) * 2 + 1
      const subjects = dept.semesters[sem1]
      allResources.push(...makeLibraryResources(dept.name, year, subjects, adminId))
    }
  }
  await LibraryResource.insertMany(allResources)
  console.log(`✅ Library Resources seeded (${allResources.length} total)`)

  console.log('\n🎉 Paathsala — All seed data inserted successfully!')
  console.log('   📊 Summary:')
  console.log(`      Teachers:           ${Object.values(teacherMap).flat().length}`)
  console.log(`      Weekly Routines:     ${routines.length}`)
  console.log(`      Lab Assignments:     ${allLabs.length}`)
  console.log(`      Exams:               ${allExams.length}`)
  console.log(`      Calendar Events:     ${calendarEvents.length}`)
  console.log(`      Library Resources:   ${allResources.length}`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
