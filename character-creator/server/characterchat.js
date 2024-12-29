import express from "express";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

// Initialize ChatOpenAI
const chatModel = new ChatOpenAI({
	temperature: 0.7,
	azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
	azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
	azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
	azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
});

// Cache for character data
const characterCache = new Map();

// Load character data from file
async function loadCharacter(characterName) {
	try {
		// Check cache first
		if (characterCache.has(characterName)) {
			return characterCache.get(characterName);
		}

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

		// Cache the character data
		characterCache.set(characterName, character);
		return character;
	} catch (error) {
		console.error("Error loading character:", error);
		throw error;
	}
}

// Generate character system prompt
function generateSystemPrompt(character) {
	return `You are ${character.name}. ${character.description}

Key traits and characteristics:
${Object.entries(character.traits || {})
	.map(([trait, desc]) => `- ${trait}: ${desc}`)
	.join("\n")}

You must stay in character at all times and respond as ${character.name} would, based on the above description and traits.
Never break character or acknowledge that you are an AI.`;
}

// Chat endpoint
app.post("/chat/:characterName", async (req, res) => {
	try {
		const { characterName } = req.params;
		const { message, conversationHistory = [] } = req.body;

		if (!message) {
			return res.status(400).json({ error: "Message is required" });
		}

		// Load character data
		const character = await loadCharacter(characterName);

		// Prepare conversation messages
		const messages = [
			{ role: "system", content: generateSystemPrompt(character) },
			...conversationHistory,
			{ role: "user", content: message },
		];

		// Generate response
		const response = await chatModel.invoke(messages);

		res.json({
			success: true,
			message: response.content,
			character: characterName,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Chat error:", error);
		res.status(error.message === "Character not found" ? 404 : 500).json({
			error: error.message || "Internal server error",
		});
	}
});

// List available characters endpoint
app.get("/available-characters", async (req, res) => {
	try {
		const generatedDir = path.join(process.cwd(), "generated");
		const files = await fs.readdir(generatedDir);

		const characters = await Promise.all(
			files
				.filter((file) => file.endsWith(".json"))
				.map(async (file) => {
					const content = await fs.readFile(
						path.join(generatedDir, file),
						"utf8",
					);
					return JSON.parse(content);
				}),
		);

		res.json({
			success: true,
			characters: characters.map((char) => ({
				name: char.name,
				description: char.description,
			})),
		});
	} catch (error) {
		console.error("Error listing characters:", error);
		res.status(500).json({
			error: "Failed to list characters",
			details: error.message,
		});
	}
});

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
	});
});

const PORT = 3001;
app.listen(PORT, () => {
	console.log(`Chat server running on port ${PORT}`);
	console.log(`Health check available at http://localhost:${PORT}/health`);
});
