//@ts-nocheck
import express from "express";
import fetch from "node-fetch";
import { PostgresDatabaseAdapter } from "@ai16z/adapter-postgres";
import { SqliteDatabaseAdapter } from "@ai16z/adapter-sqlite";
import { DirectClientInterface } from "@ai16z/client-direct";
import { DiscordClientInterface } from "@ai16z/client-discord";
import { AutoClientInterface } from "@ai16z/client-auto";
import { TelegramClientInterface } from "@ai16z/client-telegram";
import { TwitterClientInterface } from "@ai16z/client-twitter";
import {
	DbCacheAdapter,
	defaultCharacter,
	FsCacheAdapter,
	ICacheManager,
	IDatabaseCacheAdapter,
	stringToUuid,
	AgentRuntime,
	CacheManager,
	Character,
	IAgentRuntime,
	ModelProviderName,
	elizaLogger,
	settings,
	IDatabaseAdapter,
	validateCharacterConfig,
} from "@ai16z/eliza";
import { bootstrapPlugin } from "@ai16z/plugin-bootstrap";
import { solanaPlugin } from "@ai16z/plugin-solana";
import { nodePlugin } from "@ai16z/plugin-node";
import Database from "better-sqlite3";
import fs from "fs";
import readline from "readline";
import yargs from "yargs";
import path from "path";
import { fileURLToPath } from "url";
import type { DirectClient } from "@ai16z/client-direct";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express setup
const app = express();
app.use(express.json());

// Global variables
let directClient: DirectClient;
const loadedCharacters = new Map<string, Character>();
const characterRuntimes = new Map<string, AgentRuntime>();

// Utility functions
export const wait = (minTime: number = 1000, maxTime: number = 3000) => {
	const waitTime =
		Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
	return new Promise((resolve) => setTimeout(resolve, waitTime));
};

// Arguments parsing
export function parseArguments(): {
	character?: string;
	characters?: string;
} {
	try {
		return yargs(process.argv.slice(2))
			.option("character", {
				type: "string",
				description: "Path to the character JSON file",
			})
			.option("characters", {
				type: "string",
				description: "Comma separated list of paths to character JSON files",
			})
			.parseSync();
	} catch (error) {
		console.error("Error parsing arguments:", error);
		return {};
	}
}

// Character loading from files
export async function loadCharacters(
	charactersArg: string,
): Promise<Character[]> {
	let characterPaths = charactersArg?.split(",").map((filePath) => {
		if (path.basename(filePath) === filePath) {
			filePath = "../characters/" + filePath;
		}
		return path.resolve(process.cwd(), filePath.trim());
	});

	const loadedCharacters = [];

	if (characterPaths?.length > 0) {
		for (const path of characterPaths) {
			try {
				const character = JSON.parse(fs.readFileSync(path, "utf8"));
				validateCharacterConfig(character);
				loadedCharacters.push(character);
			} catch (e) {
				console.error(`Error loading character from ${path}: ${e}`);
				process.exit(1);
			}
		}
	}

	if (loadedCharacters.length === 0) {
		console.log("No characters found, using default character");
		loadedCharacters.push(defaultCharacter);
	}

	return loadedCharacters;
}

