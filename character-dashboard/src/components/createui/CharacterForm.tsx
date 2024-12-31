//@ts-nocheck
import React from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, Wand2 } from "lucide-react";
import { CharacterData, ModelProvider, VoiceModel } from "@/types";
import { Separator } from "@/components/ui/separator";
interface CharacterFormProps {
	characterData: CharacterData;
	onInputChange: (field: keyof CharacterData, value: any) => void;
	onNestedChange: (
		parent: keyof CharacterData,
		field: string,
		value: any,
	) => void;
	onGenerate: () => Promise<void>;
	onCreate: () => Promise<void>;
	loading: boolean;
}

const CharacterForm: React.FC<CharacterFormProps> = ({
	characterData,
	onInputChange,
	onNestedChange,
	onGenerate,
	onCreate,
	loading,
}) => {
	const handleAddTrait = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			const trait = e.currentTarget.value.trim();
			if (trait && !characterData.traits.includes(trait)) {
				onInputChange("traits", [...characterData.traits, trait]);
				e.currentTarget.value = "";
			}
		}
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div className="lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>Enter your character's details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-xl border-gray-800 border p-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={characterData.name}
									onChange={(e) => onInputChange("name", e.target.value)}
									placeholder="Enter character name"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={characterData.description}
									onChange={(e) => onInputChange("description", e.target.value)}
									placeholder="Describe your character"
									rows={4}
								/>
							</div>
						</div>
						<div className="mt-2"></div>

						<div className="space-y-2">
							<Label htmlFor="background">Background Story</Label>
							<Textarea
								id="background"
								value={characterData.background}
								onChange={(e) => onInputChange("background", e.target.value)}
								placeholder="Character's background story"
								rows={4}
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Model Provider</Label>
								<Select
									value={characterData.modelProvider}
									onValueChange={(value: ModelProvider) =>
										onInputChange("modelProvider", value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select model provider" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="openai">OpenAI</SelectItem>
										<SelectItem value="anthropic">Anthropic</SelectItem>
										<SelectItem value="llama_local">Llama (Local)</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Voice Model</Label>
								<Select
									value={characterData.voice.model}
									onValueChange={(value: VoiceModel) =>
										onNestedChange("voice", "model", value)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select voice model" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="en_US-male-medium">Male (US)</SelectItem>
										<SelectItem value="en_US-female-medium">
											Female (US)
										</SelectItem>
										<SelectItem value="en_US-neutral-medium">
											Neutral (US)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Character Traits</Label>
							<div className="flex flex-wrap gap-2 mb-2">
								{characterData.traits.map((trait) => (
									<Badge
										key={trait}
										variant="secondary"
										className="cursor-pointer"
										onClick={() =>
											onInputChange(
												"traits",
												characterData.traits.filter((t) => t !== trait),
											)
										}
									>
										{trait} ×
									</Badge>
								))}
							</div>
							<Input
								placeholder="Add trait and press Enter"
								onKeyPress={handleAddTrait}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Memory</Label>
								<p className="text-sm text-muted-foreground">
									Enable conversation memory
								</p>
							</div>
							<Switch
								checked={characterData.settings.memoryEnabled}
								onCheckedChange={(checked) =>
									onNestedChange("settings", "memoryEnabled", checked)
								}
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="lg:col-span-1 space-y-6">
				<Card>
					<CardContent className="pt-6 space-y-4">
						<Button className="w-full" onClick={onGenerate} disabled={loading}>
							{loading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Generating...
								</>
							) : (
								<>
									<Wand2 className="w-4 h-4 mr-2" />
									Auto-Generate
								</>
							)}
						</Button>
						<Button
							className="w-full"
							variant="default"
							onClick={onCreate}
							disabled={!characterData.name || !characterData.description}
						>
							<Bot className="w-4 h-4 mr-2" />
							Create Character
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Configuration Summary</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Model Configuration</Label>
							<div className="text-sm text-muted-foreground">
								Provider: {characterData.modelProvider}
								<br />
								Voice: {characterData.voice.model}
								<br />
								Memory:{" "}
								{characterData.settings.memoryEnabled ? "Enabled" : "Disabled"}
							</div>
						</div>
						<div className="space-y-2">
							<Label>Character Traits</Label>
							<div className="flex flex-wrap gap-2">
								{characterData.traits.map((trait) => (
									<Badge key={trait} variant="secondary">
										{trait}
									</Badge>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default CharacterForm;
