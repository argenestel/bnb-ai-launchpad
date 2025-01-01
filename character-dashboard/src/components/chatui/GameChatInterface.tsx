import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, Gamepad2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAccount, useBalance } from "wagmi";
import { formatEther } from "viem";
import Navbar from "@/components/Navbar";
import CombinedRightPanel from "../CombinedRight";
import GameBackground from "./GameBackground";
import Message from "./Message";

interface Game {
  id: string;
  name: string;
  description: string;
  type: 'game_character';
  theme: string;
  goal: string;
  antagonist: string;
  evm_address?: string;
  token?: {
    address: string;
    imageUrl: string;
  };
}

interface GameMessage {
  role: 'user' | 'assistant';
  content: string;
  metadata: {
    timestamp: string;
    type?: string;
    walletAddress?: string;
  };
}

interface BackgroundMediaProps {
  characterName?: string;
  mode?: string;
  youtubeUrl?: string;
}

interface CombinedRightPanelProps {
  character: Game | null;
  isGame?: boolean;
}

const GameChatInterface = () => {
  const { characterName } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { address: userWalletAddress, isConnected } = useAccount();
  const { data: userBalance } = useBalance({
    address: userWalletAddress,
  });
  const { data: gameBalance } = useBalance({
    address: game?.evm_address as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (isConnected) {
      fetchGame();
    }
  }, [characterName, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchGame = async () => {
    try {
      // Encode the character name for the URL
      const encodedName = encodeURIComponent(characterName || '');
      console.log("Fetching game with name:", characterName);
      console.log("Encoded name:", encodedName);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/characters/${encodedName}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Game not found");
      }

      const data = await response.json();
      console.log("Received game data:", data);

      if (!data.data || data.data.type !== 'game_character') {
        throw new Error("Invalid game data received");
      }

      setGame(data.data);

      // Set initial game greeting
      setMessages([
        {
          role: "assistant",
          content: `Welcome to ${data.data.name}! ${data.data.theme ? `\nTheme: ${data.data.theme}` : ''}\nGoal: ${data.data.goal}\nAntagonist: ${data.data.antagonist}`,
          metadata: {
            timestamp: new Date().toISOString(),
            type: "game_start"
          },
        },
      ]);
    } catch (err) {
      console.error("Error fetching game:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch game");
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected || !game) return;

    const newMessage: GameMessage = {
      role: "user",
      content: inputMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        walletAddress: userWalletAddress,
      },
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      // Encode the game name for the URL
      const encodedName = encodeURIComponent(game.name);
      console.log("Sending message to game:", game.name);
      console.log("Encoded game name:", encodedName);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/chat/${encodedName}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: inputMessage,
            userId: userWalletAddress,
            conversationHistory: messages,
            context: {
              userBalance: userBalance ? formatEther(userBalance.value) : "0",
              gameBalance: gameBalance ? formatEther(gameBalance.value) : "0",
              gameDetails: {
                theme: game.theme,
                goal: game.goal,
                antagonist: game.antagonist
              }
            },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: GameMessage = {
        role: "assistant",
        content: data.message,
        metadata: {
          timestamp: new Date().toISOString(),
          type: "game_response"
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchGame} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <GameBackground 
          characterName={characterName}
          imageUrl={game?.token?.imageUrl}
        />
      </div>

      <Navbar />
      <div className="w-full flex-1 flex pt-4 flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {game?.token?.address && (
              <Badge variant="secondary" className="font-mono backdrop-blur-sm">
                {`${game.token.address.slice(0, 6)}...${game.token.address.slice(-4)}`}
              </Badge>
            )}
          </div>
          {game && (
            <h1 className="text-2xl font-bold text-white backdrop-blur-sm rounded-lg px-3 py-1">
              Playing {game.name}
            </h1>
          )}
        </div>

        {/* Main content */}
        {!isConnected ? (
          <Card className="p-6 relative backdrop-blur-sm bg-background/50">
            <CardContent className="text-center relative z-10">
              <h2 className="text-lg font-semibold mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to start playing
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-6 flex-1">
            {/* Game Chat Card */}
            <Card className="col-span-8 flex-1 flex flex-col min-h-0 relative overflow-hidden backdrop-blur-sm bg-background/30">
              <CardHeader className="relative z-10">
                <CardTitle>
                  {game && (
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={game.token?.imageUrl} alt={game.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Gamepad2 className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {game.name}
                        </h3>
                        <p className="text-sm text-white/70">
                          {game.theme}
                        </p>
                      </div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col min-h-0 p-4 relative z-10">
                <ScrollArea
                  ref={scrollAreaRef}
                  className="flex-1 pr-4 mask-linear-gradient"
                  type="always"
                >
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <Message
                        key={idx}
                        message={msg}
                        index={idx}
                        totalMessages={messages.length}
                        game={game}
                      />
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-muted/80 backdrop-blur-sm rounded-lg p-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="mt-4 flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="What would you like to do?"
                    disabled={loading}
                    className="flex-1 bg-background/50 backdrop-blur-sm text-white placeholder-white/70"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="bg-primary/80 hover:bg-primary/90 backdrop-blur-sm"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel */}
            <div className="col-span-4 bg-transparent rounded-xl">
              <CombinedRightPanel 
                character={game} 
                isGame={true} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameChatInterface; 