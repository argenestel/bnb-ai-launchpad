import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function saveCharacter(characterData) {
	try {
		// Create generated directory if it doesn't exist
		const generatedDir = path.join(process.cwd(), "generated");
		await fs.mkdir(generatedDir, { recursive: true });

		// Create filename with timestamp
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const sanitizedName = characterData.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_");
		const filename = `${sanitizedName}_${timestamp}.json`;
		const filePath = path.join(generatedDir, filename);

		// Write file with proper formatting
		await fs.writeFile(
			filePath,
			JSON.stringify(characterData, null, 2),
			"utf8",
		);

		console.log(`Character saved successfully to: ${filePath}`);

		return {
			success: true,
			filename,
			path: filePath,
		};
	} catch (error) {
		console.error("Error saving character:", error);
		throw new Error(`Failed to save character: ${error.message}`);
	}
}
