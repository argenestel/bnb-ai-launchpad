// types.ts
export type VoiceModel =
	| "en_US-male-medium"
	| "en_US-female-medium"
	| "en_US-neutral-medium";
export type ModelProvider = "openai" | "anthropic" | "llama_local";
export type ResponseStyle = "balanced" | "concise" | "detailed";

export interface Voice {
	model: VoiceModel;
	speed: number;
	pitch: number;
}

export interface Settings {
	allowMultimodal: boolean;
	memoryEnabled: boolean;
	responseStyle: ResponseStyle;
}

export interface CharacterData {
	name: string;
	description: string;
	background: string;
	modelProvider: ModelProvider;
	traits: string[];
	voice: Voice;
	settings: Settings;
}

export interface Message {
	role: "user" | "assistant";
	content: string;
}

export interface BuildStage {
	stage: string;
	status: "pending" | "running" | "success" | "error";
	logs?: string[];
}

export interface TerminalLog {
	type: "error" | "success" | "input" | "info" | "system";
	content: string;
}
export type CharacterType = "ai_companion" | "influencer" | "game_character";

export interface TokenData {
	address: string;
	name: string;
	symbol: string;
	imageUrl: string;
	description: string;
	transactionHash?: string;
}
export interface TypeInfo {
	title: string;
	description: string;
	icon: any;
	defaultTraits: string[];
	tokenPrefix: string;
	suggestedFields: {
		name: string;
		label: string;
		type: string;
		options?: string[];
		placeholder?: string;
	}[];
}

export interface CharacterData {
	name: string;
	description: string;
	background: string;
	ModelProvider: string;
	traits: string[];
	token?: TokenData;
	Voice: {
		model: string;
		speed: number;
		pitch: number;
	};
	Settings: {
		allowMultimodal: boolean;
		memoryEnabled: boolean;
		responseStyle: string;
	};
}
