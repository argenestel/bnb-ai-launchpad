//@ts-nocheck
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
	// Single comprehensive node with optimized width
	const initialNodes = [
		{
			id: "main",
			type: "default",
			data: {
				label: (
					<div className="p-8 text-center bg-background border rounded-xl min-w-[380px] max-w-[420px]">
						<div className="flex items-center justify-center mb-6">
							<Avatar className="w-20 h-20">
								<div className="bg-primary text-primary-foreground w-full h-full flex items-center justify-center text-3xl font-semibold">
									{character?.name?.[0]}
								</div>
							</Avatar>
						</div>

						{/* Main Info */}
						<h3 className="text-2xl font-bold mb-3">{character?.name}</h3>
						<p className="text-sm text-muted-foreground mb-6 px-4">
							{character?.description?.slice(0, 100)}...
						</p>

						{/* Wallet */}
						<div className="mb-6">
							<Badge variant="outline" className="font-mono text-sm px-4 py-1">
								{character?.evm_address
									? `${character.evm_address.slice(0, 6)}...${character.evm_address.slice(-4)}`
									: "No Address"}
							</Badge>
						</div>

						{/* Settings */}
						<div className="text-sm text-muted-foreground mb-6 space-y-1">
							<p>Model: {character?.modelProvider || "default"}</p>
							<p>Voice: {character?.settings?.voice?.model || "default"}</p>
						</div>

						{/* Topics */}
						<div className="flex flex-wrap justify-center gap-2 mb-6 px-4">
							{character?.topics?.slice(0, 3).map((topic, i) => (
								<Badge
									key={i}
									variant="secondary"
									className="text-xs px-3 py-1"
								>
									{topic}
								</Badge>
							))}
						</div>

						{/* Personality */}
						<div className="flex flex-wrap justify-center gap-2 px-4">
							{character?.adjectives?.slice(0, 3).map((adj, i) => (
								<Badge key={i} variant="outline" className="text-xs px-3 py-1">
									{adj}
								</Badge>
							))}
						</div>
					</div>
				),
			},
			position: { x: 0, y: 0 },
			className: "shadow-xl dark !border-0",
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
					padding: 0.5,
					minZoom: 0.85,
					maxZoom: 1,
					duration: 800,
				}}
				minZoom={0.5}
				maxZoom={1.2}
				defaultZoom={0.85}
				attributionPosition="bottom-right"
				nodesDraggable={false}
				nodesConnectable={false}
				className="dark"
				zoomOnScroll={false}
				panOnScroll={false}
				preventScrolling={true}
			>
				<Background
					variant="dots"
					gap={16}
					size={1}
					className="bg-background"
					color="hsl(var(--muted-foreground))"
				/>
				<Controls
					className="bg-background border rounded-md shadow-md"
					showInteractive={false}
					position="bottom-right"
				/>
			</ReactFlow>
		</div>
	);
};

export default CharacterFlow;