// Token management
export function getTokenForProvider(
	provider: ModelProviderName,
	character: Character,
) {
	switch (provider) {
		case ModelProviderName.OPENAI:
			return (
				character.settings?.secrets?.OPENAI_API_KEY || settings.OPENAI_API_KEY
			);
		case ModelProviderName.LLAMACLOUD:
			return (
				character.settings?.secrets?.LLAMACLOUD_API_KEY ||
				settings.LLAMACLOUD_API_KEY ||
				character.settings?.secrets?.TOGETHER_API_KEY ||
				settings.TOGETHER_API_KEY ||
				character.settings?.secrets?.XAI_API_KEY ||
				settings.XAI_API_KEY ||
				character.settings?.secrets?.OPENAI_API_KEY ||
				settings.OPENAI_API_KEY
			);
		case ModelProviderName.ANTHROPIC:
			return (
				character.settings?.secrets?.ANTHROPIC_API_KEY ||
				character.settings?.secrets?.CLAUDE_API_KEY ||
				settings.ANTHROPIC_API_KEY ||
				settings.CLAUDE_API_KEY
			);
		case ModelProviderName.REDPILL:
			return (
				character.settings?.secrets?.REDPILL_API_KEY || settings.REDPILL_API_KEY
			);
		case ModelProviderName.OPENROUTER:
			return (
				character.settings?.secrets?.OPENROUTER || settings.OPENROUTER_API_KEY
			);
		case ModelProviderName.GROK:
			return character.settings?.secrets?.GROK_API_KEY || settings.GROK_API_KEY;
		case ModelProviderName.HEURIST:
			return (
				character.settings?.secrets?.HEURIST_API_KEY || settings.HEURIST_API_KEY
			);
		case ModelProviderName.GROQ:
			return character.settings?.secrets?.GROQ_API_KEY || settings.GROQ_API_KEY;
	}
}

// Database initialization
function initializeDatabase(dataDir: string) {
	if (process.env.POSTGRES_URL) {
		return new PostgresDatabaseAdapter({
			connectionString: process.env.POSTGRES_URL,
		});
	} else {
		const filePath =
			process.env.SQLITE_FILE ?? path.resolve(dataDir, "db.sqlite");
		return new SqliteDatabaseAdapter(new Database(filePath));
	}
}

// Client initialization
export async function initializeClients(
	character: Character,
	runtime: IAgentRuntime,
) {
	const clients = [];
	const clientTypes = character.clients?.map((str) => str.toLowerCase()) || [];

	if (clientTypes.includes("auto")) {
		const autoClient = await AutoClientInterface.start(runtime);
		if (autoClient) clients.push(autoClient);
	}

	if (clientTypes.includes("discord")) {
		clients.push(await DiscordClientInterface.start(runtime));
	}

	if (clientTypes.includes("telegram")) {
		const telegramClient = await TelegramClientInterface.start(runtime);
		if (telegramClient) clients.push(telegramClient);
	}

	if (clientTypes.includes("twitter")) {
		const twitterClients = await TwitterClientInterface.start(runtime);
		clients.push(twitterClients);
	}

	if (character.plugins?.length > 0) {
		for (const plugin of character.plugins) {
			if (plugin.clients) {
				for (const client of plugin.clients) {
					clients.push(await client.start(runtime));
				}
			}
		}
	}

	return clients;
}

// Agent creation
export function createAgent(
	character: Character,
	db: IDatabaseAdapter,
	cache: ICacheManager,
	token: string,
) {
	elizaLogger.success(
		elizaLogger.successesTitle,
		"Creating runtime for character",
		character.name,
	);
	return new AgentRuntime({
		databaseAdapter: db,
		token,
		modelProvider: character.modelProvider,
		evaluators: [],
		character,
		plugins: [
			bootstrapPlugin,
			nodePlugin,
			character.settings.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
		].filter(Boolean),
		providers: [],
		actions: [],
		services: [],
		managers: [],
		cacheManager: cache,
	});
}

// Cache initialization
function intializeDbCache(character: Character, db: IDatabaseCacheAdapter) {
	return new CacheManager(new DbCacheAdapter(db, character.id));
}

// Character initialization
async function loadAndTrackCharacter(character: Character) {
	try {
		character.id ??= stringToUuid(character.name);
		character.username ??= character.name;

		const token = getTokenForProvider(character.modelProvider, character);
		const dataDir = path.join(__dirname, "../data");

		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}

		const db = initializeDatabase(dataDir);
		await db.init();

		const cache = intializeDbCache(character, db);
		const runtime = createAgent(character, db, cache, token);

		await runtime.initialize();
		await initializeClients(character, runtime);

		directClient.registerAgent(runtime);

		loadedCharacters.set(character.name, character);
		characterRuntimes.set(character.name, runtime);

		return true;
	} catch (error) {
		elizaLogger.error(`Error loading character ${character.name}:`, error);
		return false;
	}
}

