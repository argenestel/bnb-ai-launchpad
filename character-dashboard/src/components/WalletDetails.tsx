import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalance } from "wagmi";

const Wallet = ({ address, label }) => {
	const { data: balance, isLoading: isBalanceLoading } = useBalance({
		address: address,
	});

	const shortenAddress = (addr) => {
		if (!addr) return "";
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-medium">{label}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<Badge variant="outline" className="font-mono">
						{shortenAddress(address)}
					</Badge>
					<div className="text-sm">
						{isBalanceLoading ? (
							<Skeleton className="h-4 w-24" />
						) : balance ? (
							<span>
								{parseFloat(balance?.formatted).toFixed(4)} {balance?.symbol}
							</span>
						) : (
							"0 ETH"
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

const CharacterWallet = ({ characterName }) => {
	const [wallet, setWallet] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchWallet = async () => {
			try {
				const response = await fetch(
					`http://localhost:3000/characters/${characterName}/wallet`,
				);
				if (!response.ok) throw new Error("Failed to fetch wallet");
				const data = await response.json();
				setWallet(data.data);
			} catch (err) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};

		if (characterName) {
			fetchWallet();
		}
	}, [characterName]);

	if (isLoading) {
		return <Skeleton className="h-[120px] w-full" />;
	}

	if (error) {
		return (
			<div className="text-sm text-destructive">
				Error loading wallet: {error}
			</div>
		);
	}

	return wallet ? (
		<Wallet address={wallet.evmAddress} label={`${characterName}'s Wallet`} />
	) : null;
};

export { Wallet, CharacterWallet };
