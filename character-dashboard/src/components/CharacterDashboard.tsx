import { useState, useEffect } from "react";
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
  Gamepad2,
  Users,
  Activity,
  BarChart3,
  ChevronRight,
  Twitter,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Character {
  id: string;
  name: string;
  description: string;
  evm_address: string;
  type: 'game_character' | 'ai_character';
  twitter_handle?: string;
  token?: {
    address: string;
  };
}

interface CharacterCardProps {
  character: Character;
  featured?: boolean;
  onDelete: (name: string) => void;
  onNavigate: (path: string) => void;
}

interface Game extends Character {
  type: 'game_character';
  theme: string;
  goal: string;
  antagonist: string;
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

const shortenAddress = (address: string | undefined) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}

const StatCard = ({ title, value, icon: Icon, trend }: StatCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <Badge variant={trend > 0 ? "default" : "destructive"} className="text-xs">
                {trend > 0 ? "+" : ""}{trend}%
              </Badge>
            )}
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-full">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const CharacterCard = ({
  character,
  featured = false,
  onDelete,
  onNavigate,
}: CharacterCardProps) => {
  const { avatarUrl, loading: avatarLoading } = useCharacterAvatar(character.name);
  const [interactions] = useState(Math.floor(Math.random() * 1000)); // Simulated data
  const [rating] = useState(4 + Math.random()); // Simulated data

  if (featured) {
    return (
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2">
                  {avatarLoading ? (
                    <div className="animate-pulse bg-muted h-full w-full rounded-full" />
                  ) : (
                    <AvatarImage
                      src={avatarUrl!}
                      alt={character.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-2xl bg-primary/20">
                    {character.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -top-2 -right-2">
                  <Star className="h-8 w-8 text-primary fill-primary" />
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{character.name}</CardTitle>
                  <Badge variant="secondary" className="bg-primary/20">Featured</Badge>
                  {character.twitter_handle && (
                    <a
                      href={`https://twitter.com/${character.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                </div>
                <CardDescription className="text-base">
                  Most interactive AI character
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {interactions} interactions
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {rating.toFixed(1)} rating
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => onNavigate(`/chat/${character.name}`)}
                className="w-full gap-2"
                size="lg"
              >
                <MessageCircle className="h-4 w-4" />
                Start Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate(`/edit/${character.name}`)}
                className="w-full gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Character
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground mt-2 text-lg">
              {character.description}
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="font-mono bg-primary/5">
                {shortenAddress(character.evm_address)}
              </Badge>
              {character.token?.address && (
                <Badge variant="outline" className="font-mono bg-primary/5">
                  Token: {shortenAddress(character.token.address)}
                </Badge>
              )}
            </div>
            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Engagement Score</span>
                <span className="font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary/50 group">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 ring-1 ring-primary/20 ring-offset-1 transition-all duration-300 group-hover:ring-primary/50">
            {avatarLoading ? (
              <div className="animate-pulse bg-muted h-full w-full rounded-full" />
            ) : (
              <AvatarImage
                src={avatarUrl!}
                alt={character.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-lg bg-primary/10">
              {character.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{character.name}</CardTitle>
              {character.twitter_handle && (
                <a
                  href={`https://twitter.com/${character.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
            <CardDescription className="line-clamp-2 mt-1">
              {character.description}
            </CardDescription>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {interactions}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {rating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Badge variant="outline" className="font-mono bg-primary/5">
          {shortenAddress(character.evm_address)}
        </Badge>
      </CardContent>
      <CardFooter className="flex justify-between gap-2 mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          className="flex-1 group-hover:bg-primary/10"
          onClick={() => onNavigate(`/chat/${character.name}`)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(`/edit/${character.name}`)}
          className="group-hover:bg-primary/10"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(character.name)}
          className="group-hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const GameCard = ({
  game,
  featured = false,
  onDelete,
  onNavigate,
}: {
  game: Game;
  featured?: boolean;
  onDelete: (name: string) => void;
  onNavigate: (path: string) => void;
}) => {
  const { avatarUrl, loading: avatarLoading } = useCharacterAvatar(game.name);

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
                    <AvatarImage src={avatarUrl!} alt={game.name} className="object-cover" />
                  )}
                  <AvatarFallback className="text-2xl">
                    <Gamepad2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{game.name}</CardTitle>
                  <Badge variant="secondary">Featured Game</Badge>
                </div>
                <CardDescription className="text-base">
                  {game.theme || game.description}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => onNavigate(`/game/${game.name}`)} className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Play Game
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground mt-2">Goal: {game.goal}</p>
            <p className="text-muted-foreground">Antagonist: {game.antagonist}</p>
            {game.evm_address && (
              <Badge variant="outline" className="font-mono">
                {shortenAddress(game.evm_address)}
              </Badge>
            )}
            {game.token?.address && (
              <Badge variant="outline" className="font-mono">
                {shortenAddress(game.token.address)}
              </Badge>
            )}
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
              <AvatarImage src={avatarUrl!} alt={game.name} className="object-cover" />
            )}
            <AvatarFallback>
              <Gamepad2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{game.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {game.theme || game.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Goal: {game.goal}</p>
        {game.evm_address && (
          <Badge variant="outline" className="font-mono">
            {shortenAddress(game.evm_address)}
          </Badge>
        )}
        {game.token?.address && (
          <Badge variant="outline" className="font-mono">
            {shortenAddress(game.token.address)}
          </Badge>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 mt-auto pt-4 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate(`/game/${game.name}`)}
          title="Play game"
        >
          <Gamepad2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(game.name)}
          title="Delete game"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

const CharacterDashboard = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [games, setGames] = useState<Game[]>([]);
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/characters`);
      if (!response.ok) throw new Error("Failed to fetch characters");
      const data = await response.json();
      
      // Separate games and characters
      const allCharacters = data.characters || [];
      setCharacters(allCharacters.filter((char: Character) => char.type !== 'game_character'));
      setGames(allCharacters.filter((char: Character) => char.type === 'game_character'));
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
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your AI characters and games
            </p>
          </div>
          <div className="flex gap-4">

            <Button onClick={() => navigate("/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Characters"
            value={characters.length.toString()}
            icon={Users}
            trend={12}
          />
          <StatCard
            title="Total Games"
            value={games.length.toString()}
            icon={Gamepad2}
            trend={8}
          />
          <StatCard
            title="Total Interactions"
            value={(characters.length * 150).toString()}
            icon={Activity}
            trend={24}
          />
          <StatCard
            title="Engagement Rate"
            value="78%"
            icon={BarChart3}
            trend={5}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : characters.length === 0 && games.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed">
            <CardHeader>
              <Sparkles className="h-12 w-12 mb-4 text-primary" />
              <CardTitle className="text-2xl">No Content Yet</CardTitle>
              <CardDescription className="text-lg">
                Get started by creating your first AI character or game
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-4">

              <Button onClick={() => navigate("/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="characters" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
              <TabsTrigger value="characters" className="gap-2">
                <Users className="h-4 w-4" />
                AI Agents
              </TabsTrigger>
              <TabsTrigger value="games" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                AI Games
              </TabsTrigger>
            </TabsList>

            <TabsContent value="characters">
              {characters.length > 0 && (
                <>
                  {characters[0] && (
                    <CharacterCard
                      character={characters[0]}
                      featured={true}
                      onDelete={handleDelete}
                      onNavigate={navigate}
                    />
                  )}

                  {characters.length > 1 && (
                    <>
                      <div className="flex justify-between items-center my-8">
                        <h2 className="text-2xl font-semibold">All Characters</h2>
                        <Button variant="ghost" className="gap-2">
                          View All <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {characters.slice(1).map((character) => (
                          <CharacterCard
                            key={character.id}
                            character={character}
                            onDelete={handleDelete}
                            onNavigate={navigate}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="games">
              {games.length > 0 && (
                <>
                  {games[0] && (
                    <GameCard
                      game={games[0]}
                      featured={true}
                      onDelete={handleDelete}
                      onNavigate={navigate}
                    />
                  )}

                  {games.length > 1 && (
                    <>
                      <div className="flex justify-between items-center my-8">
                        <h2 className="text-2xl font-semibold">All Games</h2>
                        <Button variant="ghost" className="gap-2">
                          View All <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {games.slice(1).map((game) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            onDelete={handleDelete}
                            onNavigate={navigate}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CharacterDashboard;