// URL character loading
async function fetchCharacterFromUrl(url: string): Promise<Character> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		throw new Error(`Failed to fetch character from ${url}: ${error.message}`);
	}
}

// API Endpoints
app.get("/characters", (req, res) => {
	const characterList = Array.from(loadedCharacters.values()).map((char) => ({
		id: char.id,
		name: char.name,
		username: char.username,
		modelProvider: char.modelProvider,
		clients: char.clients || [],
	}));

	res.json({
		count: characterList.length,
		characters: characterList,
	});
});

app.get("/characters/:characterId", (req, res) => {
	const character = loadedCharacters.get(req.params.characterId);

	if (!character) {
		return res.status(404).json({
			success: false,
			error: "Character not found",
		});
	}

	res.json({
		success: true,
		character: {
			id: character.id,
			name: character.name,
			username: character.username,
			modelProvider: character.modelProvider,
			clients: character.clients || [],
		},
	});
});

app.post("/add-character-from-url", async (req, res) => {
	const { url } = req.body;

	if (!url) {
		return res.status(400).json({
			success: false,
			error: "URL is required",
		});
	}

	try {
		const characterConfig = await fetchCharacterFromUrl(url);
		validateCharacterConfig(characterConfig);
		await loadAndTrackCharacter(characterConfig);

		res.json({
			success: true,
			message: `Character ${characterConfig.name} loaded successfully from ${url}`,
		});
	} catch (error) {
		elizaLogger.error(`Error loading character from URL:`, error);
		res.status(400).json({
			success: false,
			error: error.message,
		});
	}
});

app.post("/add-characters-from-urls", async (req, res) => {
	const { urls } = req.body;

	if (!Array.isArray(urls)) {
		return res.status(400).json({
			success: false,
			error: "URLs must be provided as an array",
		});
	}

	const results = [];

	for (const url of urls) {
		try {
			const characterConfig = await fetchCharacterFromUrl(url);
			validateCharacterConfig(characterConfig);
			await loadAndTrackCharacter(characterConfig);

			results.push({
				url,
				success: true,
				message: `Character ${characterConfig.name} loaded successfully`,
			});
		} catch (error) {
			results.push({
				url,
				success: false,
				error: error.message,
			});
		}
	}

	res.json({ results });
});

// Replace the chat endpoint with this corrected version
app.post("/chat/:characterId", async (req, res) => {
	const { characterId } = req.params;
	const { message, userId = "user", userName = "User" } = req.body;

	if (!message) {
		return res.status(400).json({
			success: false,
			error: "Message is required",
		});
	}

	if (!loadedCharacters.has(characterId)) {
		return res.status(404).json({
			success: false,
			error: `Character ${characterId} not found`,
		});
	}

	try {
		const serverPort = parseInt(settings.SERVER_PORT || "3000");

		const response = await fetch(
			`http://localhost:${serverPort}/${characterId}/message`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: message,
					userId,
					userName,
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		res.json({
			success: true,
			messages: data,
		});
	} catch (error) {
		elizaLogger.error(`Error in chat:`, error);
		res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}); // Server initialization
async function startServer() {
	try {
		directClient = await DirectClientInterface.start();

		if (loadedCharacters.size === 0) {
			await loadAndTrackCharacter(defaultCharacter);
		}

		const apiPort = parseInt(process.env.API_PORT || "3001");
		app.listen(apiPort, () => {
			elizaLogger.success("API server running on port", apiPort.toString());
			elizaLogger.log("Available endpoints:");
			elizaLogger.log("- GET /characters : List all characters");
			elizaLogger.log("- GET /characters/:characterId : Get character details");
			elizaLogger.log(
				"- POST /add-character-from-url : Add character from URL",
			);
			elizaLogger.log(
				"- POST /add-characters-from-urls : Add multiple characters",
			);
			elizaLogger.log("- POST /chat/:characterId : Chat with a character");
		});
	} catch (error) {
		elizaLogger.error("Failed to start server:", error);
		process.exit(1);
	}
}

// Start the server
startServer().catch((error) => {
	elizaLogger.error("Unhandled error in startServer:", error);
	process.exit(1);
});
