import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'labyrinth.db');
const db = new Database(dbPath);

// Initialize DB schemas
db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerName TEXT NOT NULL,
        score INTEGER NOT NULL,
        floorReached INTEGER NOT NULL,
        timeSeconds INTEGER NOT NULL,
        sessionId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

export default db;
