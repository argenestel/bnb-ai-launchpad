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
                    type TEXT DEFAULT 'ai_character',
                    theme TEXT,
                    goal TEXT,
                    antagonist TEXT,
                    ipfs_hash TEXT,
                    ipfs_url TEXT,
                    evm_address TEXT,
                    evm_private_key TEXT,
                    local_file_path TEXT,
                    token_address TEXT,
                    token_name TEXT,
                    token_symbol TEXT,
                    token_image_url TEXT,
                    token_description TEXT,
                    token_tx_hash TEXT,
                    twitter_handle TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_character_name ON character_storage(name);
                CREATE INDEX IF NOT EXISTS idx_token_address ON character_storage(token_address);
                CREATE INDEX IF NOT EXISTS idx_character_type ON character_storage(type);
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
                    type,
                    theme,
                    goal,
                    antagonist,
                    ipfs_hash,
                    ipfs_url,
                    evm_address,
                    evm_private_key,
                    local_file_path,
                    token_address,
                    token_name,
                    token_symbol,
                    token_image_url,
                    token_description,
                    token_tx_hash,
                    twitter_handle
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
				[
					characterData.name,
					characterData.description,
					characterData.type || 'ai_character',
					characterData.theme || null,
					characterData.goal || null,
					characterData.antagonist || null,
					pinataResult.ipfsHash,
					pinataResult.ipfsUrl,
					wallet.address,
					wallet.privateKey,
					localFile.path,
					characterData.token?.address || null,
					characterData.token?.name || null,
					characterData.token?.symbol || null,
					characterData.token?.imageUrl || null,
					characterData.token?.description || null,
					characterData.token?.transactionHash || null,
					characterData.twitter_handle || null,
				],
			);

			return {
				id: result.lastID,
				name: characterData.name,
				description: characterData.description,
				type: characterData.type || 'ai_character',
				theme: characterData.theme,
				goal: characterData.goal,
				antagonist: characterData.antagonist,
				ipfsHash: pinataResult.ipfsHash,
				ipfs_url: pinataResult.ipfsUrl,
				evm_address: wallet.address,
				token_address: characterData.token?.address || null,
				token_name: characterData.token?.name || null,
				token_symbol: characterData.token?.symbol || null,
				token_image_url: characterData.token?.imageUrl || null,
				twitter_handle: characterData.twitter_handle || null
			};
		} catch (error) {
			console.error("Error storing character:", error);
			throw error;
		}
	}

	async getCharacterByName(name) {
		try {
			await this.initialize();

			console.log("Getting character from database:", name);
			const character = await this.db.get(
				"SELECT * FROM character_storage WHERE name = ?",
				[name],
			);

			if (!character) {
				console.log("No character found with name:", name);
				return null;
			}

			console.log("Found character in database:", {
				id: character.id,
				name: character.name,
				type: character.type
			});

			// Read the local file for full character data
			try {
				const localData = await fs.readFile(character.local_file_path, "utf8");
				const characterData = JSON.parse(localData);

				// Merge database and local file data
				const mergedData = {
					...characterData,
					id: character.id,
					name: character.name,
					type: character.type || 'ai_character',
					description: character.description,
					theme: character.theme,
					goal: character.goal,
					antagonist: character.antagonist,
					ipfsHash: character.ipfs_hash,
					ipfsUrl: character.ipfs_url,
					evmAddress: character.evm_address,
					token: character.token_address ? {
						address: character.token_address,
						name: character.token_name,
						symbol: character.token_symbol,
						imageUrl: character.token_image_url,
						description: character.token_description,
						transactionHash: character.token_tx_hash,
					} : null,
				};

				console.log("Returning merged character data");
				return mergedData;
			} catch (fileError) {
				console.warn("Could not read local file, returning database data:", fileError);
				// If local file is not available, return database data
				return {
					id: character.id,
					name: character.name,
					type: character.type || 'ai_character',
					description: character.description,
					theme: character.theme,
					goal: character.goal,
					antagonist: character.antagonist,
					ipfsHash: character.ipfs_hash,
					ipfsUrl: character.ipfs_url,
					evmAddress: character.evm_address,
					token: character.token_address ? {
						address: character.token_address,
						name: character.token_name,
						symbol: character.token_symbol,
						imageUrl: character.token_image_url,
						description: character.token_description,
						transactionHash: character.token_tx_hash,
					} : null,
				};
			}
		} catch (error) {
			console.error("Error getting character:", error);
			throw error;
		}
	}

	async getAllCharacters() {
		try {
			await this.initialize();
			const characters = await this.db.all(`
				SELECT 
					id,
					name,
					description,
					type,
					theme,
					goal,
					antagonist,
					ipfs_url,
					evm_address,
					token_address,
					token_name,
					token_symbol,
					token_image_url,
					twitter_handle,
					created_at,
					updated_at
				FROM character_storage
				ORDER BY created_at DESC
			`);
			return characters;
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

			// Update database with all fields including token information
			await this.db.run(
				`
				UPDATE character_storage 
				SET 
					description = ?,
					ipfs_hash = ?,
					ipfs_url = ?,
					local_file_path = ?,
					token_address = ?,
					token_name = ?,
					token_symbol = ?,
					token_image_url = ?,
					token_description = ?,
					token_tx_hash = ?,
					twitter_handle = ?,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
				`,
				[
					updateData.description,
					pinataResult.ipfsHash,
					pinataResult.ipfsUrl,
					localFile.path,
					updateData.token?.address || existing.token_address,
					updateData.token?.name || existing.token_name,
					updateData.token?.symbol || existing.token_symbol,
					updateData.token?.imageUrl || existing.token_image_url,
					updateData.token?.description || existing.token_description,
					updateData.token?.transactionHash || existing.token_tx_hash,
					updateData.twitter_handle || existing.twitter_handle,
					id,
				],
			);

			return await this.getCharacterByName(existing.name);
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
