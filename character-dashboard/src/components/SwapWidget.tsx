//@ts-nocheck
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Settings, ChevronDown } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const SwapWidget = () => {
	const [fromToken, setFromToken] = useState("ETH");
	const [toToken, setToToken] = useState("USDC");
	const [fromAmount, setFromAmount] = useState("");
	const [toAmount, setToAmount] = useState("");

	// Mock token list - in a real app, this would come from an API or config
	const tokens = [
		{ symbol: "ETH", name: "Ethereum", balance: "1.5" },
		{ symbol: "USDC", name: "USD Coin", balance: "1000.00" },
		{ symbol: "USDT", name: "Tether", balance: "1000.00" },
		{ symbol: "DAI", name: "Dai", balance: "1000.00" },
	];

	const handleSwapTokens = () => {
		const tempFromToken = fromToken;
		const tempFromAmount = fromAmount;

		setFromToken(toToken);
		setFromAmount(toAmount);
		setToToken(tempFromToken);
		setToAmount(tempFromAmount);
	};

	const TokenSelect = ({ value, onChange, tokens }) => (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-[120px]">
				<SelectValue placeholder="Select token" />
			</SelectTrigger>
			<SelectContent>
				{tokens.map((token) => (
					<SelectItem key={token.symbol} value={token.symbol}>
						<div className="flex items-center gap-2">
							<div className="w-5 h-5 rounded-full bg-primary" />
							<span>{token.symbol}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<div className="flex justify-between items-center">
					<CardTitle>Swap</CardTitle>
					<Button variant="ghost" size="icon">
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* From Token */}
				<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
					<div className="p-4 space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">You pay</span>
							<span className="text-sm text-muted-foreground">
								Balance: {tokens.find((t) => t.symbol === fromToken)?.balance}{" "}
								{fromToken}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								placeholder="0.0"
								value={fromAmount}
								onChange={(e) => setFromAmount(e.target.value)}
								className="border-0 bg-transparent text-2xl focus-visible:ring-0"
							/>
							<TokenSelect
								value={fromToken}
								onChange={setFromToken}
								tokens={tokens}
							/>
						</div>
					</div>
				</div>

				{/* Swap Button */}
				<div className="flex justify-center -my-2 z-10">
					<Button
						variant="outline"
						size="icon"
						className="rounded-full bg-background h-10 w-10"
						onClick={handleSwapTokens}
					>
						<ArrowUpDown className="h-4 w-4" />
					</Button>
				</div>

				{/* To Token */}
				<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
					<div className="p-4 space-y-2">
						<div className="flex justify-between items-center">
							<span className="text-sm text-muted-foreground">You receive</span>
							<span className="text-sm text-muted-foreground">
								Balance: {tokens.find((t) => t.symbol === toToken)?.balance}{" "}
								{toToken}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Input
								type="number"
								placeholder="0.0"
								value={toAmount}
								onChange={(e) => setToAmount(e.target.value)}
								className="border-0 bg-transparent text-2xl focus-visible:ring-0"
							/>
							<TokenSelect
								value={toToken}
								onChange={setToToken}
								tokens={tokens}
							/>
						</div>
					</div>
				</div>

				{/* Price Info */}
				<div className="px-2 py-3 rounded-lg bg-muted/50">
					<div className="flex justify-between items-center text-sm">
						<span className="text-muted-foreground">Price</span>
						<span>
							1 {fromToken} = 1,800 {toToken}
						</span>
					</div>
				</div>

				{/* Swap Button */}
				<Button className="w-full" size="lg">
					Swap Tokens
				</Button>
			</CardContent>
		</Card>
	);
};

export default SwapWidget;
