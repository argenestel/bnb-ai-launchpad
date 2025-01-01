//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, AlertCircle, Terminal, Gamepad2 } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import { PTOKEN_ABI } from "./ptokenabi";
import { TOKEN_FACTORY_ADDRESS, PTOKEN_ADDRESS } from "./constant";
import { abi } from "./abi";
import { config } from "@/components/evm-provider";
import { writeContract } from "@wagmi/core";
import { waitForTransactionReceipt } from "@wagmi/core";

const CREATION_FEE = 1000n;
const MIN_ETH_BALANCE = parseEther("0.01");

interface GameData {
  name: string;
  theme: string;
  goal: string;
  antagonist: string;
  token?: {
    address: string;
    transactionHash: string;
    name: string;
    symbol: string;
    imageUrl: string;
  } | null;
  autoGenerateAfterToken: boolean;
}

export function GameForm({
  onComplete,
}: {
  onComplete: (data: GameData) => void;
}) {
  const [gameData, setGameData] = useState<GameData>({
    name: "",
    theme: "",
    goal: "",
    antagonist: "",
    token: null,
    autoGenerateAfterToken: true,
  });

  // UI States
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{
      type: "info" | "error" | "success" | "loading";
      message: string;
      timestamp: string;
    }>
  >([]);

  // Wagmi Hooks
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({ address: address! });
  const { data: allowance } = useReadContract({
    address: PTOKEN_ADDRESS,
    abi: PTOKEN_ABI,
    functionName: "allowance",
    args: [address!, TOKEN_FACTORY_ADDRESS],
  });

  const { data: ptokenBalance } = useReadContract({
    address: PTOKEN_ADDRESS,
    abi: PTOKEN_ABI,
    functionName: "balanceOf",
    args: [address!],
  });

  // Terminal scroll effect
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  const addLog = (
    type: "info" | "error" | "success" | "loading",
    message: string,
  ) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleTxComplete = async (hash: string) => {
    setIsPending(true);
    setTxHash(hash);
    addLog("loading", `Waiting for transaction confirmation... (${hash})`);

    try {
        const receipt = await waitForTransactionReceipt(config, { hash });

        const tokenCreationLog = receipt.logs.find(
            (log) => log.topics[1] === "0x0000000000000000000000000000000000000000000000000000000000000000"
        );

        if (receipt.status === "success" && tokenCreationLog) {
            const tokenAddress = `0x${tokenCreationLog.topics[2].slice(26)}`;
            const tokenData = {
                address: tokenAddress,
                transactionHash: hash,
                name: gameData.name,
                symbol: `GAME${gameData.name.slice(0, 2).toUpperCase()}`,
                imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenAddress}`
            };

            setGameData(prev => ({ ...prev, token: tokenData }));
            addLog("success", `Token created at ${tokenAddress}`);
            return tokenData;
        }
        throw new Error("Failed to find token creation event");
    } catch (err) {
        console.error("Error getting receipt:", err);
        addLog("error", "Failed to confirm transaction");
        throw new Error("Failed to confirm transaction");
    } finally {
        setIsPending(false);
        setTxHash(null);
    }
  };

  const handleTokenCreation = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return null;
    }

    setError("");
    addLog("loading", "Starting game token creation process...");

    try {
      // Check balances
      if (!ethBalance || ethBalance.value < MIN_ETH_BALANCE) {
        throw new Error(
          `Insufficient ETH balance. Need ${formatEther(MIN_ETH_BALANCE)} ETH`,
        );
      }

      if (!ptokenBalance) {
        throw new Error(
          `Insufficient PTOKEN balance. Need ${CREATION_FEE.toString()} PTOKEN`,
        );
      }

      // Handle token approval if needed
      if (!allowance) {
        addLog("info", "Requesting token approval...");
        const hash = await writeContract(config, {
          address: PTOKEN_ADDRESS,
          abi: PTOKEN_ABI,
          functionName: "approve",
          args: [TOKEN_FACTORY_ADDRESS, CREATION_FEE],
        });
        await handleTxComplete(hash);
        return;
      }

      addLog("loading", "Creating game token...");
      const hash = await writeContract(config, {
        address: TOKEN_FACTORY_ADDRESS,
        abi,
        functionName: "createMemeToken",
        args: [
          gameData.name,
          `GAME${gameData.name.slice(0, 2).toUpperCase()}`,
          "gameworld",
          gameData.theme || `Game token for ${gameData.name}`,
        ],
      });
      return await handleTxComplete(hash);
    } catch (err) {
      console.error("Token creation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Token creation failed";
      setError(errorMessage);
      addLog("error", errorMessage);
      return null;
    }
  };

  const generateGame = async () => {
    if (!gameData.token) {
      setError("Token must be created first");
      return;
    }

    if (!gameData.theme || !gameData.goal || !gameData.antagonist) {
      setError("Theme, goal, and antagonist are required");
      return;
    }

    addLog("loading", "Generating game world...");
    setIsPending(true);

    try {
      // Format the request payload properly
      const gamePayload = {
        name: gameData.name,
        theme: gameData.theme,
        goal: gameData.goal,
        antagonist: gameData.antagonist,
        token: {
          address: gameData.token.address,
          name: gameData.token.name,
          symbol: gameData.token.symbol,
          transactionHash: gameData.token.transactionHash,
          imageUrl: gameData.token.imageUrl
        },
        modelProvider: "openai",
        settings: {
          secrets: {},
          voice: {
            model: "en_US-male-medium"
          }
        }
      };

      addLog("info", "Sending game data to server...");

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/game-agents/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gamePayload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create game");
      }

      const data = await response.json();

      if (data.success) {
        const completeGameData = {
          ...gameData,
          ...data.data,
          token: gameData.token // Ensure token data is preserved
        };

        setGameData(completeGameData);
        addLog("success", "Game world generated successfully");
        onComplete(completeGameData);
      } else {
        throw new Error(data.error || "Game generation failed");
      }
    } catch (err) {
      console.error("Generation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Generation failed";
      addLog("error", errorMessage);
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const handleCreate = async () => {
    if (!gameData.name.trim()) {
      setError("Game name is required");
      return;
    }

    setError("");

    try {
      const tokenData = await handleTokenCreation();
      if (!tokenData) return;

      if (gameData.autoGenerateAfterToken) {
        await generateGame();
      }
    } catch (err) {
      console.error("Creation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Creation failed";
      setError(errorMessage);
      addLog("error", errorMessage);
    }
  };

  const handleInputChange = (field: keyof GameData, value: any) => {
    setGameData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isLoading = isPending;
  const needsApproval = !allowance;

  // Add terminal content
  const terminalContent = (
    <div
      ref={terminalRef}
      className="bg-black rounded-lg p-4 font-mono text-xs space-y-1 h-[400px] overflow-y-auto"
    >
      {terminalLogs.length === 0 ? (
        <div className="text-gray-500">Waiting to start...</div>
      ) : (
        terminalLogs.map((log, index) => (
          <div
            key={index}
            className={`
              ${log.type === "error" ? "text-red-400" : ""}
              ${log.type === "success" ? "text-green-400" : ""}
              ${log.type === "info" ? "text-blue-400" : ""}
              ${log.type === "loading" ? "text-yellow-400" : ""}
            `}
          >
            <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
          </div>
        ))
      )}

      {/* Token Info */}
      {gameData.token && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-400">Token Info</div>
          <div className="text-xs space-y-1 text-gray-500">
            <div>Name: {gameData.token.name}</div>
            <div>Symbol: {gameData.token.symbol}</div>
            <div className="font-mono truncate">
              Address: {gameData.token.address}
            </div>
            {gameData.token.transactionHash && (
              <div className="font-mono truncate">
                Tx: {gameData.token.transactionHash}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creation Status */}
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium text-gray-400">Status</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                gameData.token
                  ? "bg-green-500"
                  : isLoading
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-xs text-gray-400">Token Creation</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                gameData.theme && gameData.goal && gameData.antagonist
                  ? "bg-green-500"
                  : gameData.token && isLoading
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-xs text-gray-400">Game Generation</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Add error and transaction alerts
  const alerts = (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {txHash && (
        <Alert>
          <AlertTitle>Transaction Pending</AlertTitle>
          <AlertDescription>
            Waiting for confirmation... {txHash}
          </AlertDescription>
        </Alert>
      )}

      {gameData.token && (
        <Alert>
          <AlertTitle>Token Created</AlertTitle>
          <AlertDescription>
            <div>Name: {gameData.token.name}</div>
            <div>Symbol: {gameData.token.symbol}</div>
            <div className="font-mono text-xs truncate">
              Address: {gameData.token.address}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );

  // Update the return JSX to include terminal and alerts
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Game World</CardTitle>
            <CardDescription>
              First, we'll create a token for your game, then generate its world
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={gameData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter game name"
                disabled={isLoading || !!gameData.token}
                maxLength={50}
                required
                className="bg-background"
              />
            </div>

            {!gameData.token && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={gameData.autoGenerateAfterToken}
                  onCheckedChange={(checked) =>
                    handleInputChange("autoGenerateAfterToken", checked)
                  }
                  disabled={isLoading}
                />
                <Label>Auto-generate game after token creation</Label>
              </div>
            )}

            {gameData.token && (
              <>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Input
                    id="theme"
                    value={gameData.theme}
                    onChange={(e) => handleInputChange("theme", e.target.value)}
                    placeholder="Enter game theme"
                    disabled={isLoading}
                    required
                    className="bg-background"
                  />
                </div>

                <div>
                  <Label htmlFor="goal">Goal</Label>
                  <Textarea
                    id="goal"
                    value={gameData.goal}
                    onChange={(e) => handleInputChange("goal", e.target.value)}
                    placeholder="Describe the game's goal"
                    rows={3}
                    disabled={isLoading}
                    required
                    className="bg-background"
                  />
                </div>

                <div>
                  <Label htmlFor="antagonist">Antagonist</Label>
                  <Textarea
                    id="antagonist"
                    value={gameData.antagonist}
                    onChange={(e) => handleInputChange("antagonist", e.target.value)}
                    placeholder="Describe the antagonist"
                    rows={3}
                    disabled={isLoading}
                    required
                    className="bg-background"
                  />
                </div>
              </>
            )}

            {alerts}

            <div className="flex gap-4">
              {!gameData.token ? (
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={
                    !address ||
                    isLoading ||
                    !gameData.name ||
                    (!!ethBalance && ethBalance.value < MIN_ETH_BALANCE)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {needsApproval ? "Approving PTOKEN..." : "Creating Token..."}
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="mr-2 h-4 w-4" />
                      {needsApproval ? "Approve PTOKEN" : "Create Game Token"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={generateGame}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Game World...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Game World
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Creation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {terminalContent}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default GameForm; 