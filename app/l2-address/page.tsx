/**
 * L2 Address Lookup Page
 *
 * Enter channel ID and sign with MetaMask to get your L2 address for that channel
 */

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { Card, CardContent, CardHeader, Button, Input, Label } from "@tokamak/ui";
import { Key, Calculator, AlertCircle, Copy, CheckCircle2, Wallet } from "lucide-react";
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { deriveL2KeysAndAddressFromSignature, DerivedL2Account } from "@/lib/tokamakl2js";

function L2AddressPageContent() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const searchParams = useSearchParams();

  const [channelId, setChannelId] = useState<string>(
    searchParams.get("channelId") || ""
  );
  // Slot index is fixed to 0 (no longer configurable)
  const slotIndex = 0;
  const [l2Account, setL2Account] = useState<DerivedL2Account | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string>("");

  const computeL2Address = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!signMessageAsync) {
      setError("Wallet signing not available. Please reconnect your wallet.");
      return;
    }

    if (!channelId || channelId === "") {
      setError("Please enter a channel ID");
      return;
    }

    const channelIdNum = parseInt(channelId);
    if (isNaN(channelIdNum) || channelIdNum < 0) {
      setError("Please enter a valid channel ID (non-negative number)");
      return;
    }

    setIsComputing(true);
    setError("");

    try {
      const message = L2_PRV_KEY_MESSAGE + channelId;
      const signature = await signMessageAsync({ message });
      const accountL2 = deriveL2KeysAndAddressFromSignature(signature, slotIndex);

      setL2Account(accountL2);
      setError("");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("User rejected") || err.message.includes("rejected")) {
          setError("Signature cancelled by user");
        } else if (
          err.message.includes("ConnectorNotFoundError") ||
          err.message.includes("Connector not found")
        ) {
          setError("Wallet connection lost. Please disconnect and reconnect your wallet.");
        } else if (err.message.includes("ChainMismatchError")) {
          setError("Wrong network. Please switch to the correct network.");
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError("Failed to compute L2 address. Please try again.");
      }
    } finally {
      setIsComputing(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard. Please copy manually.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/20 border border-primary/50 flex items-center justify-center rounded">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">L2 Address Lookup</h2>
              <p className="text-sm text-muted-foreground">
                Enter channel ID and sign with MetaMask to get your L2 address
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection Status */}
          {!isConnected ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Wallet Not Connected</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Please connect your wallet to use this feature.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="font-medium">Wallet Connected</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {address}
              </p>
            </div>
          )}

          {/* Input Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID</Label>
              <Input
                id="channelId"
                type="number"
                min="0"
                value={channelId}
                onChange={(e) => {
                  const value = e.target.value;
                  setChannelId(value);
                  setError("");
                  // Reset L2 account when channel ID changes
                  if (l2Account) {
                    setL2Account(null);
                  }
                }}
                placeholder="Enter channel ID"
                disabled={isComputing}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={computeL2Address}
              disabled={isComputing || !isConnected || !address || !signMessageAsync || !channelId}
              className="w-full"
              size="lg"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isComputing ? "Computing..." : "Generate L2 Address"}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* L2 Address Result */}
            {l2Account && (
              <div className="space-y-4 p-6 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Your L2 Account</h3>
                </div>

                <div className="space-y-4">
                  {/* L2 Address */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">L2 Address</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(l2Account.l2Address, "l2Address")}
                        className="h-7"
                      >
                        {copiedField === "l2Address" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {l2Account.l2Address}
                    </div>
                  </div>

                  {/* MPT Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">MPT Key</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(l2Account.mptKey, "mptKey")}
                        className="h-7"
                      >
                        {copiedField === "mptKey" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {l2Account.mptKey}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="w-4 h-4" />
                      <span>Channel ID: {channelId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Instructions */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">How to use:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Enter the channel ID you want to check</li>
                <li>• Click "Generate L2 Address" and sign the message with MetaMask</li>
                <li>• Your L2 address and MPT key will be displayed</li>
                <li>• Copy the L2 address to use as the recipient address for L2 transactions</li>
                <li>• Copy the MPT key to use when making deposits</li>
                <li>• All computation is done client-side - your private key never leaves your browser</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function L2AddressPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
          L2 Address Lookup
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Get your L2 address for a specific channel by signing with MetaMask
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        }
      >
        <L2AddressPageContent />
      </Suspense>
    </>
  );
}
