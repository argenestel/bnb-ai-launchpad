import express from 'express';
import {
    generateGameAgent,
    loadGameAgent,
    validateGameAgentExists,
    updateGameState,
    saveGameAsCharacter
} from '../services/gameAgentManager.js';

const router = express.Router();

// Generate a new game agent
router.post('/generate', async (req, res) => {
    try {
        const { theme, goal, antagonist, ...otherParams } = req.body;

        // Validate required fields
        if (!theme || !goal || !antagonist) {
            return res.status(400).json({
                error: "Theme, goal, and antagonist are required"
            });
        }

        // Generate game agent profile
        const gameProfile = await generateGameAgent({
            theme,
            goal,
            antagonist,
            ...otherParams
        });

        // Save the game as a character
        const savedCharacter = await saveGameAsCharacter(gameProfile);

        res.json({
            success: true,
            data: savedCharacter
        });
    } catch (error) {
        console.error("Game agent generation error:", error);
        res.status(500).json({
            error: "Failed to generate game agent",
            details: error.message
        });
    }
});

// Get game agent by name
router.get('/:name', async (req, res) => {
    try {
        const agentName = req.params.name;
        
        // Check if agent exists
        const exists = await validateGameAgentExists(agentName);
        if (!exists) {
            return res.status(404).json({
                error: "Game agent not found"
            });
        }

        // Load game agent
        const agent = await loadGameAgent(agentName);

        res.json({
            success: true,
            data: agent
        });
    } catch (error) {
        console.error("Error loading game agent:", error);
        res.status(500).json({
            error: "Failed to load game agent",
            details: error.message
        });
    }
});

// Update game state
router.post('/:name/state', async (req, res) => {
    try {
        const { name } = req.params;
        const updates = req.body;

        // Validate agent exists
        const exists = await validateGameAgentExists(name);
        if (!exists) {
            return res.status(404).json({
                error: "Game agent not found"
            });
        }

        // Update game state
        await updateGameState(name, updates);

        res.json({
            success: true,
            message: "Game state updated successfully"
        });
    } catch (error) {
        console.error("Error updating game state:", error);
        res.status(500).json({
            error: "Failed to update game state",
            details: error.message
        });
    }
});

// List all game agents
router.get('/', async (req, res) => {
    try {
        const generatedDir = path.join(process.cwd(), "generated");
        
        // Create directory if it doesn't exist
        try {
            await fs.access(generatedDir);
        } catch {
            await fs.mkdir(generatedDir, { recursive: true });
            return res.json({ agents: [] });
        }

        // Read all game agent files
        const files = await fs.readdir(generatedDir);
        const agents = await Promise.all(
            files
                .filter(file => file.includes("_game_") && file.endsWith(".json"))
                .map(async (file) => {
                    try {
                        const content = await fs.readFile(
                            path.join(generatedDir, file),
                            "utf8"
                        );
                        const agent = JSON.parse(content);
                        return {
                            ...agent,
                            filename: file
                        };
                    } catch (error) {
                        console.error(`Error reading file ${file}:`, error);
                        return null;
                    }
                })
        );

        // Filter out failed reads
        const validAgents = agents.filter(agent => agent !== null);

        res.json({
            success: true,
            count: validAgents.length,
            agents: validAgents
        });
    } catch (error) {
        console.error("Error listing game agents:", error);
        res.status(500).json({
            error: "Failed to list game agents",
            details: error.message
        });
    }
});

export default router; 