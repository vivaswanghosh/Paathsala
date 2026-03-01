import express from 'express'
import { Question } from '../models/Forum.js'
import User from '../models/User.js'
import { checkJwt, getAuth0Id } from '../middleware/auth.js'

const router = express.Router()

// Get paginated questions
router.get('/', checkJwt, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20
        const search = req.query.search
        const tag = req.query.tag
        const sort = req.query.sort || 'newest' // newest, popular, unanswered

        let query = {}
        if (search) {
            query.$text = { $search: search }
        }
        if (tag) {
            query.tags = tag
        }

        // Sort logic
        let sortObj = { createdAt: -1 }
        if (sort === 'popular') sortObj = { views: -1, 'upvotes.length': -1 }
        if (sort === 'unanswered') {
            query['answers.0'] = { $exists: false }
        }

        const questions = await Question.find(query)
            .populate('author', 'name department')
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)

        const total = await Question.countDocuments(query)

        res.json({
            questions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get single question details with answers
router.get('/:id', checkJwt, async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('author', 'name department role')
            .populate('answers.author', 'name department role')

        if (!question) return res.status(404).json({ error: 'Question not found' })
        res.json({ question })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Ask a new question
router.post('/', checkJwt, async (req, res) => {
    try {
        const { title, content, tags } = req.body
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const question = await Question.create({
            title,
            content,
            tags: tags || [],
            author: user._id
        })

        res.status(201).json({ question })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Add an answer
router.post('/:id/answers', checkJwt, async (req, res) => {
    try {
        const { content } = req.body
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const question = await Question.findById(req.params.id)
        if (!question) return res.status(404).json({ error: 'Question not found' })

        const newAnswer = {
            content,
            author: user._id,
            createdAt: new Date()
        }

        question.answers.push(newAnswer)
        await question.save()

        // Optionally: notify the question author a new answer was posted.

        res.status(201).json({ question })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Upvote / Toggle a Question
router.post('/:id/upvote', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const question = await Question.findById(req.params.id)
        if (!question) return res.status(404).json({ error: 'Question not found' })

        const hasUpvoted = question.upvotes.includes(user._id)
        if (hasUpvoted) {
            question.upvotes = question.upvotes.filter(id => id.toString() !== user._id.toString())
        } else {
            question.upvotes.push(user._id)
        }

        await question.save()
        res.json({ upvotes: question.upvotes.length, hasUpvoted: !hasUpvoted })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Accept an answer (Only Original Question Author can do this)
router.post('/:qId/answers/:aId/accept', checkJwt, async (req, res) => {
    try {
        const auth0Id = getAuth0Id(req)
        const user = await User.findOne({ auth0Id })

        const question = await Question.findById(req.params.qId)
        if (!question) return res.status(404).json({ error: 'Question not found' })

        if (question.author.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Only question author can accept an answer' })
        }

        // Reset all other answers to not accepted
        question.answers.forEach(a => {
            if (a._id.toString() === req.params.aId) {
                a.isAccepted = true;
                // Give XP bonus to the user who wrote the right answer (gamification)
                User.findByIdAndUpdate(a.author, { $inc: { xp: 10 } }).exec()
            } else {
                a.isAccepted = false;
            }
        })

        await question.save()
        res.json({ question })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
