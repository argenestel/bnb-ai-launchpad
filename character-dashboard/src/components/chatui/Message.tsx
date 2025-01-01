//@ts-nocheck
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

const Message = ({
	message,
	index,
	totalMessages,
	character,
	backgroundUrl,
	shouldRemove,
}) => {
	const [isVisible, setIsVisible] = useState(true);

	// Message variants for animations
	const messageVariants = {
		initial: {
			opacity: 0,
			y: 50,
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
		exit: {
			opacity: 0,
			y: -50,
			transition: {
				duration: 0.3,
			},
		},
	};

	useEffect(() => {
		if (shouldRemove) {
			setIsVisible(false);
		}
	}, [shouldRemove]);

	const formatTimestamp = (timestamp) => {
		return new Intl.DateTimeFormat("default", {
			hour: "numeric",
			minute: "numeric",
		}).format(new Date(timestamp));
	};

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
					variants={messageVariants}
					initial="initial"
					animate="animate"
					exit="exit"
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
								<Avatar className="h-6 w-6">
									<AvatarImage src={backgroundUrl} alt={character.name} />
									<AvatarFallback className="bg-background/90 text-foreground">
										{character.name[0]}
									</AvatarFallback>
								</Avatar>
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
								{formatTimestamp(message.metadata.timestamp)}
							</div>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default Message;
