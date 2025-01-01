// services/characterManager.js
import CharacterStorage from "./storage.js";

export async function loadCharacter(characterName) {
	try {
		console.log("Loading character:", characterName);
		const storage = new CharacterStorage();
		const character = await storage.getCharacterByName(characterName);

		if (!character) {
			throw new Error("Character not found");
		}

		console.log("Character loaded:", {
			name: character.name,
			type: character.type,
			description: character.description
		});

		return character;
	} catch (error) {
		console.error("Error loading character:", error);
		throw error;
	}
}

export async function validateCharacterExists(characterName) {
	try {
		const storage = new CharacterStorage();
		const character = await storage.getCharacterByName(characterName);
		return !!character;
	} catch (error) {
		console.error("Error validating character:", error);
		return false;
	}
}

export default {
	loadCharacter,
	validateCharacterExists,
};
