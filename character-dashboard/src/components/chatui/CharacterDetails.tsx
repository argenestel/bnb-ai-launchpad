//@ts-nocheck
import React from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Wallet } from "lucide-react";
import { formatEther } from "viem";

export const CharacterDetails = ({ character, backgroundUrl }) => (
	<Sheet>
		<SheetTrigger asChild>
			<Button variant="outline" size="icon" className="backdrop-blur-sm">
				<BookOpen className="h-4 w-4" />
			</Button>
		</SheetTrigger>
		<SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
			<SheetHeader>
				<SheetTitle className="flex items-center gap-4">
					<Avatar className="h-10 w-10">
						<AvatarImage src={backgroundUrl} alt={character?.name} />
						<AvatarFallback>{character?.name?.[0]}</AvatarFallback>
					</Avatar>
					{character?.name}
				</SheetTitle>
			</SheetHeader>
			<div className="space-y-6 py-4">
				{/* About */}
				<div>
					<h3 className="font-semibold mb-2">About</h3>
					<p className="text-sm text-muted-foreground">
						{character?.description}
					</p>
				</div>

				{/* Topics */}
				{character?.topics && (
					<div>
						<h3 className="font-semibold mb-2">Topics</h3>
						<div className="flex flex-wrap gap-2">
							{character.topics.map((topic, i) => (
								<Badge key={i} variant="secondary">
									{topic}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Personality */}
				{character?.adjectives && (
					<div>
						<h3 className="font-semibold mb-2">Personality Traits</h3>
						<div className="flex flex-wrap gap-2">
							{character.adjectives.map((adj, i) => (
								<Badge key={i} variant="outline">
									{adj}
								</Badge>
							))}
						</div>
					</div>
				)}

				{/* Knowledge */}
				{character?.knowledge && (
					<div>
						<h3 className="font-semibold mb-2">Knowledge Areas</h3>
						<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
							{character.knowledge.map((item, i) => (
								<li key={i}>{item}</li>
							))}
						</ul>
					</div>
				)}

				{/* Bio */}
				{character?.bio && (
					<div>
						<h3 className="font-semibold mb-2">Biography</h3>
						<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
							{character.bio.map((item, i) => (
								<li key={i}>{item}</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</SheetContent>
	</Sheet>
);

export function WalletDetails({
	userWalletAddress,
	userBalance,
	character,
	characterBalance,
}: {
	userWalletAddress?: string;
	userBalance?: { value: bigint };
	character?: any;
	characterBalance?: { value: bigint };
}) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" className="backdrop-blur-sm">
					<Wallet className="w-4 h-4 mr-2" />
					Wallet
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Wallet Details</SheetTitle>
				</SheetHeader>
				<div className="mt-4 space-y-4">
					{/* Character Wallet */}
					{character && (
						<div className="space-y-2">
							<h3 className="font-medium">Character Wallet</h3>
							<div className="p-3 rounded-lg bg-muted space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Address</span>
									<code className="text-xs">
										{character.evm_address?.slice(0, 6)}...{character.evm_address?.slice(-4)}
									</code>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Balance</span>
									<span>{characterBalance ? formatEther(characterBalance.value) : "0"} ETH</span>
								</div>
								{character.token && (
									<div className="flex items-center justify-between">
										<span className="text-sm text-muted-foreground">Token</span>
										<Badge variant="outline" className="font-mono">
											${character.token.symbol}
										</Badge>
									</div>
								)}
							</div>
						</div>
					)}

					{/* User Wallet */}
					{userWalletAddress && (
						<div className="space-y-2">
							<h3 className="font-medium">Your Wallet</h3>
							<div className="p-3 rounded-lg bg-muted space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Address</span>
									<code className="text-xs">
										{userWalletAddress.slice(0, 6)}...{userWalletAddress.slice(-4)}
									</code>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">Balance</span>
									<span>{userBalance ? formatEther(userBalance.value) : "0"} ETH</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
