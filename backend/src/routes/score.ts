import { Router } from 'express';
import db from '../db';

const router = Router();

router.post('/submit', (req, res) => {
    const { playerName, score, floorReached, timeSeconds } = req.body;
    const sessionId = req.sessionID;

    if (!playerName || score === undefined || !floorReached || timeSeconds === undefined) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const stmt = db.prepare(`
        INSERT INTO scores (playerName, score, floorReached, timeSeconds, sessionId)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    try {
        const info = stmt.run(playerName, score, floorReached, timeSeconds, sessionId);
        res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/leaderboard', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const stmt = db.prepare(`
        SELECT id, playerName, score, floorReached, timeSeconds, createdAt 
        FROM scores 
        ORDER BY score DESC 
        LIMIT ?
    `);
    
    try {
        const rows = stmt.all(limit);
        res.json(rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/personal', (req, res) => {
    const sessionId = req.query.session || req.sessionID;
    
    const stmt = db.prepare(`
        SELECT id, playerName, score, floorReached, timeSeconds, createdAt 
        FROM scores 
        WHERE sessionId = ? 
        ORDER BY score DESC 
        LIMIT 1
    `);
    
    try {
        const row = stmt.get(sessionId);
        res.json(row || { message: 'No scores found for this session' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
