//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, MessageCircle, Trash2, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SplitInterface from "./SplitInterface";
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

	if (error) {
		return (
			<div className="container mx-auto py-8">
				<Alert variant="destructive">
					<AlertDescription>Error: {error}</AlertDescription>
				</Alert>
				<Button onClick={fetchCharacters} className="mt-4">
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 space-y-8">
			<Navbar />
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Characters</h1>
					<p className="text-muted-foreground">Manage your AI characters</p>
				</div>
				<Button
					onClick={() => navigate("/create")}
					className="flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
					Create Character
				</Button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center h-96">
					<Loader2 className="w-8 h-8 animate-spin" />
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
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Model Provider</TableHead>
								<TableHead>Voice Model</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{characters.map((character) => (
								<TableRow key={character.name}>
									<TableCell className="font-medium">
										{character.name}
									</TableCell>
									<TableCell className="max-w-md truncate">
										{character.description}
									</TableCell>
									<TableCell>{character.modelProvider}</TableCell>
									<TableCell>{character.settings?.voice?.model}</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="icon"
												onClick={() => navigate(`/chat/${character.name}`)}
												title="Chat with character"
											>
												<MessageCircle className="w-4 h-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												onClick={() => navigate(`/edit/${character.name}`)}
												title="Edit character"
											>
												<Edit className="w-4 h-4" />
											</Button>
											<Button
												variant="outline"
												size="icon"
												onClick={() => handleDelete(character.name)}
												title="Delete character"
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
};

export default CharacterDashboard;
