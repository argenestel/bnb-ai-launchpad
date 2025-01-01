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

export const WalletDetails = ({
	userWalletAddress,
	userBalance,
	character,
	characterBalance,
}) => (
	<Sheet>
		<SheetTrigger asChild>
			<Button variant="outline" size="icon" className="backdrop-blur-sm">
				<Wallet className="h-4 w-4" />
			</Button>
		</SheetTrigger>
		<SheetContent>
			<SheetHeader>
				<SheetTitle>Wallet Information</SheetTitle>
			</SheetHeader>
			<div className="space-y-6 py-4">
				{/* User Wallet */}
				<div>
					<h3 className="font-semibold mb-2">Your Wallet</h3>
					<div className="space-y-2">
						<p className="font-mono text-sm bg-muted p-2 rounded">
							{userWalletAddress}
						</p>
						<p className="text-sm">
							Balance:{" "}
							{userBalance
								? `${formatEther(userBalance?.value)} ${userBalance?.symbol}`
								: "0"}
						</p>
					</div>
				</div>

				{/* Character Wallet */}
				<div>
					<h3 className="font-semibold mb-2">Character Wallet</h3>
					<div className="space-y-2">
						<p className="font-mono text-sm bg-muted p-2 rounded">
							{character?.evm_address}
						</p>
						<p className="text-sm">
							Balance:{" "}
							{characterBalance
								? `${formatEther(characterBalance?.value)} ${characterBalance?.symbol}`
								: "0"}
						</p>
					</div>
				</div>
			</div>
		</SheetContent>
	</Sheet>
);
