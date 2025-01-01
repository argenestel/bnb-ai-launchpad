//@ts-nocheck
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BuildStage {
	stage: string;
	status: "queued" | "running" | "success" | "error";
	logs?: string[];
}

interface TerminalLog {
	type: "error" | "success" | "input" | "info" | "system";
	content: string;
}

const ASCIISpinner: React.FC<{ status: BuildStage["status"] }> = ({
	status,
}) => {
	const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	const [frame, setFrame] = React.useState(0);

	React.useEffect(() => {
		if (status === "running") {
			const timer = setInterval(() => {
				setFrame((f) => (f + 1) % frames.length);
			}, 80);
			return () => clearInterval(timer);
		}
	}, [status]);

	if (status !== "running") return null;
	return <span className="animate-pulse mr-2">{frames[frame]}</span>;
};

const BuildStage: React.FC<BuildStage> = ({ stage, status, logs = [] }) => {
	const getStatusColor = (status: BuildStage["status"]) => {
		switch (status) {
			case "running":
				return "text-yellow-500";
			case "success":
				return "text-green-500";
			case "error":
				return "text-red-500";
			case "queued":
				return "text-blue-500";
		}
	};

	const getStatusIcon = (status: BuildStage["status"]) => {
		switch (status) {
			case "running":
				return <ASCIISpinner status={status} />;
			case "success":
				return "✓ ";
			case "error":
				return "✗ ";
			case "queued":
				return "• ";
		}
	};

	return (
		<div className="space-y-1 mb-3">
			<div
				className={cn("font-mono flex items-center", getStatusColor(status))}
			>
				<span className="mr-2">{getStatusIcon(status)}</span>
				{stage}
			</div>
			{logs.map((log, idx) => (
				<div key={idx} className="text-sm text-muted-foreground font-mono pl-6">
					{log}
				</div>
			))}
		</div>
	);
};

const LoadingAnimation: React.FC = () => (
	<div className="flex items-center space-x-2 font-mono text-green-500">
		<div className="animate-pulse">⠋</div>
		<div className="animate-pulse delay-75">⠙</div>
		<div className="animate-pulse delay-150">⠸</div>
		<div className="animate-pulse delay-300">⠴</div>
	</div>
);

interface TerminalComponentProps {
	logs: TerminalLog[];
	input: string;
	onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	buildStages: BuildStage[];
	isBuilding: boolean;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({
	logs,
	input,
	onInputChange,
	onKeyPress,
	buildStages,
	isBuilding,
}) => {
	const scrollAreaRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [logs, buildStages]);

	const defaultStages: BuildStage[] = [
		{
			stage: "Analyzing Dependencies",
			status: "success",
			logs: ["✓ Found 324 dependencies", "✓ Verified package integrity"],
		},
		{
			stage: "Generating Build Configuration",
			status: "running",
			logs: [
				"• Optimizing build settings",
				"• Configuring environment variables",
			],
		},
		{
			stage: "Compiling Assets",
			status: "queued",
			logs: [],
		},
		{
			stage: "Running Tests",
			status: "queued",
			logs: [],
		},
	];

	const stages = buildStages.length > 0 ? buildStages : defaultStages;

	return (
		<Card className="border-t-2 border-t-primary bg-black">
			<CardContent className="p-0">
				<div className="h-[500px] flex flex-col">
					<div className="bg-primary/10 p-2 font-mono text-sm border-b border-primary/20 flex items-center justify-between">
						<span>System Terminal</span>
						{isBuilding && <LoadingAnimation />}
					</div>
					<ScrollArea className="flex-1 p-4 font-mono text-sm">
						<div ref={scrollAreaRef}>
							{stages.map((stage, idx) => (
								<BuildStage key={idx} {...stage} />
							))}
							<div className="space-y-1">
								{logs.map((log, idx) => (
									<div
										key={idx}
										className={cn("my-1", {
											"text-red-500": log.type === "error",
											"text-green-500": log.type === "success",
											"text-blue-500": log.type === "input",
											"text-yellow-500": log.type === "info",
											"text-green-400": log.type === "system",
										})}
									>
										{log.content}
									</div>
								))}
							</div>
						</div>
					</ScrollArea>
					<div className="p-4 border-t border-primary/20">
						<div className="flex items-center">
							<span className="text-green-500 mr-2">❯</span>
							<Input
								value={input}
								onChange={onInputChange}
								onKeyPress={onKeyPress}
								className="flex-1 bg-transparent border-none text-green-500 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
								placeholder="Enter command..."
							/>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default TerminalComponent;
