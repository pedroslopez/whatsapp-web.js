const sqlite3 = require('sqlite3').verbose();
const dbPath = 'whatsapp_sessions.db';

class SQLiteStore {
    constructor(sessionName) {
        this.sessionName = sessionName;
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Connected to the SQLite database.');
            }
        });
    }

    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            this.db.run(`CREATE TABLE IF NOT EXISTS sessions (
                                                                 session_name TEXT PRIMARY KEY,
                                                                 session_data TEXT NOT NULL
                         )`, (err) => {
                if (err) {
                    console.error('Error creating sessions table:', err.message);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async save(data) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO sessions (session_name, session_data) VALUES (?, ?)
                ON CONFLICT(session_name) DO UPDATE SET session_data = excluded.session_data;`;
            this.db.run(query, [this.sessionName, JSON.stringify(data)], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async delete() {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM sessions WHERE session_name = ?';
            this.db.run(query, [this.sessionName], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async sessionExists() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT 1 FROM sessions WHERE session_name = ?';
            this.db.get(query, [this.sessionName], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            });
        });
    }

    async extract() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT session_data FROM sessions WHERE session_name = ?';
            this.db.get(query, [this.sessionName], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? JSON.parse(row.session_data) : null);
                }
            });
        });
    }
}

module.exports = SQLiteStore;
