// characterTypes.ts
import { Bot, Users, Gamepad2 } from "lucide-react";
import { TypeInfo } from "@/types";

export const CHARACTER_TYPES: Record<string, TypeInfo> = {
	ai_companion: {
		title: "AI Companion",
		description:
			"Create a personal AI companion that can engage in meaningful conversations",
		icon: Bot,
		defaultTraits: ["Empathetic", "Supportive", "Knowledgeable"],
		tokenPrefix: "COMP",
		suggestedFields: [
			{
				name: "learningStyle",
				label: "Learning Style",
				type: "select",
				options: ["Adaptive", "Structured", "Experience-based"],
			},
			{
				name: "interactionStyle",
				label: "Interaction Style",
				type: "select",
				options: ["Friendly", "Professional", "Casual", "Formal"],
			},
		],
	},
	influencer: {
		title: "Digital Influencer",
		description:
			"Design a digital personality for social media and content creation",
		icon: Users,
		defaultTraits: ["Creative", "Engaging", "Trendsetter"],
		tokenPrefix: "INFL",
		suggestedFields: [
			{
				name: "contentType",
				label: "Content Type",
				type: "select",
				options: ["Lifestyle", "Tech", "Fashion", "Gaming", "Education"],
			},
			{
				name: "platform",
				label: "Primary Platform",
				type: "select",
				options: ["Twitter", "Instagram", "YouTube", "TikTok"],
			},
		],
	},
	game_character: {
		title: "Game Character",
		description: "Create an interactive character for gaming experiences",
		icon: Gamepad2,
		defaultTraits: ["Strategic", "Competitive", "Adventurous"],
		tokenPrefix: "GAME",
		suggestedFields: [
			{
				name: "gameRole",
				label: "Game Role",
				type: "select",
				options: ["Support", "Tank", "DPS", "Strategy"],
			},
			{
				name: "gameGenre",
				label: "Game Genre",
				type: "select",
				options: ["RPG", "Strategy", "Action", "Adventure"],
			},
		],
	},
};
