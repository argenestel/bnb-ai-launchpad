//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, MessageCircle, Trash2, Edit, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";

const CharacterDashboard = () => {
	const [characters, setCharacters] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		fetchCharacters();
	}, []);

	const fetchCharacters = async () => {
		try {
			setLoading(true);
			const response = await fetch("http://localhost:3000/characters");
			if (!response.ok) throw new Error("Failed to fetch characters");
			const data = await response.json();
			setCharacters(data.characters);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (characterName) => {
		// Implement delete functionality
		await fetchCharacters();
	};

	const shortenAddress = (address) => {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	// Get the character with the most interactions (using the first character for now)
	const featuredCharacter = characters[0];

	if (error) {
		return (
			<div className="container mx-auto p-6">
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
				<Button onClick={fetchCharacters} className="mt-4">
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="container mx-auto p-6 space-y-8">
				<Navbar />
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Characters</h1>
						<p className="text-muted-foreground">
							Manage and interact with your AI characters
						</p>
					</div>
					<Button onClick={() => navigate("/create")}>
						<Plus className="mr-2 h-4 w-4" />
						Create Character
					</Button>
				</div>

				{loading ? (
					<div className="flex items-center justify-center h-96">
						<Loader2 className="h-8 w-8 animate-spin" />
					</div>
				) : characters.length === 0 ? (
					<Card className="flex flex-col items-center justify-center h-96 text-center">
						<CardHeader>
							<CardTitle>No Characters Yet</CardTitle>
							<CardDescription>
								Get started by creating your first AI character
							</CardDescription>
						</CardHeader>
						<CardFooter>
							<Button onClick={() => navigate("/create")}>
								Create Character
							</Button>
						</CardFooter>
					</Card>
				) : (
					<>
						{/* Featured Character Section */}
						{featuredCharacter && (
							<Card className="border-2">
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<Avatar className="h-20 w-20">
												<AvatarImage
													src={featuredCharacter.ipfs_url}
													alt={featuredCharacter.name}
												/>
												<AvatarFallback>
													{featuredCharacter.name[0]}
												</AvatarFallback>
											</Avatar>
											<div className="space-y-1">
												<div className="flex items-center space-x-2">
													<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
													<CardTitle>Featured Character</CardTitle>
												</div>
												<CardDescription>
													Most interactive AI character
												</CardDescription>
											</div>
										</div>
										<Button
											onClick={() =>
												navigate(`/chat/${featuredCharacter.name}`)
											}
										>
											<MessageCircle className="mr-2 h-4 w-4" />
											Start Chat
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div>
											<h3 className="text-2xl font-semibold">
												{featuredCharacter.name}
											</h3>
											<p className="text-muted-foreground mt-2">
												{featuredCharacter.description}
											</p>
										</div>
										<Badge variant="outline" className="font-mono">
											{shortenAddress(featuredCharacter.evm_address)}
										</Badge>
									</div>
								</CardContent>
							</Card>
						)}

						<Separator className="my-8" />

						{/* Character Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{characters.slice(1).map((character) => (
								<Card key={character.id} className="flex flex-col">
									<CardHeader>
										<div className="flex items-center space-x-4">
											<Avatar>
												<AvatarImage
													src={character.ipfs_url}
													alt={character.name}
												/>
												<AvatarFallback>{character.name[0]}</AvatarFallback>
											</Avatar>
											<div>
												<CardTitle>{character.name}</CardTitle>
												<CardDescription className="line-clamp-2">
													{character.description}
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<Badge variant="outline" className="font-mono">
											{shortenAddress(character.evm_address)}
										</Badge>
									</CardContent>
									<CardFooter className="flex justify-end gap-2 mt-auto">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => navigate(`/chat/${character.name}`)}
											title="Chat with character"
										>
											<MessageCircle className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => navigate(`/edit/${character.name}`)}
											title="Edit character"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(character.name)}
											title="Delete character"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</CardFooter>
								</Card>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default CharacterDashboard;
