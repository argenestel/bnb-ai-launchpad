// db/database.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { Database } from "@sqlitecloud/drivers";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseJS {
	constructor() {
		this.db = null;
		this.useCloud = process.env.USE_SQLITE_CLOUD === "true";
	}

	async initialize() {
		if (this.useCloud) {
			// SQLite Cloud connection
			this.db = new Database(process.env.DATABASE_URL);
		} else {
			// Local SQLite connection
			this.db = await open({
				filename: path.join(__dirname, "../data/character_memory.db"),
				driver: sqlite3.Database,
			});
		}

		await this.createTables();
	}

	async createTables() {
		await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                character_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );

            CREATE TABLE IF NOT EXISTS memory_store (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_name TEXT NOT NULL,
                user_id TEXT NOT NULL,
                memory_type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                importance_score FLOAT DEFAULT 0.5,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_memory_character_user ON memory_store(character_name, user_id);
        `);
	}

	async getUser(userId) {
		return await this.db.get("SELECT * FROM users WHERE user_id = ?", [userId]);
	}

	async createUser(userId) {
		await this.db.run("INSERT OR IGNORE INTO users (user_id) VALUES (?)", [
			userId,
		]);
		return await this.getUser(userId);
	}

	async createConversation(userId, characterName) {
		const result = await this.db.run(
			"INSERT INTO conversations (user_id, character_name) VALUES (?, ?)",
			[userId, characterName],
		);
		return result.lastID;
	}

	async addMessage(conversationId, role, content) {
		await this.db.run(
			"INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
			[conversationId, role, content],
		);
	}

	async getConversationHistory(userId, characterName, limit = 10) {
		const conversation = await this.db.get(
			"SELECT id FROM conversations WHERE user_id = ? AND character_name = ? ORDER BY last_interaction DESC LIMIT 1",
			[userId, characterName],
		);

		if (!conversation) {
			return [];
		}

		return await this.db.all(
			`SELECT role, content FROM messages 
             WHERE conversation_id = ? 
             ORDER BY timestamp DESC LIMIT ?`,
			[conversation.id, limit],
		);
	}

	async storeMemory(
		characterName,
		userId,
		memoryType,
		content,
		importanceScore = 0.5,
	) {
		await this.db.run(
			`INSERT INTO memory_store 
             (character_name, user_id, memory_type, content, importance_score) 
             VALUES (?, ?, ?, ?, ?)`,
			[characterName, userId, memoryType, content, importanceScore],
		);
	}

	async getMemories(characterName, userId, limit = 5) {
		return await this.db.all(
			`SELECT content, memory_type, importance_score
             FROM memory_store
             WHERE character_name = ? AND user_id = ?
             ORDER BY importance_score DESC, last_accessed DESC
             LIMIT ?`,
			[characterName, userId, limit],
		);
	}

	async updateMemoryAccess(characterName, userId, memoryId) {
		await this.db.run(
			`UPDATE memory_store 
             SET last_accessed = CURRENT_TIMESTAMP 
             WHERE character_name = ? AND user_id = ? AND id = ?`,
			[characterName, userId, memoryId],
		);
	}

	async close() {
		if (this.db) {
			await this.db.close();
		}
	}
}

export default new DatabaseJS();
