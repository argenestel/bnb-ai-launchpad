import React, { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { abi } from "./abi";
import { TOKEN_FACTORY_ADDRESS, PLATFORM_FEE } from "./constant";
import { TokenData } from "@/types";

interface TokenFormProps {
	onTokenCreated: (tokenData: TokenData) => void;
	characterName: string;
}

export function TokenCreationForm({
	onTokenCreated,
	characterName,
}: TokenFormProps) {
	const [formData, setFormData] = useState<
		Omit<TokenData, "address" | "transactionHash">
	>({
		name: `${characterName} Token`,
		symbol: characterName.slice(0, 4).toUpperCase(),
		imageUrl: "",
		description: `Token for ${characterName}`,
	});

	const [error, setError] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const { address } = useAccount();
	const { writeContract } = useWriteContract();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!address) {
			setError("Please connect your wallet.");
			return;
		}

		if (
			!formData.name ||
			!formData.symbol ||
			!formData.imageUrl ||
			!formData.description
		) {
			setError("Please fill in all fields.");
			return;
		}

		setIsCreating(true);

		try {
			const tx = await writeContract({
				address: TOKEN_FACTORY_ADDRESS,
				abi,
				functionName: "createMemeToken",
				args: [
					formData.name,
					formData.symbol,
					formData.imageUrl,
					formData.description,
				],
				value: parseEther(PLATFORM_FEE.toString()),
			});

			// Wait for transaction receipt to get token address
			const receipt = await tx.wait();
			const tokenAddress = receipt.logs[0].address; // Assuming first log contains token address

			onTokenCreated({
				...formData,
				address: tokenAddress,
				transactionHash: tx.hash,
			});
		} catch (err: any) {
			console.error("Error creating token:", err);
			setError(err.message || "Failed to create token.");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Character Token</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Token Name</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="Character Token"
							required
							maxLength={50}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="symbol">Token Symbol</Label>
						<Input
							id="symbol"
							value={formData.symbol}
							onChange={(e) => {
								const value = e.target.value.toUpperCase();
								setFormData((prev) => ({ ...prev, symbol: value }));
							}}
							placeholder="TKN"
							required
							maxLength={11}
							className="uppercase"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="imageUrl">Token Image URL</Label>
						<Input
							id="imageUrl"
							value={formData.imageUrl}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
							}
							placeholder="https://..."
							required
							type="url"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							placeholder="Describe your character token..."
							required
							maxLength={200}
						/>
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Button
						type="submit"
						disabled={!address || isCreating}
						className="w-full"
					>
						{isCreating ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating Token...
							</>
						) : (
							"Create Token"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
