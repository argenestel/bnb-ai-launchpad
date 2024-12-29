import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import "@xyflow/react/dist/style.css";

import CharacterFlow from "./CharacterFlow";

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

	useEffect(() => {
		fetchCharacter();
	}, [characterName]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const fetchCharacter = async () => {
		try {
			const format_name = characterName?.replace(/ /g, "_");
			const response = await fetch(
				`http://localhost:3000/characters/${format_name}`,
			);
			if (!response.ok) throw new Error("Character not found");
			const data = await response.json();
			setCharacter(data.data);

			setMessages([
				{
					role: "assistant",
					content: `Hello! I'm ${data.data.name}. ${data.data.greeting || "How can I help you today?"}`,
				},
			]);
		} catch (err) {
			setError(err);
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
		if (!inputMessage.trim()) return;

		const newMessage = { role: "user", content: inputMessage };
		setMessages((prev) => [...prev, newMessage]);
		setInputMessage("");
		setLoading(true);

		const format_name = characterName?.replace(/ /g, "_");
		try {
			const response = await fetch(
				`http://localhost:3001/chat/${format_name}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: inputMessage,
						conversationHistory: messages,
					}),
				},
			);

			if (!response.ok) throw new Error("Failed to get response");

			const data = await response.json();
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: data.message },
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

	if (error) {
		return (
			<div className="container mx-auto p-4">
				<Navbar />
				<Alert variant="destructive">
					<AlertDescription>Error: {error}</AlertDescription>
				</Alert>
				<Button onClick={() => navigate("/")} className="mt-4">
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Dashboard
				</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4 h-screen flex flex-col">
			<Navbar />
			<div className="w-full flex-1 flex flex-col min-h-0">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<Button variant="outline" onClick={() => navigate("/")}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Dashboard
					</Button>
					{character && (
						<h1 className="text-2xl font-bold">Chat with {character.name}</h1>
					)}
				</div>

				{/* Split View */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
					{/* Chat Card */}
					<Card className="flex-1 flex flex-col min-h-0">
						<CardHeader className="flex-none">
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

						<CardContent className="flex-1 flex flex-col min-h-0 p-4">
							<ScrollArea
								ref={scrollAreaRef}
								className="flex-1 pr-4"
								type="always"
							>
								<div className="space-y-4">
									{messages.map((msg, idx) => (
										<div
											key={idx}
											className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
										>
											<div
												className={`max-w-[80%] rounded-lg p-3 ${
													msg.role === "user"
														? "bg-primary text-primary-foreground"
														: "bg-muted"
												}`}
											>
												{msg.content}
											</div>
										</div>
									))}
									{loading && (
										<div className="flex justify-start">
											<div className="bg-muted rounded-lg p-3">
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
									className="flex-1"
								/>
								<Button
									onClick={handleSendMessage}
									disabled={loading || !inputMessage.trim()}
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

					{/* Flow Visualization Card */}
					<Card className="flex-1 min-h-[600px]">
						<CardContent className="p-0 h-full">
							{character && <CharacterFlow character={character} />}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default ChatInterface;
