import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Azure OpenAI chat model
export const model = new ChatOpenAI({
    temperature: 0.9,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
});

// Validation schemas for optional parameters
export const validModelProviders = ["openai", "anthropic", "llama_local"];
export const validVoiceModels = [
    "en_US-male-medium",
    "en_US-female-medium",
    "en_US-neutral-medium",
];
export const validClients = ["discord", "direct", "twitter", "telegram", "farcaster"];

// Parameter validation function
export function validateParameters(params) {
    const errors = [];

    if (params.modelProvider && !validModelProviders.includes(params.modelProvider)) {
        errors.push(`Invalid modelProvider. Must be one of: ${validModelProviders.join(", ")}`);
    }

    if (params.clients) {
        const invalidClients = params.clients.filter(
            (client) => !validClients.includes(client)
        );
        if (invalidClients.length > 0) {
            errors.push(
                `Invalid clients: ${invalidClients.join(", ")}. Valid options are: ${validClients.join(", ")}`
            );
        }
    }

    if (params.settings?.voice?.model && !validVoiceModels.includes(params.settings.voice.model)) {
        errors.push(`Invalid voice model. Must be one of: ${validVoiceModels.join(", ")}`);
    }

    return errors;
}

export default {
    model,
    validateParameters,
    validModelProviders,
    validVoiceModels,
    validClients
}; 