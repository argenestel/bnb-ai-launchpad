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

        // Define valid memory types
        this.validMemoryTypes = ['personal_detail', 'preference', 'event', 'fact', 'conversation'];
        
        this.memoryExtractionTemplate = PromptTemplate.fromTemplate(`
            From the following conversation, extract key information that would be important 
            to remember for future interactions. Focus on personal details, preferences, 
            and significant events.

            Memory types must be one of: personal_detail, preference, event, fact, conversation

            Conversation:
            {conversation}

            Extract 2-3 key memories in the following format:
            - Memory: [the memory]
            - Importance (0.0-1.0): [importance score]
            - Type: [memory type from the list above]
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
            
            // Only store valid memories
            for (const memory of memories) {
                if (this.validateMemory(memory)) {
                    await db.storeMemory(
                        characterName,
                        userId,
                        memory.type,
                        memory.content,
                        memory.importance
                    );
                }
            }

            return memories;
        } catch (error) {
            console.error("Error processing conversation memories:", error);
            throw error;
        }
    }

    validateMemory(memory) {
        // Check if all required fields are present and valid
        if (!memory.content || typeof memory.content !== 'string') {
            console.warn('Invalid memory content:', memory);
            return false;
        }

        if (!memory.type || !this.validMemoryTypes.includes(memory.type)) {
            console.warn('Invalid memory type:', memory);
            return false;
        }

        if (typeof memory.importance !== 'number' || 
            memory.importance < 0 || 
            memory.importance > 1) {
            memory.importance = 0.5; // Set default importance if invalid
        }

        return true;
    }

    parseMemories(extractionResult) {
        const memories = [];
        const lines = extractionResult.split("\n");
        let currentMemory = {};

        for (const line of lines) {
            if (line.startsWith("- Memory:")) {
                if (Object.keys(currentMemory).length > 0) {
                    memories.push({ ...currentMemory }); // Create a new object
                }
                currentMemory = {
                    content: line.replace("- Memory:", "").trim(),
                    type: 'conversation', // Default type
                    importance: 0.5 // Default importance
                };
            } else if (line.startsWith("- Importance:")) {
                const importance = parseFloat(
                    line.replace("- Importance:", "").trim()
                );
                currentMemory.importance = isNaN(importance) ? 0.5 : Math.min(1, Math.max(0, importance));
            } else if (line.startsWith("- Type:")) {
                const type = line.replace("- Type:", "").trim().toLowerCase();
                currentMemory.type = this.validMemoryTypes.includes(type) ? type : 'conversation';
            }
        }

        // Don't forget the last memory
        if (Object.keys(currentMemory).length > 0) {
            memories.push({ ...currentMemory });
        }

        return memories.filter(memory => this.validateMemory(memory));
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
