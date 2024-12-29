// services/memoryManager.js
import db from "../db/database.js";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config();
class MemoryManager {
	constructor() {
		this.model = new ChatOpenAI({
			temperature: 0.7,
			azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
			azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
			azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
			azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
		});

		this.memoryExtractionTemplate = PromptTemplate.fromTemplate(`
            From the following conversation, extract key information that would be important 
            to remember for future interactions. Focus on personal details, preferences, 
            and significant events.

            Conversation:
            {conversation}

            Extract 2-3 key memories in the following format:
            - Memory: [the memory]
            - Importance (0.0-1.0): [importance score]
            - Type: [personal_detail/preference/event]
        `);
	}

	async processConversation(userId, characterName, messages) {
		try {
			// Extract memories from conversation
			const conversationText = messages
				.map((msg) => `${msg.role}: ${msg.content}`)
				.join("\n");

			const extractionPrompt = await this.memoryExtractionTemplate.format({
				conversation: conversationText,
			});

			const response = await this.model.invoke([
				{ role: "user", content: extractionPrompt },
			]);

			// Parse and store extracted memories
			const memories = this.parseMemories(response.content);
			for (const memory of memories) {
				await db.storeMemory(
					characterName,
					userId,
					memory.type,
					memory.content,
					memory.importance,
				);
			}

			return memories;
		} catch (error) {
			console.error("Error processing conversation memories:", error);
			throw error;
		}
	}

	parseMemories(extractionResult) {
		const memories = [];
		const lines = extractionResult.split("\n");
		let currentMemory = {};

		for (const line of lines) {
			if (line.startsWith("- Memory:")) {
				if (Object.keys(currentMemory).length > 0) {
					memories.push(currentMemory);
				}
				currentMemory = {
					content: line.replace("- Memory:", "").trim(),
				};
			} else if (line.startsWith("- Importance:")) {
				const importance = parseFloat(line.replace("- Importance:", "").trim());
				currentMemory.importance = isNaN(importance) ? 0.5 : importance;
			} else if (line.startsWith("- Type:")) {
				currentMemory.type = line.replace("- Type:", "").trim().toLowerCase();
			}
		}

		if (Object.keys(currentMemory).length > 0) {
			memories.push(currentMemory);
		}

		return memories;
	}

	async getRelevantMemories(userId, characterName) {
		return await db.getMemories(characterName, userId);
	}

	generateMemoryPrompt(memories) {
		if (!memories || memories.length === 0) {
			return "";
		}

		const memoryText = memories
			.map((memory) => `- ${memory.content} (${memory.memory_type})`)
			.join("\n");

		return `
            Previous interactions have revealed:
            ${memoryText}
            
            Use this context naturally in your responses when relevant.
        `;
	}
}

export default new MemoryManager();
