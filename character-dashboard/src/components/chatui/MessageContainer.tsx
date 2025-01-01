//@ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const Message = ({ message, character, backgroundUrl }) => {
	const messageVariants = {
		initial: {
			opacity: 0,
			y: 20,
			x: message.role === "user" ? 20 : -20,
		},
		animate: {
			opacity: 1,
			y: 0,
			x: 0,
			transition: {
				type: "spring",
				stiffness: 200,
				damping: 20,
			},
		},
	};

	return (
		<motion.div
			className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
			variants={messageVariants}
			initial="initial"
			animate="animate"
			layout
		>
			<div
				className={`max-w-[80%] rounded-lg p-3 space-y-1.5 backdrop-blur-sm
          ${
						message.role === "user"
							? "bg-primary/80 text-primary-foreground"
							: "bg-muted/80"
					}`}
			>
				<div className="flex items-center gap-2">
					{message.role === "assistant" && character && (
						<div className="h-6 w-6 rounded-full overflow-hidden">
							<img
								src={backgroundUrl}
								alt={character.name}
								className="h-full w-full object-cover"
							/>
						</div>
					)}
					<div className="flex-1 min-w-0 text-sm">{message.content}</div>
				</div>
				{message.metadata?.timestamp && (
					<div
						className={`text-xs ${
							message.role === "user"
								? "text-primary-foreground/70"
								: "text-muted-foreground"
						}`}
					>
						{new Date(message.metadata.timestamp).toLocaleTimeString()}
					</div>
				)}
			</div>
		</motion.div>
	);
};

//@ts-nocheck
const LivestreamView = ({ youtubeUrl }) => {
	return (
		<div className="flex flex-col h-full">
			<div className="relative w-full pt-[56.25%]">
				<iframe
					src={youtubeUrl}
					className="absolute top-0 left-0 w-full h-full rounded-t-lg"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				/>
			</div>
			<div className="flex-1 min-h-0">
				<ScrollArea className="h-[200px] mt-4">
					<div className="space-y-2 p-4">
						{/* Chat messages will be rendered here */}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};

//@ts-nocheck
const MessageContainer = ({
	messages,
	character,
	backgroundUrl,
	youtubeUrl = "https://www.youtube.com/embed/live_stream?channel=YOUR_CHANNEL_ID",
	mode = "chat", // 'chat' or 'livestream'
}) => {
	const [activeTab, setActiveTab] = useState(mode);
	const scrollRef = useRef(null);

	useEffect(() => {
		if (scrollRef.current) {
			const scrollContainer = scrollRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, [messages]);

	return (
		<Card className="relative h-[calc(100vh-240px)] bg-background/30 backdrop-blur-sm">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
				<div className="p-4 border-b">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="chat">Regular Chat</TabsTrigger>
						<TabsTrigger value="livestream">Livestream</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent value="chat" className="h-[calc(100%-60px)] m-0">
					<ScrollArea ref={scrollRef} className="h-full pr-4" type="hover">
						<div className="space-y-2 p-4">
							<AnimatePresence mode="sync">
								{messages.map((message) => (
									<Message
										key={message.metadata?.timestamp || Date.now()}
										message={message}
										character={character}
										backgroundUrl={backgroundUrl}
									/>
								))}
							</AnimatePresence>
						</div>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="livestream" className="h-[calc(100%-60px)] m-0">
					<LivestreamView youtubeUrl={youtubeUrl} />
				</TabsContent>
			</Tabs>
		</Card>
	);
};

export default MessageContainer;
