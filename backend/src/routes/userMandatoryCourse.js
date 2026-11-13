const  express = require('express')
const router = express.Router()

const { db } = require('../db/db')
const { userMandatoryCourseCompleted } = require('../db/schema')
const { eq } = require('drizzle-orm')

const COURSE_COLUMNS = Object.keys(userMandatoryCourseCompleted).filter(key => /^(CSCI|MATH)_\d+$/.test(key))

router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await db.select().from(userMandatoryCourseCompleted).where(eq(userMandatoryCourseCompleted.userId, userId));
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result[0]);
    } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mandatory courses' });
    }
})

router.patch('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const body = req.body || {}; // e.g. { CSCI_111: true, MATH_122: true }
        // only allow course columns (never userId) with boolean values
        const updates = Object.fromEntries(
            Object.entries(body).filter(([key, value]) => COURSE_COLUMNS.includes(key) && typeof value === 'boolean')
        );
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid updates provided' });
        }
        console.log('PATCH userMandatoryCourse', { userId, updates });
        const updated = await db.update(userMandatoryCourseCompleted)
            .set(updates)
            .where(eq(userMandatoryCourseCompleted.userId, userId))
            .returning();
        if (updated.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true });
    }catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update mandatory courses' });
    }
})

module.exports = router