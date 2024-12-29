// routes/chatRoutes.js
import express from "express";
import conversationHandler from "../services/conversationHandler.js";
import db from "../db/database.js";
import memoryManager from "../services/memoryManager.js";

const router = express.Router();

// Chat endpoint
router.post("/:characterName", async (req, res) => {
	try {
		const { characterName } = req.params;
		const { message, userId, conversationId } = req.body;

		if (!message) {
			return res.status(400).json({ error: "Message is required" });
		}

		if (!userId) {
			return res.status(400).json({ error: "User ID is required" });
		}

		const response = await conversationHandler.handleConversation(
			userId,
			characterName,
			message,
			conversationId,
		);

		res.json(response);
	} catch (error) {
		console.error("Chat error:", error);
		res.status(error.message === "Character not found" ? 404 : 500).json({
			error: error.message || "Internal server error",
		});
	}
});

// Get conversation history
router.get("/history/:userId/:characterName", async (req, res) => {
	try {
		const { userId, characterName } = req.params;
		const { limit } = req.query;

		const history = await db.getConversationHistory(
			userId,
			characterName,
			limit ? parseInt(limit) : 10,
		);

		res.json({
			success: true,
			history,
		});
	} catch (error) {
		console.error("Error fetching history:", error);
		res.status(500).json({
			error: "Failed to fetch conversation history",
			details: error.message,
		});
	}
});

// Get character memories
router.get("/memories/:userId/:characterName", async (req, res) => {
	try {
		const { userId, characterName } = req.params;
		const memories = await memoryManager.getRelevantMemories(
			userId,
			characterName,
		);

		res.json({
			success: true,
			memories,
		});
	} catch (error) {
		console.error("Error fetching memories:", error);
		res.status(500).json({
			error: "Failed to fetch character memories",
			details: error.message,
		});
	}
});

// Start new conversation
router.post("/start/:characterName", async (req, res) => {
	try {
		const { characterName } = req.params;
		const { userId } = req.body;

		if (!userId) {
			return res.status(400).json({ error: "User ID is required" });
		}

		await db.createUser(userId);
		const conversationId = await db.createConversation(userId, characterName);

		res.json({
			success: true,
			conversationId,
			characterName,
			userId,
		});
	} catch (error) {
		console.error("Error starting conversation:", error);
		res.status(500).json({
			error: "Failed to start conversation",
			details: error.message,
		});
	}
});

export default router;
