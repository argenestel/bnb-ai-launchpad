// services/characterManager.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCharacter(characterName) {
	try {
		const generatedDir = path.join(process.cwd(), "generated");
		const files = await fs.readdir(generatedDir);

		// Find the latest version of the character file
		const characterFile = files
			.filter(
				(file) =>
					file.toLowerCase().startsWith(characterName.toLowerCase() + "_") &&
					file.endsWith(".json"),
			)
			.sort()
			.reverse()[0];

		if (!characterFile) {
			throw new Error("Character not found");
		}

		const content = await fs.readFile(
			path.join(generatedDir, characterFile),
			"utf8",
		);
		const character = JSON.parse(content);

		// Load character memories
		const memories = await db.getMemories(characterName, "system");

		return {
			...character,
			memories,
		};
	} catch (error) {
		console.error("Error loading character:", error);
		throw error;
	}
}

export async function validateCharacterExists(characterName) {
	try {
		const generatedDir = path.join(process.cwd(), "generated");
		const files = await fs.readdir(generatedDir);

		const characterFiles = files.filter(
			(file) =>
				file.toLowerCase().startsWith(characterName.toLowerCase() + "_") &&
				file.endsWith(".json"),
		);

		return characterFiles.length > 0;
	} catch (error) {
		console.error("Error validating character:", error);
		return false;
	}
}

export async function updateCharacterMemories(characterName, updates) {
	try {
		for (const [key, value] of Object.entries(updates)) {
			await db.storeMemory(
				characterName,
				"system",
				`updated_${key}`,
				value,
				0.8,
			);
		}
	} catch (error) {
		console.error("Error updating character memories:", error);
		throw error;
	}
}

export async function initializeCharacterMemories(character) {
	try {
		// Store base character information
		await db.storeMemory(
			character.name,
			"system",
			"initial_description",
			character.description,
			1.0,
		);

		// Store character traits
		if (character.traits) {
			for (const [trait, description] of Object.entries(character.traits)) {
				await db.storeMemory(
					character.name,
					"system",
					"character_trait",
					`${trait}: ${description}`,
					0.9,
				);
			}
		}

		// Store additional character attributes
		if (character.background) {
			await db.storeMemory(
				character.name,
				"system",
				"background",
				character.background,
				0.8,
			);
		}

		if (character.personality) {
			await db.storeMemory(
				character.name,
				"system",
				"personality",
				character.personality,
				0.9,
			);
		}
	} catch (error) {
		console.error("Error initializing character memories:", error);
		throw error;
	}
}

export default {
	loadCharacter,
	validateCharacterExists,
	updateCharacterMemories,
	initializeCharacterMemories,
};
