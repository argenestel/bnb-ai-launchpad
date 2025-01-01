// services/conversationHandler.js
import { ChatOpenAI } from "@langchain/openai";
import db from "../db/database.js";
import memoryManager from "./memoryManager.js";
import { loadCharacter } from "./characterManager.js";

class ConversationHandler {
	constructor() {
		this.model = new ChatOpenAI({
			temperature: 0.7,
			azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
			azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
			azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
			azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
		});
	}

	generateSystemPrompt(character, memories) {
		const basePrompt = `You are ${character.name}. ${character.description}

Key traits and characteristics:
${Object.entries(character.traits || {})
	.map(([trait, desc]) => `- ${trait}: ${desc}`)
	.join("\n")}`;

		const memoryPrompt = memoryManager.generateMemoryPrompt(memories);

		return `${basePrompt}

${memoryPrompt}




You must stay in character at all times and respond as ${character.name} would, based on the above description, traits, and memories.
Never break character or acknowledge that you are an AI.`;
	}

	async handleConversation(
		userId,
		characterName,
		message,
		conversationId = null,
	) {
		try {
			// Ensure user exists
			await db.createUser(userId);

			// Get or create conversation
			if (!conversationId) {
				conversationId = await db.createConversation(userId, characterName);
			}

			// Load character data
			const character = await loadCharacter(characterName);

			// Get relevant memories
			const memories = await memoryManager.getRelevantMemories(
				userId,
				characterName,
			);

			// Get conversation history
			const history = await db.getConversationHistory(userId, characterName);

			// Prepare messages for the model
			const messages = [
				{
					role: "system",
					content: this.generateSystemPrompt(character, memories),
				},
				...history,
				{ role: "user", content: message },
			];

			// Generate response
			const response = await this.model.invoke(messages);

			// Store messages in database
			await db.addMessage(conversationId, "user", message);
			await db.addMessage(conversationId, "assistant", response.content);

			// Process conversation for memory extraction
			await memoryManager.processConversation(userId, characterName, [
				{ role: "user", content: message },
				{ role: "assistant", content: response.content },
			]);

			return {
				success: true,
				message: response.content,
				character: characterName,
				conversationId,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error("Conversation handling error:", error);
			throw error;
		}
	}
}

export default new ConversationHandler();
