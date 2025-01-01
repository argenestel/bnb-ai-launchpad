import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db/database.js";
import { gameAgentSystemPrompt } from "../prompts/gameAgentPrompt.js";
import { model } from "../config/ai.js";
import CharacterStorage from "./storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateGameAgent(input) {
    try {
        // Validate input
        if (!input || typeof input !== 'object') {
            throw new Error("Invalid input: must be an object");
        }

        const { theme, goal, antagonist } = input;
        
        // Validate required fields
        if (!theme || !goal || !antagonist) {
            throw new Error("Missing required fields: theme, goal, and antagonist are required");
        }

        // Generate game agent profile
        const chat = await model.invoke([
            { 
                role: "system", 
                content: gameAgentSystemPrompt 
            },
            {
                role: "user",
                content: JSON.stringify({ theme, goal, antagonist })
            }
        ]);

        console.log("Model response:", chat.content);

        // Clean and parse response
        const cleanContent = chat.content
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

        let gameProfile;
        try {
            gameProfile = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error("Parse error:", parseError);
            console.error("Attempted to parse:", cleanContent);
            throw new Error("Invalid response format from model");
        }

        // Add input data to game profile BEFORE initializing memories
        const completeGameProfile = {
            ...gameProfile,
            theme,
            goal,
            antagonist,
            gameplay: {
                available_actions: [],
                item_combinations: [],
                core_mechanics: [],
                quick_wins: [],
                hidden_elements: []
            },
            victory: {
                main_condition: goal,
                alternate_paths: [],
                bonus_achievements: [],
                failure_states: []
            },
            time_mechanics: {
                total_time: "5 minutes",
                key_moments: [],
                pressure_elements: []
            }
        };

        // Store game-specific memories with complete profile
        await initializeGameMemories(completeGameProfile);

        return completeGameProfile;
    } catch (error) {
        console.error("Error generating game agent:", error);
        throw error;
    }
}

async function initializeGameMemories(gameProfile) {
    try {
        // Store base game information
        await db.storeMemory(
            gameProfile.name,
            "game",
            "initial_description",
            gameProfile.description,
            1.0
        );

        // Store world information
        if (gameProfile.world) {
            await db.storeMemory(
                gameProfile.name,
                "game",
                "world_description",
                gameProfile.world.description,
                1.0
            );

            await db.storeMemory(
                gameProfile.name,
                "game",
                "atmosphere",
                gameProfile.world.atmosphere,
                0.9
            );

            // Store locations
            if (gameProfile.world.locations) {
                for (const location of gameProfile.world.locations) {
                    await db.storeMemory(
                        gameProfile.name,
                        "game",
                        `location_${location.name}`,
                        JSON.stringify(location),
                        0.8
                    );
                }
            }
        }

        // Store game details
        const gameDetails = {
            theme: gameProfile.theme,
            goal: gameProfile.goal,
            antagonist: gameProfile.antagonist
        };

        await db.storeMemory(
            gameProfile.name,
            "game",
            "game_details",
            JSON.stringify(gameDetails),
            1.0
        );

        // Store gameplay mechanics if they exist
        if (gameProfile.gameplay) {
            await db.storeMemory(
                gameProfile.name,
                "game",
                "gameplay_mechanics",
                JSON.stringify(gameProfile.gameplay),
                1.0
            );
        }

        // Store victory conditions if they exist
        if (gameProfile.victory) {
            await db.storeMemory(
                gameProfile.name,
                "game",
                "victory_conditions",
                JSON.stringify(gameProfile.victory),
                1.0
            );
        }

    } catch (error) {
        console.error("Error initializing game memories:", error);
        throw error;
    }
}

export async function loadGameAgent(agentName) {
    try {
        const generatedDir = path.join(process.cwd(), "generated");
        const files = await fs.readdir(generatedDir);

        // Find the latest version of the game agent file
        const agentFile = files
            .filter(file => 
                file.toLowerCase().startsWith(agentName.toLowerCase() + "_game_") && 
                file.endsWith(".json")
            )
            .sort()
            .reverse()[0];

        if (!agentFile) {
            throw new Error("Game agent not found");
        }

        const content = await fs.readFile(
            path.join(generatedDir, agentFile),
            "utf8"
        );
        const agent = JSON.parse(content);

        // Load game memories
        const memories = await db.getMemories(agentName, "game");

        return {
            ...agent,
            memories
        };
    } catch (error) {
        console.error("Error loading game agent:", error);
        throw error;
    }
}

export async function validateGameAgentExists(agentName) {
    try {
        const generatedDir = path.join(process.cwd(), "generated");
        const files = await fs.readdir(generatedDir);

        const agentFiles = files.filter(
            file =>
                file.toLowerCase().startsWith(agentName.toLowerCase() + "_game_") &&
                file.endsWith(".json")
        );

        return agentFiles.length > 0;
    } catch (error) {
        console.error("Error validating game agent:", error);
        return false;
    }
}

export async function updateGameState(agentName, updates) {
    try {
        for (const [key, value] of Object.entries(updates)) {
            await db.storeMemory(
                agentName,
                "game",
                `state_${key}`,
                value,
                1.0
            );
        }
    } catch (error) {
        console.error("Error updating game state:", error);
        throw error;
    }
}

export async function saveGameAsCharacter(gameProfile) {
    try {
        // Convert game profile to character format
        const characterData = {
            name: gameProfile.name,
            description: gameProfile.world?.description || gameProfile.theme,
            type: "game_character",
            theme: gameProfile.theme,
            goal: gameProfile.goal,
            antagonist: gameProfile.antagonist,
            token: gameProfile.token,
            settings: {
                ...gameProfile.settings,
                isGame: true,
                gameDetails: {
                    theme: gameProfile.theme,
                    goal: gameProfile.goal,
                    antagonist: gameProfile.antagonist,
                    world: gameProfile.world,
                    characters: gameProfile.characters,
                    gameplay: gameProfile.gameplay,
                    victory: gameProfile.victory,
                    time_mechanics: gameProfile.time_mechanics
                }
            }
        };

        // Store in character storage
        const storage = new CharacterStorage();
        await storage.storeCharacter(characterData);

        // Also store game-specific memories
        await db.storeMemory(
            gameProfile.name,
            "game",
            "world_description",
            gameProfile.world.description,
            1.0
        );

        await db.storeMemory(
            gameProfile.name,
            "game",
            "gameplay_mechanics",
            JSON.stringify(gameProfile.gameplay),
            1.0
        );

        await db.storeMemory(
            gameProfile.name,
            "game",
            "victory_conditions",
            JSON.stringify(gameProfile.victory),
            1.0
        );

        return characterData;
    } catch (error) {
        console.error("Error saving game as character:", error);
        throw error;
    }
}

export default {
    generateGameAgent,
    loadGameAgent,
    validateGameAgentExists,
    updateGameState,
    saveGameAsCharacter
}; 