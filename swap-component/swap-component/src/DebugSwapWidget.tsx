import React, { useState, useEffect } from "react";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useWalletClient,
  usePublicClient,
  useChainId,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const TOKEN_ADDRESS = "0x41F059E88c67223e74Ca3c49fc50612bcD89dCFC";

const DebugSwapWidget = ({
  tokenFactoryAddress,
  tokenFactoryABI,
  pTokenAddress,
  pTokenABI,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("0.1");
  const [validationMessage, setValidationMessage] = useState("");

  const chainId = useChainId();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Read contract states
  const { data: allowance, isLoading: isLoadingAllowance } = useReadContract({
    address: pTokenAddress,
    abi: pTokenABI,
    functionName: "allowance",
    args: [address, tokenFactoryAddress],
    watch: true,
  });

  const { data: currentSupply, isLoading: isLoadingSupply } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: [
      {
        inputs: [],
        name: "totalSupply",
        outputs: [{ type: "uint256", name: "" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "totalSupply",
  });

  // Validation Effect
  useEffect(() => {
    if (isLoadingSupply || isLoadingAllowance) {
      setValidationMessage("Loading contract data...");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setValidationMessage("Enter an amount greater than 0");
      return;
    }

    if (!address) {
      setValidationMessage("Connect your wallet");
      return;
    }

    if (!allowance || allowance === 0n) {
      setValidationMessage("Needs PTOKEN approval");
      return;
    }

    setValidationMessage("");
  }, [amount, address, allowance, isLoadingSupply, isLoadingAllowance]);

  const handleBuy = async () => {
    if (!walletClient || !amount) return;
    try {
      setIsLoading(true);
      setError("");

      const buyAmount = parseEther(amount);
      console.log("Attempting to buy:", {
        tokenAddress: TOKEN_ADDRESS,
        amount: buyAmount.toString(),
        sender: address,
      });

      // Simulate first
      const { request } = await publicClient.simulateContract({
        account: address,
        address: tokenFactoryAddress,
        abi: tokenFactoryABI,
        functionName: "buyMemeToken",
        args: [TOKEN_ADDRESS, buyAmount],
      });

      console.log("Simulation successful, sending transaction");
      const hash = await walletClient.writeContract(request);

      setTxHash(hash);
      console.log("Transaction hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction successful:", receipt);
    } catch (err) {
      console.error("Buy error:", {
        message: err.message,
        cause: err.cause,
        name: err.name,
        data: err.data,
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!walletClient) return;
    try {
      setIsLoading(true);
      setError("");

      console.log("Attempting to approve PTOKEN");

      // Simulate first
      const { request } = await publicClient.simulateContract({
        account: address,
        address: pTokenAddress,
        abi: pTokenABI,
        functionName: "approve",
        args: [tokenFactoryAddress, parseEther("1000")],
      });

      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
      console.log("Approval hash:", hash);

      await publicClient.waitForTransactionReceipt({ hash });
      console.log("Approval successful");
    } catch (err) {
      console.error("Approval error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the button should be disabled
  const isButtonDisabled =
    isLoading ||
    !walletClient ||
    !amount ||
    parseFloat(amount) <= 0 ||
    isLoadingSupply ||
    isLoadingAllowance;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Debug Buy Function</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                <div className="break-all">{error}</div>
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertTitle>Debug Info</AlertTitle>
            <AlertDescription>
              <div>Chain ID: {chainId}</div>
              <div>Token: {TOKEN_ADDRESS}</div>
              <div>
                Current Supply:{" "}
                {currentSupply ? formatEther(currentSupply) : "Loading..."}
              </div>
              <div>
                Allowance: {allowance ? formatEther(allowance) : "0"} PTOKEN
              </div>
              {txHash && (
                <div className="mt-2">
                  Last TX: <span className="break-all">{txHash}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount to Buy</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.1"
                min="0.1"
                disabled={isLoading}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Start with a small amount like 0.1
              </p>
            </div>

            {validationMessage && (
              <Alert>
                <AlertDescription>{validationMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleApprove}
              disabled={isLoading || !walletClient}
              className="w-full mb-2"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "1. Approve PTOKEN"
              )}
            </Button>

            <Button
              onClick={handleBuy}
              disabled={isButtonDisabled}
              className="w-full mb-2"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : validationMessage ? (
                validationMessage
              ) : (
                `2. Buy ${amount} Tokens`
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugSwapWidget;
