//@ts-nocheck
import React, { useState, useEffect } from "react";
import { formatEther, parseEther } from "viem";
import {
	useAccount,
	useReadContract,
	useWalletClient,
	usePublicClient,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

const SwapWidget = ({
	tokenFactoryAddress,
	tokenFactoryABI,
	pTokenAddress,
	pTokenABI,
	defaultTokenAddress,
	defaultTokenInfo
}) => {
	const [amount, setAmount] = useState("1"); // Default to 1 token
	const [selectedToken, setSelectedToken] = useState(defaultTokenAddress || "");
	const [isSelling, setIsSelling] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [txHash, setTxHash] = useState("");

	const { address } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();

	// Get all available tokens
	const { data: tokens } = useReadContract({
		address: tokenFactoryAddress,
		abi: tokenFactoryABI,
		functionName: "getAllMemeTokens",
	});

	// Set default token when it becomes available
	useEffect(() => {
		if (defaultTokenAddress) {
			setSelectedToken(defaultTokenAddress);
		}
	}, [defaultTokenAddress, tokens]);

	// Read allowances for both PTOKEN and selected token
	const { data: ptokenAllowance, refetch: refetchPTokenAllowance } =
		useReadContract({
			address: pTokenAddress,
			abi: pTokenABI,
			functionName: "allowance",
			args: [address, tokenFactoryAddress],
			watch: true,
		});

	const { data: tokenAllowance, refetch: refetchTokenAllowance } =
		useReadContract({
			address: selectedToken,
			abi: pTokenABI,
			functionName: "allowance",
			args: selectedToken ? [address, tokenFactoryAddress] : undefined,
			enabled: !!selectedToken,
			watch: true,
		});

	// Calculate expected output with safe BigInt conversion
	const { data: expectedOutput } = useReadContract({
		address: tokenFactoryAddress,
		abi: tokenFactoryABI,
		functionName: isSelling ? "calculateSellReturn" : "calculateBuyTokenCost",
		args: selectedToken && amount ? [selectedToken, BigInt(Math.floor(Number(amount)))] : undefined,
		enabled: !!selectedToken && !!amount,
	});

	// Handle token approval
	const handleApprove = async (tokenAddress, spenderAddress, amount) => {
		try {
			setIsLoading(true);
			setError("");

			const { request } = await publicClient.simulateContract({
				account: address,
				address: tokenAddress,
				abi: pTokenABI,
				functionName: "approve",
				args: [spenderAddress, amount],
			});

			const hash = await walletClient.writeContract(request);
			setTxHash(hash);

			await publicClient.waitForTransactionReceipt({ hash });
			await refetchPTokenAllowance();
			if (selectedToken) await refetchTokenAllowance();
		} catch (err) {
			console.error("Approval error:", err);
			throw err;
		}
	};

	const handleSwap = async () => {
		if (!walletClient || !amount || !selectedToken) return;
		try {
			setIsLoading(true);
			setError("");

			// Convert amount to BigInt safely
			const tokenAmount = BigInt(Math.floor(Number(amount)));

			// Check and handle approvals
			if (!isSelling) {
				// For buying, check PTOKEN allowance
				if (!ptokenAllowance || ptokenAllowance < (expectedOutput || 0n)) {
					await handleApprove(
						pTokenAddress,
						tokenFactoryAddress,
						parseEther("1000000"), // Higher approval amount for convenience
					);
				}
			} else {
				// For selling, check token allowance
				if (!tokenAllowance || tokenAllowance < tokenAmount) {
					await handleApprove(
						selectedToken,
						tokenFactoryAddress,
						parseEther("1000000"), // Higher approval amount for convenience
					);
					return;
				}
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
			setTxHash(hash);

			await publicClient.waitForTransactionReceipt({ hash });
			setAmount("1");
		} catch (err) {
			console.error("Swap error:", err);
			setError(err.message || "An error occurred during the swap");
		} finally {
			setIsLoading(false);
		}
	};

	// Check if approval is needed
	const needsPTokenApproval =
		!isSelling &&
		expectedOutput &&
		(!ptokenAllowance || ptokenAllowance < expectedOutput);

	const needsTokenApproval =
		isSelling && amount && (!tokenAllowance || tokenAllowance < BigInt(Math.floor(Number(amount))));

	const needsApproval = needsPTokenApproval || needsTokenApproval;

	// Handle amount input change with validation
	const handleAmountChange = (e) => {
		const value = e.target.value;
		if (value === "" || value === "0") {
			setAmount("1");
			return;
		}

		// Ensure it's a valid positive number
		const parsedValue = parseFloat(value);
		if (!isNaN(parsedValue) && parsedValue > 0) {
			// Limit to 18 decimal places to prevent overflow
			const limitedValue = Math.min(parsedValue, 1e18);
			setAmount(limitedValue.toString());
		}
	};

	// Combine default token with fetched tokens
	const allTokens = React.useMemo(() => {
		if (!tokens) return [];
		if (!defaultTokenInfo) return tokens;
		
		// Check if default token is already in the list
		const defaultTokenExists = tokens.some(t => t.tokenAddress === defaultTokenInfo.address);
		if (defaultTokenExists) return tokens;

		// Add default token to the list
		return [{
			tokenAddress: defaultTokenInfo.address,
			name: defaultTokenInfo.name,
			symbol: defaultTokenInfo.symbol
		}, ...tokens];
	}, [tokens, defaultTokenInfo]);

	return (
		<Card className="w-full max-w-md mx-auto">
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
							onValueChange={setSelectedToken}
							disabled={isLoading}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a token" />
							</SelectTrigger>
							<SelectContent>
								{allTokens?.map((token) => (
									<SelectItem
										key={token.tokenAddress}
										value={token.tokenAddress}
									>
										{token.name} ({token.symbol})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Amount</Label>
						<Input
							type="number"
							placeholder="Enter number of tokens"
							value={amount}
							onChange={handleAmountChange}
							disabled={isLoading}
							step="1"
							min="1"
							max="1000000000000000000"
							className="bg-background"
						/>
						<p className="text-xs text-muted-foreground">
							Enter the number of tokens you want to trade (max: 1e18)
						</p>
					</div>

					{expectedOutput && amount && (
						<Alert>
							<AlertTitle>
								Expected {isSelling ? "PTOKEN Return" : "Cost"}
							</AlertTitle>
							<AlertDescription>
								{formatEther(expectedOutput)} {isSelling ? "PTOKEN" : "tokens"}
							</AlertDescription>
						</Alert>
					)}

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Button
						onClick={handleSwap}
						disabled={
							!walletClient ||
							isLoading ||
							!selectedToken ||
							!amount ||
							amount === "0"
						}
						className="w-full"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{needsApproval
									? `Approving ${needsPTokenApproval ? "PTOKEN" : "Token"}...`
									: "Swapping..."}
							</>
						) : needsApproval ? (
							`Approve ${needsPTokenApproval ? "PTOKEN" : "Token"}`
						) : (
							`${isSelling ? "Sell" : "Buy"} Tokens`
						)}
					</Button>

					{txHash && (
						<Alert>
							<AlertTitle>Transaction Sent</AlertTitle>
							<AlertDescription>
								<div className="break-all">{txHash}</div>
							</AlertDescription>
						</Alert>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default SwapWidget;
