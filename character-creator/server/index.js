import express from "express";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { systemPrompt } from "./prompt.js";
import { saveCharacter } from "./characterSaver.js";
import cors from "cors";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
// Validation schemas for optional parameters
const validModelProviders = ["openai", "anthropic", "llama_local"];
const validVoiceModels = [
	"en_US-male-medium",
	"en_US-female-medium",
	"en_US-neutral-medium",
];
const validClients = ["discord", "direct", "twitter", "telegram", "farcaster"];

// Initialize Azure OpenAI chat model
const model = new ChatOpenAI({
	temperature: 0.9,
	azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
	azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
	azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
	azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
});

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

// Character generation endpoint
app.post("/generate", async (req, res) => {
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

			// Save the character
			const saveResult = await saveCharacter(characterProfile);

			res.json({
				success: true,
				data: characterProfile,
				saved: saveResult,
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
app.get("/characters", async (req, res) => {
	try {
		const generatedDir = path.join(process.cwd(), "generated");

		// Create directory if it doesn't exist
		try {
			await fs.access(generatedDir);
		} catch {
			await fs.mkdir(generatedDir, { recursive: true });
			return res.json({ characters: [] }); // Return empty array if directory was just created
		}

		// Read all files in the generated directory
		const files = await fs.readdir(generatedDir);
		const characters = await Promise.all(
			files
				.filter((file) => file.endsWith(".json"))
				.map(async (file) => {
					try {
						const content = await fs.readFile(
							path.join(generatedDir, file),
							"utf8",
						);
						const character = JSON.parse(content);
						return {
							...character,
							filename: file,
						};
					} catch (error) {
						console.error(`Error reading file ${file}:`, error);
						return null;
					}
				}),
		);

		// Filter out any null values from failed reads
		const validCharacters = characters.filter((char) => char !== null);

		res.json({
			success: true,
			count: validCharacters.length,
			characters: validCharacters,
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
app.get("/characters/:name", async (req, res) => {
	try {
		const characterName = req.params.name.toLowerCase();
		const generatedDir = path.join(process.cwd(), "generated");

		// Check if directory exists
		try {
			await fs.access(generatedDir);
		} catch {
			return res.status(404).json({
				error: "No characters found",
			});
		}

		// Read all files in the generated directory
		const files = await fs.readdir(generatedDir);

		// Find files that match the character name
		const matchingFiles = files.filter(
			(file) =>
				file.toLowerCase().startsWith(characterName + "_") &&
				file.endsWith(".json"),
		);

		if (matchingFiles.length === 0) {
			return res.status(404).json({
				error: "Character not found",
			});
		}

		// Sort by timestamp (newest first) and get the latest version
		const latestFile = matchingFiles.sort().reverse()[0];

		// Read and parse the character file
		const content = await fs.readFile(
			path.join(generatedDir, latestFile),
			"utf8",
		);
		const character = JSON.parse(content);

		res.json({
			success: true,
			data: {
				...character,
				filename: latestFile,
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
// Health check endpoint
app.get("/health", (req, res) => {
	const requiredEnvVars = [
		"AZURE_OPENAI_API_KEY",
		"AZURE_OPENAI_DEPLOYMENT_NAME",
		"AZURE_OPENAI_INSTANCE_NAME",
		"AZURE_OPENAI_API_VERSION",
	];

	const missingEnvVars = requiredEnvVars.filter(
		(varName) => !process.env[varName],
	);

	res.json({
		status: missingEnvVars.length === 0 ? "ok" : "missing_configuration",
		timestamp: new Date().toISOString(),
		env: {
			hasAzureKey: !!process.env.AZURE_OPENAI_API_KEY,
			hasDeploymentName: !!process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
			hasInstanceName: !!process.env.AZURE_OPENAI_INSTANCE_NAME,
			hasApiVersion: !!process.env.AZURE_OPENAI_API_VERSION,
		},
		missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
	});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`Health check available at http://localhost:${PORT}/health`);
});
