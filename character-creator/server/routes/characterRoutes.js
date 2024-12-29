// routes/characterRoutes.js
import express from "express";
import { ChatOpenAI } from "@langchain/openai";
import { systemPrompt } from "../prompt.js";
import CharacterStorage from "../services/storage.js";
import db from "../db/database.js";

const router = express.Router();
const characterStorage = new CharacterStorage();

// Initialize Azure OpenAI chat model
const model = new ChatOpenAI({
	temperature: 0.9,
	azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
	azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
	azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
	azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
});

// Validation schemas
const validModelProviders = ["openai", "anthropic", "llama_local"];
const validVoiceModels = [
	"en_US-male-medium",
	"en_US-female-medium",
	"en_US-neutral-medium",
];
const validClients = ["discord", "direct", "twitter", "telegram", "farcaster"];

// Validate character parameters
function validateParameters(params) {
	const errors = [];

	if (
		params.modelProvider &&
		!validModelProviders.includes(params.modelProvider)
	) {
		errors.push(
			`Invalid modelProvider. Must be one of: ${validModelProviders.join(", ")}`,
		);
	}

	if (params.clients) {
		const invalidClients = params.clients.filter(
			(client) => !validClients.includes(client),
		);
		if (invalidClients.length > 0) {
			errors.push(
				`Invalid clients: ${invalidClients.join(", ")}. Valid options are: ${validClients.join(", ")}`,
			);
		}
	}

	if (
		params.settings?.voice?.model &&
		!validVoiceModels.includes(params.settings.voice.model)
	) {
		errors.push(
			`Invalid voice model. Must be one of: ${validVoiceModels.join(", ")}`,
		);
	}

	return errors;
}

// Generate character endpoint
router.post("/generate", async (req, res) => {
	try {
		const {
			name = "",
			description = "",
			modelProvider,
			clients,
			settings,
			plugins,
			...otherParams
		} = req.body;

		// Validate required fields
		if (!name.trim()) {
			return res.status(400).json({ error: "Character name is required" });
		}

		// Validate optional parameters
		const validationErrors = validateParameters({
			modelProvider,
			clients,
			settings,
			...otherParams,
		});

		if (validationErrors.length > 0) {
			return res.status(400).json({
				error: "Invalid parameters",
				details: validationErrors,
			});
		}

		// Clean and prepare input parameters
		const cleanInput = {
			name: name.trim(),
			description: description.trim(),
			...(modelProvider && { modelProvider }),
			...(clients && { clients }),
			...(settings && { settings }),
			...(plugins && { plugins }),
			...otherParams,
		};

		// Generate character profile
		const chat = await model.invoke([
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: JSON.stringify(cleanInput),
			},
		]);

		try {
			const characterProfile = JSON.parse(chat.content);

			// Validate required fields in response
			if (!characterProfile.name || !characterProfile.description) {
				throw new Error("Missing required fields in generated profile");
			}

			// Store character with IPFS and create EVM wallet
			const storedCharacter =
				await characterStorage.storeCharacter(characterProfile);
			console.log(storedCharacter);
			// Initialize character in memory database
			await db.storeMemory(
				characterProfile.name,
				"system",
				"initial_description",
				characterProfile.description,
				1.0,
			);
			console.log("DB stored");
			// Store character traits as memories
			if (characterProfile.traits) {
				for (const [trait, description] of Object.entries(
					characterProfile.traits,
				)) {
					await db.storeMemory(
						characterProfile.name,
						"system",
						"character_trait",
						`${trait}: ${description}`,
						0.9,
					);
				}
			}

			res.json({
				success: true,
				data: {
					...characterProfile,
					...storedCharacter,
				},
			});
		} catch (parseError) {
			res.status(422).json({
				error: "Invalid JSON response",
				details: parseError.message,
				content: chat.content,
			});
		}
	} catch (error) {
		console.error("Server Error:", error);
		res.status(500).json({
			error: "Internal server error",
			details: error.message,
		});
	}
});

// Get all characters
router.get("/", async (req, res) => {
	try {
		const characters = await characterStorage.getAllCharacters();
		res.json({
			success: true,
			count: characters.length,
			characters: characters,
		});
	} catch (error) {
		console.error("Error getting characters:", error);
		res.status(500).json({
			error: "Failed to retrieve characters",
			details: error.message,
		});
	}
});

// Get character by name
router.get("/:name", async (req, res) => {
	try {
		const character = await characterStorage.getCharacterByName(
			req.params.name,
		);

		if (!character) {
			return res.status(404).json({
				error: "Character not found",
			});
		}

		// Get character memories
		const memories = await db.getMemories(character.name, "system");

		res.json({
			success: true,
			data: {
				...character,
				memories,
			},
		});
	} catch (error) {
		console.error("Error getting character:", error);
		res.status(500).json({
			error: "Failed to retrieve character",
			details: error.message,
		});
	}
});

// Update character
router.put("/:id", async (req, res) => {
	try {
		const updatedCharacter = await characterStorage.updateCharacter(
			req.params.id,
			req.body,
		);

		if (!updatedCharacter) {
			return res.status(404).json({
				error: "Character not found",
			});
		}

		// Update character memories
		if (req.body.description) {
			await db.storeMemory(
				updatedCharacter.name,
				"system",
				"updated_description",
				req.body.description,
				1.0,
			);
		}

		res.json({
			success: true,
			data: updatedCharacter,
		});
	} catch (error) {
		console.error("Error updating character:", error);
		res.status(500).json({
			error: "Failed to update character",
			details: error.message,
		});
	}
});

// Get character wallet information
router.get("/:name/wallet", async (req, res) => {
	try {
		const character = await characterStorage.getCharacterByName(
			req.params.name,
		);

		if (!character) {
			return res.status(404).json({
				error: "Character not found",
			});
		}

		res.json({
			success: true,
			data: {
				name: character.name,
				evmAddress: character.evm_address,
			},
		});
	} catch (error) {
		console.error("Error getting character wallet:", error);
		res.status(500).json({
			error: "Failed to retrieve character wallet",
			details: error.message,
		});
	}
});

export default router;
