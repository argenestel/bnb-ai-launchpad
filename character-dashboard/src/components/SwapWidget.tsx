import React, { useState, useEffect } from "react";
import { parseEther, Address, Abi } from "viem";
import {
	useReadContract,
	useAccount,
	usePublicClient,
	useWalletClient,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Image as ImageIcon } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SwapWidgetProps {
	tokenFactoryAddress: Address;
	tokenFactoryABI: Abi;
	pTokenAddress: Address;
	pTokenABI: Abi;
	defaultTokenAddress?: Address;
	defaultTokenInfo?: {
		name: string;
		symbol: string;
		address: Address;
	};
}

interface Token {
	tokenAddress: Address;
	name: string;
	symbol: string;
	description: string;
	tokenImageUrl: string;
	fundingRaised: bigint;
	creatorAddress: Address;
}

const SwapWidget = ({
	tokenFactoryAddress,
	tokenFactoryABI,
	pTokenAddress,
	pTokenABI,
	defaultTokenAddress,
	defaultTokenInfo
}: SwapWidgetProps) => {
	const [amount, setAmount] = useState("1"); // Default to 1 token
	const [selectedToken, setSelectedToken] = useState<Address | "">(defaultTokenAddress || "");
	const [isSelling, setIsSelling] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const { address } = useAccount();
	const publicClient = usePublicClient();
	const { data: walletClient } = useWalletClient();

	// Get all available tokens
	const { data: tokensData } = useReadContract({
		address: tokenFactoryAddress,
		abi: tokenFactoryABI,
		functionName: "getAllMemeTokens",
	});

	// Convert tokensData to Token array and include defaultTokenInfo if provided
	const tokens = React.useMemo(() => {
		const tokenList = (tokensData || []) as Token[];
		if (defaultTokenInfo && !tokenList.some(t => t.tokenAddress === defaultTokenInfo.address)) {
			return [
				{
					tokenAddress: defaultTokenInfo.address,
					name: defaultTokenInfo.name,
					symbol: defaultTokenInfo.symbol,
					description: "",
					tokenImageUrl: "",
					fundingRaised: 0n,
					creatorAddress: "0x" as Address,
				},
				...tokenList
			];
		}
		return tokenList;
	}, [tokensData, defaultTokenInfo]);

	// Get selected token info from tokens array
	const selectedTokenDetails = tokens.find(t => t.tokenAddress === selectedToken);

	// Read allowances for both PTOKEN and selected token
	const { data: ptokenAllowanceData } = useReadContract({
		address: pTokenAddress,
		abi: pTokenABI,
		functionName: "allowance",
		args: [address as Address, tokenFactoryAddress],
	});

	const ptokenAllowance = (ptokenAllowanceData || 0n) as bigint;

	const { data: tokenAllowanceData } = useReadContract({
		address: selectedToken as Address,
		abi: pTokenABI,
		functionName: "allowance",
		args: selectedToken ? [address as Address, tokenFactoryAddress] : undefined,
	});

	const tokenAllowance = (tokenAllowanceData || 0n) as bigint;

	// Calculate expected output
	const { data: expectedOutputData } = useReadContract({
		address: tokenFactoryAddress,
		abi: tokenFactoryABI,
		functionName: isSelling ? "calculateSellReturn" : "calculateBuyTokenCost",
		args: selectedToken && amount ? [selectedToken as Address, BigInt(amount)] : undefined,
	});

	const expectedOutput = (expectedOutputData || 0n) as bigint;

	// Handle token approval
	const handleApprove = async () => {
		if (!publicClient || !walletClient || !address || !selectedToken) return;
		
		try {
			setIsLoading(true);
			setError("");

			const approvalAmount = parseEther("1000000"); // Higher approval amount for convenience
			const tokenToApprove = isSelling ? selectedToken : pTokenAddress;

			const { request } = await publicClient.simulateContract({
				account: address,
				address: tokenToApprove,
				abi: pTokenABI,
				functionName: "approve",
				args: [tokenFactoryAddress, approvalAmount],
			});

			const hash = await walletClient.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
			
			// Wait for a few blocks to ensure the state is updated
			await new Promise(resolve => setTimeout(resolve, 2000));
			
		} catch (err) {
			console.error("Approval error:", err);
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("An error occurred during approval");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSwap = async () => {
		if (!publicClient || !walletClient || !address || !amount || !selectedToken) return;
		
		try {
			setIsLoading(true);
			setError("");

			// Convert amount to BigInt for contract interaction
			const tokenAmount = BigInt(amount);

			// Check and handle approvals
			if (!isSelling && ptokenAllowance < expectedOutput) {
				await handleApprove();
				return;
			} else if (isSelling && tokenAllowance < tokenAmount) {
				await handleApprove();
				return;
			}

			// Execute swap with token amount
			const { request } = await publicClient.simulateContract({
				account: address,
				address: tokenFactoryAddress,
				abi: tokenFactoryABI,
				functionName: isSelling ? "sellMemeToken" : "buyMemeToken",
				args: [selectedToken, tokenAmount],
			});

			const hash = await walletClient.writeContract(request);
			await publicClient.waitForTransactionReceipt({ hash });
			setAmount("1");
		} catch (err) {
			console.error("Swap error:", err);
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("An error occurred during the swap");
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Check if approval is needed
	const needsPTokenApproval =
		!isSelling && ptokenAllowance < expectedOutput;

	const needsTokenApproval =
		isSelling && amount && tokenAllowance < BigInt(amount);

	const needsApproval = needsPTokenApproval || needsTokenApproval;

	// Handle amount input change with validation
	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value === "" || value === "0") {
			setAmount("1");
			return;
		}

		// Ensure it's a valid positive integer
		const parsedValue = parseInt(value);
		if (!isNaN(parsedValue) && parsedValue > 0) {
			setAmount(parsedValue.toString());
		}
	};

	useEffect(() => {
		if (defaultTokenAddress) {
			setSelectedToken(defaultTokenAddress);
			setIsSelling(true); // Default to selling mode when token is pre-selected
		}
	}, [defaultTokenAddress]);

	return (
		<Card className="w-full max-w-md mx-auto bg-background/100 backdrop-blur-sm border border-white/10">
			<CardHeader>
				<CardTitle>{isSelling ? "Sell" : "Buy"} AI Tokens</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<Label>Trading Mode</Label>
						<div className="flex items-center space-x-2">
							<Label>Buy</Label>
							<Switch
								checked={isSelling}
								onCheckedChange={setIsSelling}
								disabled={isLoading}
							/>
							<Label>Sell</Label>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Select Token</Label>
						<Select
							value={selectedToken}
							onValueChange={(value: Address) => setSelectedToken(value)}
							disabled={isLoading}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a token">
									{selectedToken && selectedTokenDetails && (
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage src={selectedTokenDetails.tokenImageUrl} />
												<AvatarFallback>
													<ImageIcon className="h-4 w-4" />
												</AvatarFallback>
											</Avatar>
											<span>
												{selectedTokenDetails.name} ({selectedTokenDetails.symbol})
											</span>
										</div>
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{tokens.map((token) => (
									<SelectItem
										key={token.tokenAddress}
										value={token.tokenAddress}
										className="flex items-center gap-2 py-2"
									>
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage src={token.tokenImageUrl} />
												<AvatarFallback>
													<ImageIcon className="h-4 w-4" />
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="font-medium">{token.name} ({token.symbol})</span>
												{token.description && (
													<span className="text-xs text-muted-foreground">{token.description}</span>
												)}
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Amount</Label>
						<Input
							type="number"
							value={amount}
							onChange={handleAmountChange}
							min="1"
							disabled={isLoading}
							className="bg-background/20 backdrop-blur-sm text-white placeholder-white/70"
						/>
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Button
						onClick={needsApproval ? handleApprove : handleSwap}
						disabled={!selectedToken || isLoading}
						className="w-full bg-primary/80 hover:bg-primary/90 backdrop-blur-sm"
					>
						{isLoading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : needsApproval ? (
							"Approve"
						) : (
							isSelling ? "Sell" : "Buy"
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default SwapWidget;
