import  { useState, useEffect } from "react";
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
import {
  Plus,
  Loader2,
  MessageCircle,
  Trash2,
  Edit,
  Star,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";

interface Character {
  id: string;
  name: string;
  description: string;
  evm_address: string;
}

interface CharacterCardProps {
  character: Character;
  featured?: boolean;
  onDelete: (name: string) => void;
  onNavigate: (path: string) => void;
}



const useCharacterAvatar = (name: unknown) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await fetch(
          `https://nekos.best/api/v2/search?query=${encodeURIComponent(name as string)}&type=1`,
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.results.length);
          setAvatarUrl(data.results[randomIndex].url);
        }
      } catch (error) {
        console.error("Error fetching avatar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [name]);

  return { avatarUrl, loading };
};

const CharacterCard = ({
  character,
  featured = false,
  onDelete,
  onNavigate,
}: CharacterCardProps) => {
  const { avatarUrl, loading: avatarLoading } = useCharacterAvatar(
    character.name,
  );

  const shortenAddress = (address: string ) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (featured) {
    return (
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-2 ring-offset-2">
                  {avatarLoading ? (
                    <div className="animate-pulse bg-muted h-full w-full rounded-full" />
                  ) : (
                    <AvatarImage
                      src={avatarUrl!}
                      alt={character.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-2xl">
                    {character.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -top-2 -right-2">
                  <Star className="h-8 w-8" />
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{character.name}</CardTitle>
                  <Badge variant="secondary">Featured</Badge>
                </div>
                <CardDescription className="text-base">
                  Most interactive AI character
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => onNavigate(`/chat/${character.name}`)}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Start Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground mt-2 text-lg">
              {character.description}
            </p>
            <Badge variant="outline" className="font-mono">
              {shortenAddress(character.evm_address)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col transition-shadow duration-300 group">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 ring-1 ring-offset-1">
            {avatarLoading ? (
              <div className="animate-pulse bg-muted h-full w-full rounded-full" />
            ) : (
              <AvatarImage
                src={avatarUrl!}
                alt={character.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-lg">
              {character.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{character.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
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
      <CardFooter className="flex justify-end gap-2 mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(`/chat/${character.name}`)}
          title="Chat with character"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(`/edit/${character.name}`)}
          title="Edit character"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(character.name)}
          title="Delete character"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const CharacterDashboard = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacters();
    setError(null);
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch("${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/characters");
      if (!response.ok) throw new Error("Failed to fetch characters");
      const data = await response.json();
      setCharacters(data.characters);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (characterName: string) => {
    // Implement delete functionality
    console.log(characterName);
    await fetchCharacters();
  };

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        <Navbar />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Characters</h1>
            <p className="text-muted-foreground mt-2 text-lg">
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
            <Loader2 className="h-12 w-12 animate-spin" />
          </div>
        ) : characters.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed">
            <CardHeader>
              <Sparkles className="h-12 w-12 mb-4" />
              <CardTitle className="text-2xl">No Characters Yet</CardTitle>
              <CardDescription className="text-lg">
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
            {featuredCharacter && (
              <CharacterCard
                character={featuredCharacter}
                featured={true}
                onDelete={handleDelete}
                onNavigate={navigate}
              />
            )}

            <Separator className="my-12" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {characters.slice(1).map((character) => (
                <CharacterCard
                  key={character!.id}
                  character={character}
                  onDelete={handleDelete}
                  onNavigate={navigate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterDashboard;
