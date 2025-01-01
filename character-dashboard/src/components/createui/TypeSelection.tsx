//@ts-nocheck
import React from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CharacterType } from "@/types";
import { CHARACTER_TYPES } from "../characterTypes";

interface TypeSelectionProps {
	onTypeSelect: (type: CharacterType) => void;
	selectedType: CharacterType | null;
}

export const TypeSelection: React.FC<TypeSelectionProps> = ({
	onTypeSelect,
	selectedType,
}) => {
	return (
		<Card className="w-full max-w-4xl mx-auto">
			<CardHeader>
				<CardTitle>Choose Character Type</CardTitle>
				<CardDescription>
					Select the type of character you want to create
				</CardDescription>
			</CardHeader>
			<CardContent>
				<RadioGroup
					className="grid grid-cols-1 md:grid-cols-3 gap-4"
					value={selectedType || undefined}
					onValueChange={(value) => onTypeSelect(value as CharacterType)}
				>
					{Object.entries(CHARACTER_TYPES).map(([key, info]) => {
						const Icon = info.icon;
						return (
							<label
								key={key}
								className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                  ${selectedType === key ? "border-primary" : "border-border"}
                  hover:border-primary/50 transition-colors`}
							>
								<RadioGroupItem value={key} className="sr-only" />
								<Icon className="w-8 h-8 mb-2" />
								<h3 className="font-semibold">{info.title}</h3>
								<p className="text-sm text-muted-foreground text-center mt-2">
									{info.description}
								</p>
								<div className="mt-4 flex flex-wrap gap-1">
									{info.defaultTraits.map((trait) => (
										<span
											key={trait}
											className="text-xs bg-muted px-2 py-1 rounded-full"
										>
											{trait}
										</span>
									))}
								</div>
							</label>
						);
					})}
				</RadioGroup>
			</CardContent>
		</Card>
	);
};
