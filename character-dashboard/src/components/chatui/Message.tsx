import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Gamepad2 } from "lucide-react";

interface Character {
	name: string;
	description: string;
	evm_address: string;
}

interface Game {
	name: string;
	description: string;
	theme: string;
	goal: string;
	antagonist: string;
	evm_address?: string;
	token?: {
		address: string;
		imageUrl: string;
	};
}

interface MessageProps {
	message: {
		role: 'user' | 'assistant';
		content: string;
		metadata: {
			timestamp: string;
			type?: string;
			topics?: string[];
			walletAddress?: string;
		};
	};
	index: number;
	totalMessages: number;
	character?: Character;
	game?: Game;
	backgroundUrl?: string;
}

const Message = ({
	message,
	index,
	totalMessages,
	character,
	game,
	backgroundUrl,
}: MessageProps) => {
	// Calculate opacity based on message position
	const opacity = Math.max(0, Math.min(1, (index + 1) / (totalMessages * 0.6)));

	const formatTimestamp = (timestamp: string) => {
		return new Intl.DateTimeFormat("default", {
			hour: "numeric",
			minute: "numeric",
		}).format(new Date(timestamp));
	};

	const isGame = game !== undefined;
	const entity = isGame ? game : character;

	return (
		<div
			className={`flex ${
				message.role === "user" ? "justify-end" : "justify-start"
			} transition-opacity duration-300`}
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
					{message.role === "assistant" && entity && (
						<Avatar className="h-6 w-6">
							{backgroundUrl ? (
								<AvatarImage src={backgroundUrl} alt={entity.name} />
							) : null}
							<AvatarFallback>
								{isGame ? (
									<Gamepad2 className="h-4 w-4" />
								) : (
									<div className="bg-background/90 text-foreground w-full h-full flex items-center justify-center text-xs font-semibold">
										{entity.name[0]}
									</div>
								)}
							</AvatarFallback>
						</Avatar>
					)}
					<div className="flex-1 min-w-0 whitespace-pre-wrap">{message.content}</div>
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
					{message.metadata?.type && (
						<Badge variant="outline" className="ml-2">
							{message.metadata.type}
						</Badge>
					)}
				</div>
			</div>
		</div>
	);
};

export default Message;
