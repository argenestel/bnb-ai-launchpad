import React from "react";
import {
	ReactFlow,
	Background,
	Controls,
	useNodesState,
	useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const CharacterFlow = ({ character }) => {
	// Single comprehensive node
	const initialNodes = [
		{
			id: "main",
			type: "default",
			data: {
				label: (
					<div className="p-6 text-center bg-background border rounded-xl min-w-[400px]">
						<div className="flex items-center justify-center mb-4">
							<Avatar className="w-16 h-16">
								<div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-2xl font-semibold">
									{character?.name?.[0]}
								</div>
							</Avatar>
						</div>

						{/* Main Info */}
						<h3 className="text-xl font-bold mb-2">{character?.name}</h3>
						<p className="text-sm text-muted-foreground mb-4">
							{character?.description?.slice(0, 100)}...
						</p>

						{/* Wallet */}
						<div className="mb-4">
							<Badge variant="outline" className="font-mono">
								{character?.evm_address
									? `${character.evm_address.slice(0, 6)}...${character.evm_address.slice(-4)}`
									: "No Address"}
							</Badge>
						</div>

						{/* Settings */}
						<div className="text-sm text-muted-foreground mb-4">
							<p>Model: {character?.modelProvider || "default"}</p>
							<p>Voice: {character?.settings?.voice?.model || "default"}</p>
						</div>

						{/* Topics */}
						<div className="flex flex-wrap justify-center gap-2 mb-4">
							{character?.topics?.slice(0, 3).map((topic, i) => (
								<Badge key={i} variant="secondary" className="text-xs">
									{topic}
								</Badge>
							))}
						</div>

						{/* Personality */}
						<div className="flex flex-wrap justify-center gap-2">
							{character?.adjectives?.slice(0, 3).map((adj, i) => (
								<Badge key={i} variant="outline" className="text-xs">
									{adj}
								</Badge>
							))}
						</div>
					</div>
				),
			},
			position: { x: 0, y: 0 },
			className: "shadow-lg dark",
		},
	];

	const [nodes] = useNodesState(initialNodes);
	const [edges] = useEdgesState([]);

	return (
		<div className="w-full h-full dark bg-background/95">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				fitView
				fitViewOptions={{
					padding: 2,
					minZoom: 0.5,
					maxZoom: 1.5,
				}}
				minZoom={0.5}
				maxZoom={1.5}
				attributionPosition="bottom-right"
				nodesDraggable={false}
				nodesConnectable={false}
				className="dark"
			>
				<Background
					variant="dots"
					gap={12}
					size={1}
					className="bg-background"
					color="hsl(var(--muted-foreground))"
				/>
				<Controls className="bg-background border rounded-md shadow-md" />
			</ReactFlow>
		</div>
	);
};

export default CharacterFlow;
