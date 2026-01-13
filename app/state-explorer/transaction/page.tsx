/**
 * Transaction Component
 *
 * Component for creating and viewing transactions
 * Shows when channel is active (initialized)
 */

"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Button, Input, Label, Card, CardContent } from "@tokamak/ui";
import JSZip from "jszip";
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
import { ProofList } from "./_components/ProofList";

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
  // ZK Proof is always included
  const includeProof = true;

  // UI state
  const [isSigning, setIsSigning] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [proofListRefreshKey, setProofListRefreshKey] = useState(0);

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

    // Keep modal open to show loading state
    setIsDownloading(true);
    setError(null);

    try {
      // Get initialization transaction hash
      console.log("[TransactionPage] Fetching channel data for:", currentChannelId);
      const response = await fetch(`/api/channels/${currentChannelId}`);
      const responseData = await response.json();
      console.log("[TransactionPage] API response:", responseData);
      
      const initTxHash = responseData.data?.initializationTxHash;
      console.log("[TransactionPage] Extracted initTxHash:", initTxHash);

      if (!initTxHash) {
        console.error("[TransactionPage] Channel data:", responseData.data);
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
      
      // Store the generated ZIP blob for later submission
      setGeneratedZipBlob(zipBlob);
      setProofGenerated(true);
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

  // Reconstruct ZIP with new folder structure
  const reconstructZip = async (
    originalZipBlob: Blob,
    channelId: string,
    proofNumber: number
  ): Promise<Blob> => {
    const zip = new JSZip();
    const originalZip = await JSZip.loadAsync(originalZipBlob);

    // New folder name: <channelId>-<proof#sequence>
    const newFolderName = `${channelId.toLowerCase()}-proof#${proofNumber}`;

    // Process all files in the original ZIP
    for (const [filePath, file] of Object.entries(originalZip.files)) {
      if (file.dir) continue;

      // Extract file name
      const fileName = filePath.split("/").pop() || filePath;

      // Determine which folder this file belongs to
      let targetFolder = "";
      if (
        fileName === "proof.json" ||
        filePath.includes("prove") ||
        filePath.includes("proof")
      ) {
        targetFolder = `${newFolderName}/prove/`;
      } else if (
        fileName === "instance.json" ||
        fileName === "state_snapshot.json" ||
        fileName === "placementVariables.json" ||
        fileName === "instance_description.json" ||
        fileName === "permutation.json" ||
        fileName === "block_info.json" ||
        fileName === "contract_code.json" ||
        fileName === "previous_state_snapshot.json" ||
        filePath.includes("synthesizer")
      ) {
        targetFolder = `${newFolderName}/synthesizer/`;
      } else {
        // Skip preprocess files and other files
        continue;
      }

      // Read file content and add to new ZIP
      const content = await file.async("uint8array");
      zip.file(`${targetFolder}${fileName}`, content);
    }

    // Generate new ZIP blob
    return await zip.generateAsync({ type: "blob" });
  };

  // Handle submit proof to DB and download
  const handleSubmitAndDownload = async () => {
    if (!generatedZipBlob || !currentChannelId || !address) {
      setError("Missing required data for proof submission");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Get next proof number atomically from backend
      const proofNumberResponse = await fetch("/api/get-next-proof-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: currentChannelId.toLowerCase() }),
      });

      if (!proofNumberResponse.ok) {
        const errorData = await proofNumberResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get next proof number");
      }

      const { proofNumber, subNumber, proofId, storageProofId } =
        await proofNumberResponse.json();

      // Step 2: Reconstruct ZIP with new folder structure
      const reconstructedZipBlob = await reconstructZip(
        generatedZipBlob,
        currentChannelId,
        proofNumber
      );

      // Step 3: Upload ZIP file
      const formData = new FormData();
      formData.append(
        "file",
        new File([reconstructedZipBlob], `proof-${proofId}.zip`, {
          type: "application/zip",
        })
      );
      formData.append("channelId", currentChannelId.toLowerCase());
      formData.append("proofId", storageProofId);

      const uploadResponse = await fetch("/api/save-proof-zip", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.details || "Upload failed"
        );
      }

      // Step 3: Save metadata to DB using updateData
      const proofMetadata = {
        proofId: proofId,
        sequenceNumber: proofNumber,
        subNumber: subNumber,
        submittedAt: new Date().toISOString(),
        submitter: address,
        timestamp: Date.now(),
        uploadStatus: "complete",
        status: "pending",
        channelId: currentChannelId.toLowerCase(),
      };

      const saveResponse = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: `channels.${currentChannelId.toLowerCase()}.submittedProofs.${storageProofId}`,
          data: proofMetadata,
          operation: "update",
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save proof metadata");
      }

      // Step 4: Download the reconstructed ZIP file
      const url = URL.createObjectURL(reconstructedZipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `l2-transaction-channel-${currentChannelId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Refresh proof list
      setProofListRefreshKey((prev) => prev + 1);

      // Close modal and reset form after successful submission and download
      setShowConfirmModal(false);
      setKeySeed(null);
      setRecipient(null);
      setTokenAmount("");
      setGeneratedZipBlob(null);
      setProofGenerated(false);
      setError(null);
    } catch (err) {
      console.error("Failed to submit proof:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit proof to database"
      );
    } finally {
      setIsSubmitting(false);
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

          {/* ZK Proof Info */}
          <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  ZK Proof will be generated
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  proof.json will be included in the download (takes longer to process)
                </p>
              </div>
            </div>
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
      <Dialog open={showConfirmModal} onOpenChange={(open) => {
        if (!isDownloading) {
          setShowConfirmModal(open);
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-white border-gray-200">
          {isDownloading ? (
            // Loading State
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="lg" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  Generating ZK Proof...
                </p>
                <p className="text-sm text-gray-600">
                  This may take a few minutes. Please wait.
                </p>
              </div>
            </div>
          ) : (
            // Normal Content
            <>
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
                {/* Error Message in Modal */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

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

                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600 text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Generate ZK Proof
                    </span>
                    <span className="font-medium text-green-600">
                      Yes
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {!proofGenerated ? (
                    <>
                      <Button
                        onClick={handleSynthesize}
                        disabled={isDownloading}
                        className="w-full"
                      >
                        {isDownloading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Generating ZK Proof...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Generate ZK Proof
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowConfirmModal(false)}
                        variant="outline"
                        className="w-full"
                        disabled={isDownloading}
                      >
                        Back
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm mb-2">
                        ✓ ZK Proof generated successfully!
                      </div>
                      <Button
                        onClick={handleSubmitAndDownload}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Submitting & Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Submit & Download
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowConfirmModal(false)}
                        variant="outline"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Proof List */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Proofs</h2>
        <ProofList key={proofListRefreshKey} />
      </div>
    </div>
  );
}
