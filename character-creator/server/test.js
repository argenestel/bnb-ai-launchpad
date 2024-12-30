import CharacterStorage from "./services/storage.js";

const store = new CharacterStorage();
try {
  const characterData = {
    name: "Test Character",
    description: "A sample character for testing storage",
  };

  const storedCharacter = await store.storeCharacter(characterData);
  console.log("Stored character:", storedCharacter);
} catch (error) {
  console.error("Error storing character:", error);
}
