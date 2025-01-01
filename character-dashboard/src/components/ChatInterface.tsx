import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, BookOpen, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import Navbar from "@/components/Navbar";
import CombinedRightPanel from "./CombinedRight";

const ChatInterface = () => {
	const { characterName } = useParams();
	const navigate = useNavigate();
	const [messages, setMessages] = useState([]);
	const [inputMessage, setInputMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [character, setCharacter] = useState(null);
	const [error, setError] = useState(null);
	const scrollAreaRef = useRef(null);
	const messagesEndRef = useRef(null);
	const [characterWallet, setCharacterWallet] = useState("");
	const { address: userWalletAddress, isConnected } = useAccount();
	const { data: userBalance } = useBalance({
		address: userWalletAddress,
	});
	const { data: characterBalance } = useBalance({
		address: character?.evm_address,
	});

	// Message component with fade effect
	const Message = ({ message, index, totalMessages }) => {
		// Calculate opacity based on message position
		const opacity = Math.max(
			0,
			Math.min(1, (index + 1) / (totalMessages * 0.6)),
		);

		return (
			<div
				className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} transition-opacity duration-300`}
				style={{ opacity }}
			>
				<div
					className={`max-w-[80%] rounded-lg p-4 space-y-2 backdrop-blur-sm
          ${
						message.role === "user"
							? "bg-primary/80 text-primary-foreground"
							: "bg-muted/80"
					}`}
				>
					<div className="flex items-center gap-2">
						{message.role === "assistant" && character && (
							<Avatar className="h-6 w-6">
								<div className="bg-background/90 text-foreground w-full h-full flex items-center justify-center text-xs font-semibold">
									{character.name[0]}
								</div>
							</Avatar>
						)}
						<div className="flex-1 min-w-0">{message.content}</div>
					</div>
					<div
						className={`flex items-center justify-between text-xs
            ${
							message.role === "user"
								? "text-primary-foreground/80"
								: "text-muted-foreground"
						}`}
					>
						<span>{formatTimestamp(message.metadata?.timestamp)}</span>
						{message.metadata?.topics && (
							<div className="flex gap-1">
								{message.metadata.topics.map((topic, i) => (
									<span
										key={i}
										className="px-1.5 py-0.5 rounded-full bg-background/30"
									>
										{topic}
									</span>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	// Background media component with gradient overlay
	const BackgroundMedia = ({ url, type = "image" }) => (
		<div className="absolute inset-0 -z-10">
			{type === "image" ? (
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url(${url})` }}
				/>
			) : (
				<video
					className="absolute inset-0 w-full h-full object-cover"
					src={url}
					autoPlay
					loop
					muted
					playsInline
				/>
			)}
			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
		</div>
	);

	// Modified chat card content
	const ChatCardContent = () => (
		<div className="relative flex-1 flex flex-col min-h-0">
			<BackgroundMedia
				url="/path/to/your/media" // Replace with your media URL
				type="image" // or "video"
			/>

			<CardContent className="flex-1 flex flex-col min-h-0 p-4">
				<ScrollArea
					ref={scrollAreaRef}
					className="flex-1 pr-4 mask-linear-gradient"
					type="always"
				>
					<div className="space-y-4">
						{messages.map((msg, idx) => (
							<Message
								key={idx}
								message={msg}
								index={idx}
								totalMessages={messages.length}
							/>
						))}
						{loading && (
							<div className="flex justify-start">
								<div className="bg-muted/80 backdrop-blur-sm rounded-lg p-3">
									<Loader2 className="w-4 h-4 animate-spin" />
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>
				</ScrollArea>

				<div className="mt-4 flex gap-2 relative z-10">
					<Input
						value={inputMessage}
						onChange={(e) => setInputMessage(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Type your message..."
						disabled={loading}
						className="flex-1 bg-background/50 backdrop-blur-sm"
					/>
					<Button
						onClick={handleSendMessage}
						disabled={loading || !inputMessage.trim()}
						className="bg-primary/80 hover:bg-primary/90 backdrop-blur-sm"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Send className="w-4 h-4" />
						)}
					</Button>
				</div>
			</CardContent>
		</div>
	);
	// Details Sheet Component
	const CharacterDetails = () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" size="icon">
					<BookOpen className="h-4 w-4" />
				</Button>
			</SheetTrigger>
			<SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Character Details</SheetTitle>
				</SheetHeader>
				<div className="space-y-6 py-4">
					{/* Basic Info */}
					<div>
						<h3 className="font-semibold mb-2">About</h3>
						<p className="text-sm text-muted-foreground">
							{character?.description}
						</p>
					</div>

					{/* Topics */}
					{character?.topics && (
						<div>
							<h3 className="font-semibold mb-2">Topics</h3>
							<div className="flex flex-wrap gap-2">
								{character.topics.map((topic, i) => (
									<Badge key={i} variant="secondary">
										{topic}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Personality */}
					{character?.adjectives && (
						<div>
							<h3 className="font-semibold mb-2">Personality Traits</h3>
							<div className="flex flex-wrap gap-2">
								{character.adjectives.map((adj, i) => (
									<Badge key={i} variant="outline">
										{adj}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Knowledge */}
					{character?.knowledge && (
						<div>
							<h3 className="font-semibold mb-2">Knowledge Areas</h3>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								{character.knowledge.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
						</div>
					)}

					{/* Bio */}
					{character?.bio && (
						<div>
							<h3 className="font-semibold mb-2">Biography</h3>
							<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
								{character.bio.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);

	// Wallet Sheet Component
	const WalletDetails = () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" size="icon">
					<Wallet className="h-4 w-4" />
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Wallet Information</SheetTitle>
				</SheetHeader>
				<div className="space-y-6 py-4">
					{/* User Wallet */}
					<div>
						<h3 className="font-semibold mb-2">Your Wallet</h3>
						<div className="space-y-2">
							<p className="font-mono text-sm bg-muted p-2 rounded">
								{userWalletAddress}
							</p>
							<p className="text-sm">
								Balance:{" "}
								{userBalance
									? `${formatEther(userBalance?.value)} ${userBalance?.symbol}`
									: "0"}
							</p>
						</div>
					</div>

					{/* Character Wallet */}
					<div>
						<h3 className="font-semibold mb-2">Character Wallet</h3>
						<div className="space-y-2">
							<p className="font-mono text-sm bg-muted p-2 rounded">
								{character?.evmAddress}
							</p>
							<p className="text-sm">
								Balance:{" "}
								{characterBalance
									? `${formatEther(characterBalance?.value)} ${characterBalance?.symbol}`
									: "0"}
							</p>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);

	useEffect(() => {
		if (isConnected) {
			fetchCharacter();
		}
	}, [characterName, isConnected]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const fetchCharacter = async () => {
		try {
			const response = await fetch(
				`http://localhost:3000/characters/${characterName}`,
			);
			if (!response.ok) throw new Error("Character not found");
			const data = await response.json();
			setCharacter(data.data);

			// Set initial greeting with more context
			setMessages([
				{
					role: "assistant",
					content: `Hello! I'm ${data.data.name}. ${
						data.data.greeting ||
						`I specialize in ${data.data.topics.slice(0, 3).join(", ")}. How can I assist you today?`
					}`,
					metadata: {
						timestamp: new Date().toISOString(),
						topics: data.data.topics.slice(0, 3),
					},
				},
			]);
		} catch (err) {
			setError(err.message);
		}
	};

	const scrollToBottom = () => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	};

	const handleSendMessage = async () => {
		if (!inputMessage.trim() || !isConnected) return;

		const newMessage = {
			role: "user",
			content: inputMessage,
			metadata: {
				timestamp: new Date().toISOString(),
				walletAddress: userWalletAddress,
			},
		};
		setMessages((prev) => [...prev, newMessage]);
		setInputMessage("");
		setLoading(true);

		try {
			const response = await fetch(
				`http://localhost:3000/chat/${character.name}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: inputMessage,
						userId: userWalletAddress,
						conversationHistory: messages,
						context: {
							userBalance: userBalance ? formatEther(userBalance.value) : "0",
							characterBalance: characterBalance
								? formatEther(characterBalance.value)
								: "0",
						},
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to get response");

			const data = await response.json();
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: data.message,
					metadata: {
						timestamp: new Date().toISOString(),
						topics: data.topics || [],
						confidence: data.confidence,
					},
				},
			]);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const formatTimestamp = (timestamp) => {
		return new Intl.DateTimeFormat("default", {
			hour: "numeric",
			minute: "numeric",
		}).format(new Date(timestamp));
	};

	// Message Component

	return (
		<div className="container mx-auto p-4 h-screen flex flex-col">
			<Navbar />
			<div className="w-full flex-1 flex pt-4 flex-col min-h-0">
				{/* Background for the entire container */}
				<BackgroundMedia
					url="https://www.youtube.com/watch?v=NSQWIpbFtJU"
					type="youtube"
				/>

				{/* Header */}
				<div className="flex items-center justify-between mb-4 relative z-10">
					<div className="flex items-center gap-4">
						<Button
							variant="outline"
							onClick={() => navigate("/")}
							className="backdrop-blur-sm"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back
						</Button>
						{isConnected && character?.evmAddress && (
							<Badge variant="secondary" className="font-mono backdrop-blur-sm">
								{`${character.evmAddress.slice(0, 6)}...${character.evmAddress.slice(-4)}`}
							</Badge>
						)}
					</div>
					<div className="flex items-center gap-4">
						<CharacterDetails />
						<WalletDetails />
						{character && (
							<h1 className="text-2xl font-bold text-white backdrop-blur-sm rounded-lg px-3 py-1">
								Chat with {character.name}
							</h1>
						)}
					</div>
				</div>

				{!isConnected ? (
					<Card className="p-6 relative backdrop-blur-sm bg-background/50">
						<CardContent className="text-center relative z-10">
							<h2 className="text-lg font-semibold mb-4">
								Connect Your Wallet
							</h2>
							<p className="text-muted-foreground mb-4">
								Please connect your wallet to start chatting with characters
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-12 gap-6 flex-1">
						{/* Chat Card - Takes up 8 columns */}
						<Card className="col-span-8 flex-1 flex flex-col min-h-0 relative overflow-hidden backdrop-blur-sm bg-background/50">
							<CardHeader className="relative z-10">
								<CardTitle>
									{character && (
										<div className="flex items-center gap-4">
											<Avatar className="w-10 h-10">
												<div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-lg font-semibold">
													{character.name[0]}
												</div>
											</Avatar>
											<div>
												<h3 className="text-lg font-semibold">
													{character.name}
												</h3>
												<p className="text-sm text-muted-foreground">
													{character?.modelProvider}
												</p>
											</div>
										</div>
									)}
								</CardTitle>
							</CardHeader>

							<CardContent className="flex-1 flex flex-col min-h-0 p-4 relative z-10">
								<ScrollArea
									ref={scrollAreaRef}
									className="flex-1 pr-4 mask-linear-gradient"
									type="always"
								>
									<div className="space-y-4">
										{messages.map((msg, idx) => (
											<Message
												key={idx}
												message={msg}
												index={idx}
												totalMessages={messages.length}
											/>
										))}
										{loading && (
											<div className="flex justify-start">
												<div className="bg-muted/80 backdrop-blur-sm rounded-lg p-3">
													<Loader2 className="w-4 h-4 animate-spin" />
												</div>
											</div>
										)}
										<div ref={messagesEndRef} />
									</div>
								</ScrollArea>

								<div className="mt-4 flex gap-2">
									<Input
										value={inputMessage}
										onChange={(e) => setInputMessage(e.target.value)}
										onKeyPress={handleKeyPress}
										placeholder="Type your message..."
										disabled={loading}
										className="flex-1 bg-background/50 backdrop-blur-sm"
									/>
									<Button
										onClick={handleSendMessage}
										disabled={loading || !inputMessage.trim()}
										className="bg-primary/80 hover:bg-primary/90 backdrop-blur-sm"
									>
										{loading ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Send className="w-4 h-4" />
										)}
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Right Panel - Takes up 4 columns */}
						<div className="col-span-4 backdrop-blur-sm bg-background/50 rounded-lg">
							<CombinedRightPanel character={character} />
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatInterface;
