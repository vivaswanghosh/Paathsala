import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

import Event from '../src/models/event.js';
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paathsala';

const dummyEvents = [
    {
        title: 'Global Tech Hackathon 2026',
        description: 'A 48-hour coding marathon to build innovative solutions for current global challenges.',
        date: new Date('2026-04-15'),
        location: 'Main Auditorium',
        category: 'hackathon'
    },
    {
        title: 'AI in Healthcare Seminar',
        description: 'Exploring the future of artificial intelligence in medical diagnosis and treatment planning.',
        date: new Date('2026-03-20'),
        location: 'Seminar Hall A',
        category: 'seminar'
    },
    {
        title: 'React Performance Workshop',
        description: 'Deep dive into advanced React concepts, optimization techniques, and best practices.',
        date: new Date('2026-05-10'),
        location: 'Computer Lab 3',
        category: 'workshop'
    },
    {
        title: 'Annual Cultural Fest - Rhythm 2026',
        description: 'The biggest cultural extravaganza of the year featuring music, dance, and arts.',
        date: new Date('2026-02-28'),
        location: 'College Campus',
        category: 'cultural'
    },
    {
        title: 'Cybersecurity Bootcamp',
        description: 'Learn the essentials of ethical hacking, network security, and cryptography.',
        date: new Date('2026-06-05'),
        location: 'Computer Lab 1',
        category: 'workshop'
    },
    {
        title: 'Web3 & Blockchain Seminar',
        description: 'An introduction to decentralized applications, smart contracts, and Web3 technologies.',
        date: new Date('2026-07-22'),
        location: 'Seminar Hall B',
        category: 'seminar'
    }
];

const seedEvents = async () => {
    try {
        console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB Connected...');

        // Clear existing events for a clean slate
        await Event.deleteMany();
        console.log('Cleared existing events.');

        // Fetch some users to act as registrants/attendees
        const users = await User.find({ role: 'student' }).limit(10);

        if (users.length === 0) {
            console.warn('No student users found in the database. Events will be created without registrants.');
        }

        const eventsWithRegistrants = dummyEvents.map(eventInfo => {
            // Create random registrants from available users
            const registrants = [];
            const numRegistrants = Math.floor(Math.random() * users.length) + 1; // 1 to all users

            // Shuffle users array to get random selection
            const shuffledUsers = users.sort(() => 0.5 - Math.random());

            for (let i = 0; i < numRegistrants; i++) {
                const user = shuffledUsers[i];
                if (!user) break;

                // Randomly assign status 'attended' or 'registered' (mostly attended for old events, mostly registered for future events)
                const isPastEvent = eventInfo.date < new Date();
                const status = isPastEvent
                    ? (Math.random() > 0.2 ? 'attended' : 'registered') // Past event -> 80% attended
                    : (Math.random() > 0.9 ? 'attended' : 'registered'); // Future event -> 10% attended (maybe pre-marked?)

                registrants.push({
                    user: user._id,
                    status: status,
                    registeredAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                });
            }

            return {
                ...eventInfo,
                // Assuming the first user is an admin or event creator, or just random
                createdBy: users.length > 0 ? users[0]._id : null,
                registrants: registrants
            };
        });

        await Event.insertMany(eventsWithRegistrants);
        console.log(`Successfully inserted ${eventsWithRegistrants.length} dummy events with randomized registrants!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seedEvents();
