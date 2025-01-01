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

// Helper function to clean LLM response
const cleanLLMResponse = (content) => {
	// Remove markdown code blocks if present
	const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
	if (jsonMatch) {
		return jsonMatch[1];
	}
	return content;
};

// Add this endpoint to routes/characterRoutes.js

// Update character token
router.patch("/:name/token", async (req, res) => {
	try {
		const { name } = req.params;
		const { tokenAddress, tokenName, tokenSymbol, transactionHash, imageUrl } =
			req.body;

		// Validate required fields
		if (!tokenAddress || !tokenName || !tokenSymbol || !transactionHash) {
			return res.status(400).json({
				error: "Missing required token information",
				details:
					"Token address, name, symbol, and transaction hash are required",
			});
		}

		// Get existing character
		const character = await characterStorage.getCharacterByName(name);
		if (!character) {
			return res.status(404).json({
				error: "Character not found",
			});
		}

		// Update token information
		const tokenUpdate = {
			token: {
				name: tokenName,
				symbol: tokenSymbol,
				address: tokenAddress,
				transactionHash: transactionHash,
				...(imageUrl && { imageUrl }),
			},
		};

		// Update character with new token information
		const updatedCharacter = await characterStorage.updateCharacter(
			character.id,
			tokenUpdate,
		);

		// Update token information in memory database
		await db.storeMemory(
			character.name,
			"system",
			"token_info",
			JSON.stringify({
				name: tokenName,
				symbol: tokenSymbol,
				address: tokenAddress,
			}),
			1.0,
		);

		// Update blockchain knowledge in memory
		await db.storeMemory(
			character.name,
			"system",
			"blockchain_knowledge",
			`I have my own token (${tokenSymbol}) at address ${tokenAddress}. This is part of my digital identity on the blockchain.`,
			1.0,
		);

		res.json({
			success: true,
			data: updatedCharacter,
		});
	} catch (error) {
		console.error("Error updating character token:", error);
		res.status(500).json({
			error: "Failed to update character token",
			details: error.message,
		});
	}
});

router.post("/generate", async (req, res) => {
	try {
		const {
			name = "",
			description = "",
			modelProvider,
			clients,
			settings,
			plugins,
			token,
			twitter_handle,
			...otherParams
		} = req.body;

		// Validate required fields
		if (!name.trim()) {
			return res.status(400).json({ error: "Character name is required" });
		}

		// Validate token information
		if (!token?.address || !token?.transactionHash) {
			return res.status(400).json({
				error: "Token information is required",
				details: "Token must be created before generating character",
			});
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
			...(twitter_handle && { twitter_handle }),
			token,
			...otherParams,
		};

		console.log("Generating character profile with token integration...");

		// Generate character profile
		const chat = await model.invoke([
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: JSON.stringify(cleanInput),
			},
		]);

		try {
			let characterProfile;

			// Parse LLM response
			try {
				characterProfile = JSON.parse(chat.content);
			} catch (initialParseError) {
				const cleanedContent = cleanLLMResponse(chat.content);
				characterProfile = JSON.parse(cleanedContent);
			}

			// Merge token information with generated profile
			characterProfile = {
				...characterProfile,
				token,
				twitter_handle,
			};

			// Validate required fields
			if (!characterProfile.name || !characterProfile.description) {
				throw new Error("Missing required fields in generated profile");
			}

			console.log("Storing character with token information...");

			// Store character with IPFS and create EVM wallet
			let storedCharacter;
			try {
				storedCharacter =
					await characterStorage.storeCharacter(characterProfile);
				console.log("Character stored successfully:", storedCharacter);
			} catch (storageError) {
				console.error("Storage error:", storageError);
				throw new Error(`Failed to store character: ${storageError.message}`);
			}

			console.log("Initializing memory database...");

			// Store initial memories
			try {
				// Store basic character info
				await db.storeMemory(
					characterProfile.name,
					"system",
					"initial_description",
					characterProfile.description,
					1.0,
				);

				// Store token information as high-priority memory
				await db.storeMemory(
					characterProfile.name,
					"system",
					"token_info",
					JSON.stringify({
						name: token.name,
						symbol: token.symbol,
						address: token.address,
					}),
					1.0,
				);

				console.log("Initial memories stored successfully");
			} catch (dbError) {
				console.error("Database error:", dbError);
				throw new Error(`Failed to store initial memory: ${dbError.message}`);
			}

			// Store character traits
			console.log("Storing character traits...");
			if (characterProfile.traits) {
				try {
					for (const trait of characterProfile.traits) {
						await db.storeMemory(
							characterProfile.name,
							"system",
							"character_trait",
							trait,
							0.9,
						);
					}
					console.log("Character traits stored successfully");
				} catch (traitsError) {
					console.error("Traits storage error:", traitsError);
				}
			}

			// Store additional data
			try {
				// Store bio entries
				if (characterProfile.bio) {
					for (const bioEntry of characterProfile.bio) {
						await db.storeMemory(
							characterProfile.name,
							"system",
							"biography",
							bioEntry,
							0.8,
						);
					}
				}

				// Store knowledge base
				if (characterProfile.knowledge) {
					for (const knowledge of characterProfile.knowledge) {
						await db.storeMemory(
							characterProfile.name,
							"system",
							"knowledge",
							knowledge,
							0.7,
						);
					}
				}

				// Store blockchain-specific knowledge
				await db.storeMemory(
					characterProfile.name,
					"system",
					"blockchain_knowledge",
					`I have my own token (${token.symbol}) at address ${token.address}. This is part of my digital identity on the blockchain.`,
					1.0,
				);
			} catch (additionalDataError) {
				console.error("Additional data storage error:", additionalDataError);
			}

			console.log("Character generation complete");
			res.json({
				success: true,
				data: {
					...characterProfile,
					...storedCharacter,
				},
			});
		} catch (parseError) {
			console.error("Parse error:", parseError);
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
			stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
