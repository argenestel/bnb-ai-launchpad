//@ts-nocheck
import React, { useCallback } from "react";
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	addEdge,
	Panel,
} from "@xyflow/react";
import { useBalance, useAccount } from "wagmi";
import { formatEther } from "viem";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CharacterFlow = ({ character }) => {
	const { address: userWalletAddress, isConnected } = useAccount();
	const { data: userBalance, isLoading: isBalanceLoading } = useBalance({
		address: userWalletAddress,
	});
	const { data: characterBalance, isLoading: isCharacterBalanceLoading } =
		useBalance({
			address: character?.evm_address,
		});

	// Generate nodes based on character data
	const createNodes = () => {
		const nodes = [
			{
				id: "character",
				type: "default",
				data: {
					label: (
						<div className="p-4 text-center">
							<h3 className="font-bold mb-2">{character?.name}</h3>
							<p className="text-sm text-muted-foreground">
								{character?.description?.slice(0, 100)}...
							</p>
						</div>
					),
				},
				position: { x: 400, y: 50 },
				className:
					"bg-card border-2 border-primary rounded-lg shadow-lg min-w-[300px]",
			},
			// Wallet Information Node
			{
				id: "wallet",
				type: "default",
				data: {
					label: (
						<div className="p-4">
							<h4 className="font-semibold mb-2">Wallet Details</h4>
							<div className="space-y-2 text-sm">
								<p className="font-mono bg-muted p-1 rounded">
									{character?.evm_address}
								</p>
								<p>
									Balance:{" "}
									{isCharacterBalanceLoading ? (
										<Skeleton className="h-4 w-20 inline-block" />
									) : (
										`${characterBalance ? formatEther(characterBalance?.value) : "0"} ${characterBalance?.symbol}`
									)}
								</p>
							</div>
						</div>
					),
				},
				position: { x: 400, y: 200 },
				className: "bg-card border rounded-lg shadow-lg min-w-[300px]",
			},
			// Character Details
			{
				id: "details",
				type: "default",
				data: {
					label: (
						<div className="p-4">
							<h4 className="font-semibold mb-2">Character Details</h4>
							<div className="space-y-2 text-sm">
								<p>Model: {character?.modelProvider}</p>
								<p>Voice: {character?.settings?.voice?.model}</p>
								<p>Clients: {character?.clients?.join(", ")}</p>
							</div>
						</div>
					),
				},
				position: { x: 100, y: 200 },
				className: "bg-card border rounded-lg shadow-lg min-w-[250px]",
			},
			// Knowledge & Topics
			{
				id: "knowledge",
				type: "default",
				data: {
					label: (
						<div className="p-4">
							<h4 className="font-semibold mb-2">Knowledge Areas</h4>
							<div className="space-y-2 text-sm">
								<p>{character?.topics?.slice(0, 3).join(", ")}</p>
								{character?.knowledge?.length > 0 && (
									<p className="text-muted-foreground">
										{character.knowledge[0]}...
									</p>
								)}
							</div>
						</div>
					),
				},
				position: { x: 700, y: 200 },
				className: "bg-card border rounded-lg shadow-lg min-w-[250px]",
			},
			// Personality
			{
				id: "personality",
				type: "default",
				data: {
					label: (
						<div className="p-4">
							<h4 className="font-semibold mb-2">Personality</h4>
							<div className="space-y-2 text-sm">
								{character?.adjectives?.slice(0, 3).map((adj, i) => (
									<span
										key={i}
										className="inline-block bg-muted px-2 py-1 rounded mr-2"
									>
										{adj}
									</span>
								))}
							</div>
						</div>
					),
				},
				position: { x: 400, y: 350 },
				className: "bg-card border rounded-lg shadow-lg min-w-[300px]",
			},
		];

		// Connected User Wallet Node
		if (isConnected) {
			nodes.push({
				id: "userWallet",
				type: "default",
				data: {
					label: (
						<div className="p-4">
							<h4 className="font-semibold mb-2">Your Wallet</h4>
							<div className="space-y-2 text-sm">
								<p className="font-mono bg-muted p-1 rounded">
									{userWalletAddress}
								</p>
								<p>
									Balance:{" "}
									{isBalanceLoading ? (
										<Skeleton className="h-4 w-20 inline-block" />
									) : (
										`${userBalance ? formatEther(userBalance?.value) : "0"} ${userBalance?.symbol}`
									)}
								</p>
							</div>
						</div>
					),
				},
				position: { x: 400, y: -100 },
				className:
					"bg-card border-2 border-primary rounded-lg shadow-lg min-w-[300px]",
			});
		}

		return nodes;
	};

	const createEdges = () => {
		const edges = [
			{
				id: "e-char-wallet",
				source: "character",
				target: "wallet",
				animated: true,
				style: { stroke: "hsl(var(--primary))" },
			},
			{
				id: "e-char-details",
				source: "character",
				target: "details",
				style: { stroke: "hsl(var(--muted-foreground))" },
			},
			{
				id: "e-char-knowledge",
				source: "character",
				target: "knowledge",
				style: { stroke: "hsl(var(--muted-foreground))" },
			},
			{
				id: "e-char-personality",
				source: "character",
				target: "personality",
				style: { stroke: "hsl(var(--muted-foreground))" },
			},
		];

		// Add edge from user wallet if connected
		if (isConnected) {
			edges.push({
				id: "e-user-char",
				source: "userWallet",
				target: "character",
				animated: true,
				style: { stroke: "hsl(var(--primary))" },
			});
		}

		return edges;
	};

	const [nodes, setNodes, onNodesChange] = useNodesState(createNodes());
	const [edges, setEdges, onEdgesChange] = useEdgesState(createEdges());

	const onConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	return (
		<div className="h-full w-full">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
				fitViewOptions={{ padding: 0.2 }}
				attributionPosition="bottom-right"
				nodesDraggable={true}
				nodesConnectable={false}
				className="bg-background"
			>
				<Background variant="dots" gap={12} size={1} className="bg-muted" />
				<Controls className="bg-card border-border" />
				<MiniMap
					nodeColor={(node) => {
						return node.id === "character" || node.id === "userWallet"
							? "hsl(var(--primary))"
							: "hsl(var(--muted))";
					}}
					maskColor="rgba(0, 0, 0, 0.1)"
					className="bg-card border-border"
				/>
				<Panel position="top-left" className="bg-card p-4 rounded-lg shadow-md">
					<div className="space-y-2">
						<h3 className="font-semibold">Character Network</h3>
						<p className="text-sm text-muted-foreground">
							Interactive visualization of character details and wallet
							connections
						</p>
					</div>
				</Panel>
			</ReactFlow>
		</div>
	);
};

export default CharacterFlow;
