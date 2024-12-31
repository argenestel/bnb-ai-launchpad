import React, { useState } from "react";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useBalance,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { TOKEN_FACTORY_ADDRESS, PTOKEN_ADDRESS } from "./constant";
import { PTOKEN_ABI } from "./ptokenabi";
import { TOKEN_FACTORY_ABI } from "./abi";
export const SwapWidget = () => {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [isSelling, setIsSelling] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address } = useAccount();

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address!,
  });

  // Get all available tokens
  const { data: tokens } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: "getAllMemeTokens",
  });

  // Get PTOKEN allowance and balance
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

  // Calculate expected output
  const { data: expectedOutput } = useReadContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: isSelling ? "calculateSellReturn" : "calculateCost",
    args: isSelling
      ? [selectedToken, parseEther(amount || "0")]
      : [0n, parseEther(amount || "0")],
  });

  // Contract write setup
  const { writeContract: writeContractAsync, isPending: isWritePending } =
    useWriteContract();

  // Simulate approve transaction
  const { data: simulateApprove, error: approveSimError } = useSimulateContract(
    {
      address: PTOKEN_ADDRESS,
      abi: PTOKEN_ABI,
      functionName: "approve",
      args: [TOKEN_FACTORY_ADDRESS, expectedOutput || 0n],
      enabled:
        !!address &&
        !isSelling &&
        (!allowance || (expectedOutput && allowance < expectedOutput)),
    },
  );

  // Simulate swap transaction
  const { data: simulateSwap, error: swapSimError } = useSimulateContract({
    address: TOKEN_FACTORY_ADDRESS,
    abi: TOKEN_FACTORY_ABI,
    functionName: isSelling ? "sellMemeToken" : "buyMemeToken",
    args: [selectedToken, parseEther(amount || "0")],
    enabled:
      !!address &&
      !!selectedToken &&
      !!amount &&
      (isSelling ||
        (!!allowance && expectedOutput && allowance >= expectedOutput)),
  });

  const handleTxComplete = async (hash: string) => {
    setTxHash(hash);
    try {
      const provider = await window.ethereum;
      await provider.request({
        method: "eth_getTransactionReceipt",
        params: [hash],
      });
      setAmount("");
      setTxHash(null);
    } catch (err) {
      console.error("Error getting receipt:", err);
      setError("Failed to confirm transaction");
      setTxHash(null);
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!selectedToken || !amount) {
      setError("Please enter an amount and select a token");
      return;
    }

    const MIN_ETH_BALANCE = parseEther("0.01");
    if (!ethBalance || ethBalance.value < MIN_ETH_BALANCE) {
      setError(`Insufficient ETH balance for gas fees`);
      return;
    }

    try {
      if (
        !isSelling &&
        (!allowance || (expectedOutput && allowance < expectedOutput))
      ) {
        if (!simulateApprove?.request) {
          throw new Error(
            approveSimError?.message || "Failed to simulate approval",
          );
        }
        const hash = await writeContract(simulateApprove.request);
        await handleTxComplete(hash);
        return;
      }

      if (!simulateSwap?.request) {
        throw new Error(swapSimError?.message || "Failed to simulate swap");
      }
      const hash = await writeContract(simulateSwap.request);
      await handleTxComplete(hash);
    } catch (err: any) {
      console.error("Error:", err);
      if (err.message.includes("insufficient funds")) {
        setError("Insufficient ETH for gas fees");
      } else {
        setError(err.message || "Transaction failed");
      }
    }
  };

  const isLoading = !!txHash || isWritePending;
  const needsApproval =
    !isSelling &&
    (!allowance || (expectedOutput && allowance < expectedOutput));

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Swap Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSwap} className="space-y-6">
          <div className="flex items-center justify-between">
            <Label>Mode</Label>
            <div className="flex items-center space-x-2">
              <Label>Buy</Label>
              <Switch
                checked={isSelling}
                onCheckedChange={setIsSelling}
                disabled={isLoading}
              />
              <Label>Sell</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Token</Label>
            <Select
              value={selectedToken}
              onValueChange={setSelectedToken}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a token" />
              </SelectTrigger>
              <SelectContent>
                {tokens?.map((token) => (
                  <SelectItem
                    key={token.tokenAddress}
                    value={token.tokenAddress}
                  >
                    {token.name} ({token.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              min="0"
              step="0.000001"
              className="bg-background"
            />
          </div>

          {expectedOutput && amount && (
            <Alert>
              <AlertTitle>
                Expected {isSelling ? "PTOKEN" : "Tokens"}
              </AlertTitle>
              <AlertDescription>
                {formatEther(expectedOutput)} {isSelling ? "PTOKEN" : "Tokens"}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {address && (
            <Alert>
              <AlertTitle>Balance</AlertTitle>
              <AlertDescription>
                <div>
                  ETH: {ethBalance ? formatEther(ethBalance.value) : "0"} ETH
                </div>
                <div>
                  PTOKEN: {ptokenBalance ? formatEther(ptokenBalance) : "0"}{" "}
                  PTOKEN
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!address || isLoading || !selectedToken || !amount}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {needsApproval ? "Approving PTOKEN..." : "Swapping..."}
              </>
            ) : !address ? (
              "Connect Wallet"
            ) : needsApproval ? (
              "Approve PTOKEN"
            ) : (
              `${isSelling ? "Sell" : "Buy"} Tokens`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SwapWidget;
