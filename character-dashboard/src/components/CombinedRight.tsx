import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SwapWidget from "./SwapWidget";
import CharacterFlow from "./CharacterFlow";

const CombinedRightPanel = ({ character }) => {
	return (
		<Card className="flex-1 min-h-[600px]">
			<CardContent className="p-4 h-full">
				<Tabs defaultValue="swap" className="h-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="swap">Swap</TabsTrigger>
						<TabsTrigger value="flow">Character View</TabsTrigger>
					</TabsList>
					<TabsContent value="swap" className="h-[calc(100%-48px)] mt-4">
						<div className="flex items-center justify-center h-full">
							<SwapWidget />
						</div>
					</TabsContent>
					<TabsContent value="flow" className="h-[calc(100%-48px)] mt-4">
						{character && <CharacterFlow character={character} />}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};

export default CombinedRightPanel;
