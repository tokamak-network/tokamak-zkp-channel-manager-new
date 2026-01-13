/**
 * Transaction Component
 *
 * Component for creating and viewing transactions
 * Shows when channel is active (initialized)
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Button, Input, Label, Card, CardContent } from "@tokamak/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Key, Wallet, Coins, CheckCircle, ArrowRight, Download, AlertCircle } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { usePreviousStateSnapshot } from "@/app/state-explorer/_hooks/usePreviousStateSnapshot";
import { useSynthesizer } from "@/app/state-explorer/_hooks/useSynthesizer";
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { addHexPrefix } from "@ethereumjs/util";
import { getCurrentStateNumber } from "@/lib/db-client";

type Step = "input" | "confirm";

export function TransactionPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { currentChannelId } = useChannelFlowStore();

  // Form state
  const [step, setStep] = useState<Step>("input");
  const [keySeed, setKeySeed] = useState<`0x${string}` | null>(null);
  const [recipient, setRecipient] = useState<`0x${string}` | null>(null);
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [includeProof, setIncludeProof] = useState(false);
  const [currentStateNumber, setCurrentStateNumber] = useState<number | null>(null);

  // UI state
  const [isSigning, setIsSigning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Hook to fetch previous state snapshot
  const { fetchSnapshot } = usePreviousStateSnapshot({
    channelId: currentChannelId || null,
    bundleSnapshot: null,
  });

  // Hook to synthesize L2 transaction
  const { synthesize, isFormValid: validateForm } = useSynthesizer({
    channelId: currentChannelId || "",
    recipient,
    tokenAmount: tokenAmount || null,
    keySeed,
    includeProof,
  });

  // Fetch current state number
  useEffect(() => {
    if (currentChannelId) {
      getCurrentStateNumber(currentChannelId)
        .then((stateNumber) => {
          setCurrentStateNumber(stateNumber);
        })
        .catch((err) => {
          console.error("Failed to get current state number:", err);
          setCurrentStateNumber(0);
        });
    }
  }, [currentChannelId]);

  // Generate key seed using MetaMask
  const generateKeySeed = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!currentChannelId) {
      setError("Please select a channel first");
      return;
    }

    setError(null);
    setIsSigning(true);
    try {
      const message = L2_PRV_KEY_MESSAGE + currentChannelId;
      const seed = await signMessageAsync({ message });
      setKeySeed(seed);
    } catch (err) {
      if (err instanceof Error && err.message.includes("User rejected")) {
        setError("Signature cancelled by user");
      } else {
        console.error("Failed to generate a seed from user signature:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed in interaction with MetaMask"
        );
      }
      setKeySeed(null);
    } finally {
      setIsSigning(false);
    }
  };

  // Handle continue to confirmation
  const handleContinue = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
      setError(null);
    } else {
      setError("Please fill in all fields correctly");
    }
  };

  // Handle synthesize and download
  const handleSynthesize = async () => {
    if (!currentChannelId) {
      setError("No channel selected");
      return;
    }

    if (!validateForm()) {
      setError("Please fill in all fields correctly");
      return;
    }

    setShowConfirmModal(false);
    setIsDownloading(true);
    setError(null);

    try {
      // Get initialization transaction hash
      const initTxHash = await fetch(`/api/channels/${currentChannelId}`)
        .then((res) => res.json())
        .then((data) => data.data?.initializationTxHash)
        .catch(() => null);

      if (!initTxHash) {
        throw new Error(
          "Could not find initialization transaction hash for this channel"
        );
      }

      // Get state snapshot using hook
      const previousStateSnapshot = await fetchSnapshot();

      if (!previousStateSnapshot) {
        throw new Error(
          "Could not find previous state snapshot and failed to fetch initial state from on-chain"
        );
      }

      // Call synthesizer API
      const zipBlob = await synthesize(initTxHash, previousStateSnapshot);

      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `l2-transaction-channel-${currentChannelId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Reset form
      setKeySeed(null);
      setRecipient(null);
      setTokenAmount("");
      setIncludeProof(false);
      setError(null);
    } catch (err) {
      console.error("Failed to synthesize L2 transaction:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to synthesize L2 transaction"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Create Transaction</h3>
            <p className="text-gray-600 text-sm">
              Sign with MetaMask and enter transaction details
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Sign with MetaMask */}
          <div>
            <Label>Sign with MetaMask</Label>
            <div className="mt-2 border border-gray-200 rounded-md p-4 bg-gray-50">
              {keySeed ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Signed successfully</span>
                </div>
              ) : (
                <Button
                  onClick={generateKeySeed}
                  disabled={isSigning || !isConnected}
                  variant="outline"
                  className="w-full"
                >
                  {isSigning ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Sign with MetaMask
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Recipient L2 Address */}
          <div>
            <Label required>Recipient L2 Address</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={recipient ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                // If empty, set to null
                if (value === "") {
                  setRecipient(null);
                }
                // If starts with "0x", use as is
                else if (value.startsWith("0x")) {
                  setRecipient(value as `0x${string}`);
                }
                // If doesn't start with "0x", add it
                else {
                  setRecipient(addHexPrefix(value) as `0x${string}`);
                }
              }}
              onKeyDown={(e) => {
                // Allow backspace to delete "0x" if cursor is at the end
                if (e.key === "Backspace" && recipient === "0x") {
                  e.preventDefault();
                  setRecipient(null);
                }
              }}
              className="mt-2 font-mono"
            />
          </div>

          {/* Token Amount */}
          <div>
            <Label required>Amount</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={tokenAmount}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and decimal point
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setTokenAmount(value);
                }
              }}
              className="mt-2"
            />
          </div>

          {/* Include Proof Option */}
          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <input
              type="checkbox"
              id="includeProof"
              checked={includeProof}
              onChange={(e) => setIncludeProof(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="includeProof" className="flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-900">
                Generate ZK Proof
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Include proof.json in the download (takes longer to process)
              </p>
            </label>
          </div>

          {/* Next State Number */}
          <div>
            <Label>Next State</Label>
            <div className="mt-2 border border-gray-200 rounded-md px-4 py-3 bg-gray-50">
              {currentStateNumber !== null ? (
                <span className="text-lg font-semibold text-blue-600">
                  State #{currentStateNumber}
                </span>
              ) : (
                <span className="text-gray-500">Loading...</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              State number for this transaction (calculated from latest verified proof + 1)
            </p>
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!validateForm() || isDownloading}
            className="w-full"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-lg bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <div className="bg-blue-100 p-1.5 rounded">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              Transaction Summary
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Review your transaction details before synthesizing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 text-sm">Signed</span>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Yes</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  To Address
                </span>
                <span className="text-gray-900 font-mono text-sm">
                  {(recipient ?? "").slice(0, 6)}...
                  {(recipient ?? "").slice(-4)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Token Amount
                </span>
                <span className="text-gray-900 font-medium">{tokenAmount}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Next State
                </span>
                <span className="text-gray-900 font-medium">
                  {currentStateNumber !== null
                    ? `State #${currentStateNumber}`
                    : "Loading..."}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Generate ZK Proof
                </span>
                <span
                  className={`font-medium ${
                    includeProof ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {includeProof ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSynthesize}
                disabled={isDownloading}
                className="w-full"
              >
                {isDownloading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {includeProof
                      ? "Synthesizing & Proving..."
                      : "Synthesizing..."}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {includeProof
                      ? "Synthesize, Prove & Download"
                      : "Synthesize & Download"}
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
