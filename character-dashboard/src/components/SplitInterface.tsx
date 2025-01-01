//@ts-nocheck
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Activity } from "lucide-react";
import ChatInterface from "./chatui/ChatInterface";
import CharacterFlowVisualization from "./CharacterFlowVisualization";

const SplitInterface = ({
	messages,
	input,
	onInputChange,
	onSendMessage,
	loading,
	characterData,
}) => {
	// State to handle mobile view toggle
	const [activeView, setActiveView] = useState("chat");
	const [isMobile, setIsMobile] = useState(false);

	// Check for mobile viewport
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		// Initial check
		checkMobile();

		// Add resize listener
		window.addEventListener("resize", checkMobile);

		// Cleanup
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// Mobile navigation component
	const MobileNav = () => (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg border lg:hidden">
			<Button
				variant={activeView === "chat" ? "default" : "ghost"}
				size="sm"
				onClick={() => setActiveView("chat")}
				className="rounded-full"
			>
				<MessageSquare className="h-4 w-4 mr-2" />
				Chat
			</Button>
			<Button
				variant={activeView === "flow" ? "default" : "ghost"}
				size="sm"
				onClick={() => setActiveView("flow")}
				className="rounded-full"
			>
				<Activity className="h-4 w-4 mr-2" />
				Flow
			</Button>
		</div>
	);

	return (
		<div className="relative">
			{/* Desktop View */}
			<div className="hidden lg:grid lg:grid-cols-2 gap-6">
				<div className="w-full">
					<ChatInterface
						messages={messages}
						input={input}
						onInputChange={onInputChange}
						onSendMessage={onSendMessage}
						loading={loading}
						characterData={characterData}
					/>
				</div>
				<div className="w-full">
					<Card className="h-[calc(100vh-25rem)]">
						<CharacterFlowVisualization characterData={characterData} />
					</Card>
				</div>
			</div>

			{/* Mobile View */}
			<div className="lg:hidden w-full space-y-4">
				<div
					className={`w-full transition-all duration-300 ${
						activeView === "chat" ? "block" : "hidden"
					}`}
				>
					<ChatInterface
						messages={messages}
						input={input}
						onInputChange={onInputChange}
						onSendMessage={onSendMessage}
						loading={loading}
						characterData={characterData}
					/>
				</div>
				<div
					className={`w-full transition-all duration-300 ${
						activeView === "flow" ? "block" : "hidden"
					}`}
				>
					<Card className="h-[calc(100vh-10rem)]">
						<CharacterFlowVisualization characterData={characterData} />
					</Card>
				</div>
				<MobileNav />
			</div>
		</div>
	);
};

export default SplitInterface;
