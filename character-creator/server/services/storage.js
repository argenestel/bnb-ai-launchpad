// services/storage.js
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import axios from "axios";
import FormData from "form-data";
import { ethers } from "ethers";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CharacterStorage {
	constructor() {
		this.db = null;
		this.initialized = false;
		this.initialize();
	}

	async initialize() {
		if (this.initialized) return;

		try {
			// Initialize SQLite database
			this.db = await open({
				filename: path.join(__dirname, "../data/character_storage.db"),
				driver: sqlite3.Database,
			});

			// Create tables if they don't exist
			await this.db.exec(`
                CREATE TABLE IF NOT EXISTS character_storage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    ipfs_hash TEXT,
                    ipfs_url TEXT,
                    evm_address TEXT,
                    evm_private_key TEXT,
                    local_file_path TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_character_name ON character_storage(name);
            `);

			this.initialized = true;
		} catch (error) {
			console.error("Storage initialization error:", error);
			throw error;
		}
	}

	async uploadToPinata(characterData) {
		try {
			const formData = new FormData();
			const jsonContent = JSON.stringify(characterData);
			const fileName = `${characterData.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}.json`;

			formData.append("file", Buffer.from(jsonContent), {
				filename: fileName,
				contentType: "application/json",
			});

			const response = await axios.post(
				"https://api.pinata.cloud/pinning/pinFileToIPFS",
				formData,
				{
					headers: {
						"Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
						pinata_api_key: process.env.PINATA_API_KEY,
						pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
					},
				},
			);

			return {
				ipfsHash: response.data.IpfsHash,
				ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
			};
		} catch (error) {
			console.error("Pinata upload error:", error);
			throw new Error("Failed to upload to Pinata: " + error.message);
		}
	}

	async saveToLocalFile(characterData) {
		try {
			const generatedDir = path.join(process.cwd(), "generated");
			await fs.mkdir(generatedDir, { recursive: true });

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const sanitizedName = characterData.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "_");
			const filename = `${sanitizedName}_${timestamp}.json`;
			const filePath = path.join(generatedDir, filename);

			await fs.writeFile(
				filePath,
				JSON.stringify(characterData, null, 2),
				"utf8",
			);

			return {
				filename,
				path: filePath,
			};
		} catch (error) {
			console.error("Local file save error:", error);
			throw new Error("Failed to save local file: " + error.message);
		}
	}

	generateEVMWallet() {
		const wallet = ethers.Wallet.createRandom();
		return {
			address: wallet.address,
			privateKey: wallet.privateKey,
		};
	}

	async storeCharacter(characterData) {
		try {
			await this.initialize();

			// Generate EVM wallet
			const wallet = this.generateEVMWallet();

			// Upload to IPFS via Pinata
			const pinataResult = await this.uploadToPinata({
				...characterData,
				evmAddress: wallet.address,
			});

			// Save to local file system
			const localFile = await this.saveToLocalFile({
				...characterData,
				evmAddress: wallet.address,
				ipfsHash: pinataResult.ipfsHash,
				ipfsUrl: pinataResult.ipfsUrl,
			});

			// Store in SQLite database
			const result = await this.db.run(
				`
                INSERT INTO character_storage (
                    name,
                    description,
                    ipfs_hash,
                    ipfs_url,
                    evm_address,
                    evm_private_key,
                    local_file_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
				[
					characterData.name,
					characterData.description,
					pinataResult.ipfsHash,
					pinataResult.ipfsUrl,
					wallet.address,
					wallet.privateKey,
					localFile.path,
				],
			);

			return {
				id: result.lastID,
				...characterData,
				ipfsHash: pinataResult.ipfsHash,
				ipfsUrl: pinataResult.ipfsUrl,
				evmAddress: wallet.address,
				localFile: localFile.filename,
			};
		} catch (error) {
			console.error("Error storing character:", error);
			throw error;
		}
	}

	async getCharacterByName(name) {
		try {
			await this.initialize();

			const character = await this.db.get(
				"SELECT * FROM character_storage WHERE name = ?",
				[name],
			);

			if (!character) {
				return null;
			}

			// Read the local file for full character data
			const localData = await fs.readFile(character.local_file_path, "utf8");
			const characterData = JSON.parse(localData);

			return {
				...characterData,
				ipfsHash: character.ipfs_hash,
				ipfsUrl: character.ipfs_url,
				evmAddress: character.evm_address,
			};
		} catch (error) {
			console.error("Error getting character:", error);
			throw error;
		}
	}

	async getAllCharacters() {
		try {
			await this.initialize();

			return await this.db.all(`
                SELECT 
                    id,
                    name,
                    description,
                    ipfs_url,
                    evm_address,
                    created_at,
                    updated_at
                FROM character_storage
                ORDER BY created_at DESC
            `);
		} catch (error) {
			console.error("Error getting all characters:", error);
			throw error;
		}
	}

	async updateCharacter(id, updateData) {
		try {
			await this.initialize();

			// Get existing character
			const existing = await this.db.get(
				"SELECT * FROM character_storage WHERE id = ?",
				[id],
			);

			if (!existing) {
				throw new Error("Character not found");
			}

			// Upload updated data to IPFS
			const pinataResult = await this.uploadToPinata({
				...updateData,
				evmAddress: existing.evm_address,
			});

			// Save updated file locally
			const localFile = await this.saveToLocalFile({
				...updateData,
				evmAddress: existing.evm_address,
				ipfsHash: pinataResult.ipfsHash,
				ipfsUrl: pinataResult.ipfsUrl,
			});

			// Update database
			await this.db.run(
				`
                UPDATE character_storage 
                SET 
                    description = ?,
                    ipfs_hash = ?,
                    ipfs_url = ?,
                    local_file_path = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
				[
					updateData.description,
					pinataResult.ipfsHash,
					pinataResult.ipfsUrl,
					localFile.path,
					id,
				],
			);

			return await this.getCharacterByName(updateData.name);
		} catch (error) {
			console.error("Error updating character:", error);
			throw error;
		}
	}

	async deleteCharacter(id) {
		try {
			await this.initialize();

			const character = await this.db.get(
				"SELECT local_file_path FROM character_storage WHERE id = ?",
				[id],
			);

			if (character) {
				// Delete local file
				try {
					await fs.unlink(character.local_file_path);
				} catch (error) {
					console.warn("Error deleting local file:", error);
				}

				// Delete from database
				await this.db.run("DELETE FROM character_storage WHERE id = ?", [id]);
			}

			return { success: true };
		} catch (error) {
			console.error("Error deleting character:", error);
			throw error;
		}
	}

	async close() {
		if (this.db) {
			await this.db.close();
			this.initialized = false;
		}
	}
}

export default CharacterStorage;
