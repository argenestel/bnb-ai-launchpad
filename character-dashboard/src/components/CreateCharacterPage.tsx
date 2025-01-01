//@ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FormInput, MessageSquare, Coins } from "lucide-react";
import CharacterForm from "./createui/CharacterForm";
import ChatInterface from "./createui/ChatInterface";
import TerminalComponent from "./createui/TerminalComponent";
import { BuildStage, CharacterData, Message, TerminalLog } from "@/types";
import { TokenCreationForm } from "./createui/TokenCreationForm";
import { TokenData } from "@/types";
import Navbar from "@/components/Navbar";
type CreationStep = "name" | "description" | "confirm" | "customize";

const CreateCharacterPage: React.FC = () => {
	const navigate = useNavigate();

	// Character Data State
	const [characterData, setCharacterData] = useState<CharacterData>({
		name: "",
		description: "",
		background: "",
		modelProvider: "openai",
		traits: [],
		voice: {
			model: "en_US-neutral-medium",
			speed: 1.0,
			pitch: 1.0,
		},
		settings: {
			allowMultimodal: false,
			memoryEnabled: true,
			responseStyle: "balanced",
		},
	});

	const handleTokenCreated = (tokenData: TokenData) => {
		setCharacterData((prev) => ({
			...prev,
			token: tokenData,
		}));

		addBuildLog(`Token created: ${tokenData.name} (${tokenData.address})`);
		updateBuildStage("Character Framework", "success", [
			"Token integration complete",
		]);
	};

const handleComplete = async (data: CharacterData) => {
  setLoading(true);
  try {
    updateBuildStage("Final Integration", "running", [
      "Verifying character data completeness"
    ]);

    // Verify required fields
    const missingFields = [];
    if (!data.name?.trim()) missingFields.push("name");
    if (!data.description?.trim()) missingFields.push("description");
    if (!data.token?.address) missingFields.push("token information");

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Verify token integration
    if (data.token) {
      updateBuildStage("Final Integration", "running", [
        "Verifying token integration"
      ]);
      
      if (!data.token.name || !data.token.symbol || !data.token.address) {
        throw new Error("Incomplete token information");
      }
      
      addBuildLog(`Token verification successful: ${data.token.symbol}`);
    }

    // Update local state with the completed data
    setCharacterData(data);

    // Verify voice settings
    if (data.voice) {
      const validVoiceModels = ["en_US-male-medium", "en_US-female-medium", "en_US-neutral-medium"];
      if (!validVoiceModels.includes(data.voice.model)) {
        throw new Error("Invalid voice model selected");
      }
      addBuildLog(`Voice configuration verified: ${data.voice.model}`);
    }

    // Verify traits if any
    if (data.traits && data.traits.length > 0) {
      updateBuildStage("Final Integration", "running", [
        "Validating personality traits"
      ]);
      addBuildLog(`Verified ${data.traits.length} character traits`);
    }

    // All verifications passed
    updateBuildStage("Final Integration", "success", [
      "Character data validation complete",
      "All systems verified",
      "Character ready for deployment"
    ]);

    addBuildLog("Character creation completed successfully");

    // Store in localStorage for persistence
    try {
      const existingCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
      existingCharacters.push({
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('characters', JSON.stringify(existingCharacters));
      addBuildLog("Character data stored locally");
    } catch (storageError) {
      console.warn("Failed to store character in localStorage:", storageError);
    }

    // Redirect to dashboard after a brief delay
    setTimeout(() => navigate("/"), 1500);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Verification failed";
    updateBuildStage("Final Integration", "error", [
      `Error: ${errorMessage}`
    ]);
    setError(errorMessage);
    addBuildLog(`Error during completion: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

	// Chat Interface State
	const [chatMessages, setChatMessages] = useState<Message[]>([
		{
			role: "assistant",
			content:
				"Hi! I'm your character creation assistant. Let's design your AI character together. What would you like to name them?",
		},
	]);
	const [chatInput, setChatInput] = useState("");
	const [creationStep, setCreationStep] = useState<CreationStep>("name");

	// Terminal State
	const [terminalInput, setTerminalInput] = useState("");
	const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
		{ type: "system", content: "> SYSTEM INITIALIZED" },
		{ type: "system", content: "> READY FOR CHARACTER CREATION" },
	]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [buildStages, setBuildStages] = useState<BuildStage[]>([
		{
			stage: "Initialize Systems",
			status: "success",
			logs: ["Neural networks loaded", "Memory banks connected"],
		},
		{ stage: "Character Framework", status: "pending" },
		{ stage: "Personality Matrix", status: "pending" },
		{ stage: "Voice Synthesis", status: "pending" },
		{ stage: "Final Integration", status: "pending" },
	]);

	const updateBuildStage = (
		stageName: string,
		status: BuildStage["status"],
		logs: string[] = [],
	) => {
		setBuildStages((prev) =>
			prev.map((stage) =>
				stage.stage === stageName
					? { ...stage, status, logs: [...(stage.logs || []), ...logs] }
					: stage,
			),
		);
	};

	const addBuildLog = (message: string) => {
		setTerminalLogs((prev) => [
			...prev,
			{ type: "system", content: `> ${message}` },
		]);
	};

	const handleInputChange = (field: keyof CharacterData, value: any) => {
		setCharacterData((prev) => ({
			...prev,
			[field]: value,
		}));
		addBuildLog(`Updated ${field}: ${value}`);
	};

	const handleNestedChange = (
		parent: keyof CharacterData,
		field: string,
		value: any,
	) => {
		setCharacterData((prev) => ({
			...prev,
			[parent]: {
				...prev[parent as keyof CharacterData],
				[field]: value,
			},
		}));
		addBuildLog(`Updated ${parent}.${field}: ${value}`);
	};

	const handleChatMessage = async (message: string) => {
		if (!message.trim()) return;

		setChatMessages((prev) => [...prev, { role: "user", content: message }]);
		setChatInput("");
		setLoading(true);

		try {
			let response = "";
			switch (creationStep) {
				case "name":
					handleInputChange("name", message);
					response =
						"Great name choice! Now, tell me about your character's personality and background. What are they like?";
					setCreationStep("description");
					break;

				case "description":
					handleInputChange("description", message);
					response =
						"Thanks! Would you like me to generate additional details for your character? Say 'yes' to generate or 'no' to proceed with what we have.";
					setCreationStep("confirm");
					break;

				case "confirm":
					if (message.toLowerCase().includes("yes")) {
						response = "Generating additional details...";
						await handleGenerate();
						response =
							"I've generated some additional details! Would you like to add any specific traits or adjust the voice settings?";
					} else {
						response =
							"Alright! Would you like to customize any other settings like voice or traits before we create the character?";
					}
					setCreationStep("customize");
					break;

				case "customize":
					if (message.toLowerCase().includes("create")) {
						response = "Great! Creating your character now...";
						await handleCreate();
					} else if (message.toLowerCase().includes("voice")) {
						response =
							"You can choose from Male (US), Female (US), or Neutral (US) voice. Which would you prefer?";
					} else if (message.toLowerCase().includes("trait")) {
						response =
							"What traits would you like to add to your character? You can list them one by one.";
					} else {
						response =
							"Tell me what you'd like to customize (voice, traits), or say 'create' when you're ready to finalize the character.";
					}
					break;
			}

			setTimeout(() => {
				setChatMessages((prev) => [
					...prev,
					{ role: "assistant", content: response },
				]);
				setLoading(false);
			}, 1000);
		} catch (error) {
			setChatMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
				},
			]);
			setLoading(false);
		}
	};

	const handleGenerate = async () => {
		setLoading(true);
		try {
			updateBuildStage("Character Framework", "running", [
				"Initializing generation sequence",
			]);

			const response = await fetch(
				`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/characters/generate`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(characterData),
				},
			);

			if (!response.ok) throw new Error("Generation failed");

			const data = await response.json();

			updateBuildStage("Character Framework", "success", [
				"Character framework generated",
			]);
			updateBuildStage("Personality Matrix", "running", [
				"Building personality traits",
			]);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			setCharacterData((prev) => ({
				...prev,
				description: data.data.description || prev.description,
				background: data.data.background || prev.background,
				traits: data.data.traits || prev.traits,
			}));

			updateBuildStage("Personality Matrix", "success", [
				"Personality matrix completed",
			]);
			addBuildLog("Character generation complete");

			return data;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Generation failed";
			updateBuildStage("Character Framework", "error", [
				`Error: ${errorMessage}`,
			]);
			setError(errorMessage);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const handleCreate = async () => {
		if (!characterData.name || !characterData.description) {
			setError("Name and description are required");
			return;
		}

		setLoading(true);
		try {
			updateBuildStage("Voice Synthesis", "running", [
				"Configuring voice parameters",
			]);
			await new Promise((resolve) => setTimeout(resolve, 800));
			updateBuildStage("Voice Synthesis", "success", [
				"Voice synthesis complete",
			]);

			updateBuildStage("Final Integration", "running", [
				"Integrating all systems",
			]);

			const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/characters`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(characterData),
			});

			if (!response.ok) throw new Error("Failed to create character");

			updateBuildStage("Final Integration", "success", [
				"All systems integrated",
				"Character creation successful",
				"Initiating dashboard redirect...",
			]);

			setTimeout(() => navigate("/"), 1500);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Creation failed";
			updateBuildStage("Final Integration", "error", [
				`Error: ${errorMessage}`,
			]);
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const handleTerminalCommand = async (command: string) => {
		if (!command.trim()) return;

		setTerminalLogs((prev) => [
			...prev,
			{ type: "input", content: `> ${command}` },
		]);

		const cmd = command.toLowerCase().trim();
		const parts = cmd.split(" ");

		try {
			switch (parts[0]) {
				case "help":
					setTerminalLogs((prev) => [
						...prev,
						{
							type: "info",
							content: `
Available commands:
- status        : Show build status
- generate      : Generate character details
- create        : Create character
- clear         : Clear terminal
- help          : Show this help message`,
						},
					]);
					break;

				case "status":
					setTerminalLogs((prev) => [
						...prev,
						{
							type: "info",
							content: buildStages
								.map((stage) => `${stage.stage}: ${stage.status.toUpperCase()}`)
								.join("\n"),
						},
					]);
					break;

				case "generate":
					await handleGenerate();
					break;

				case "create":
					await handleCreate();
					break;

				case "clear":
					setTerminalLogs([
						{ type: "system", content: "> Terminal cleared" },
						{ type: "system", content: "> SYSTEM READY" },
					]);
					break;

				default:
					throw new Error(`Command not recognized: ${parts[0]}`);
			}
		} catch (error) {
			setTerminalLogs((prev) => [
				...prev,
				{
					type: "error",
					content: `> ERROR: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			]);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleTerminalCommand(terminalInput);
			setTerminalInput("");
		}
	};

	return (
		<div className="container mx-auto py-8 min-h-screen flex flex-col">
			<Navbar />
			<div className="flex items-center pt-4 justify-between mb-6">
				<Button variant="outline" onClick={() => navigate("/")}>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Dashboard
				</Button>
				<h1 className="text-2xl font-bold">Create New Character</h1>
			</div>

			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<div className="flex-1 space-y-6">
				<div className="grid gap-6">
					<CharacterForm
						characterData={characterData}
						onInputChange={handleInputChange}
						onNestedChange={handleNestedChange}
						onGenerate={handleGenerate}
						onCreate={handleCreate}
						loading={loading}
						onComplete={handleComplete}
					/>

					<div className="border-t pt-6">
						<h2 className="text-xl font-semibold mb-4">Token Creation</h2>
						{characterData.name ? (
							<TokenCreationForm
								onTokenCreated={handleTokenCreated}
								characterName={characterData.name}
							/>
						) : (
							<Alert>
								<AlertTitle>Name Required</AlertTitle>
								<AlertDescription>
									Please set your character's name before creating a token.
								</AlertDescription>
							</Alert>
						)}
					</div>
				</div>
			</div>

			<div className="mt-6">
				<TerminalComponent
					logs={terminalLogs}
					input={terminalInput}
					onInputChange={(e) => setTerminalInput(e.target.value)}
					onKeyPress={handleKeyPress}
					buildStages={buildStages}
					isBuilding={loading}
					onCharacterUpdate={handleInputChange}
					characterData={characterData}
				/>
			</div>
		</div>
	);
};

export default CreateCharacterPage;
