/**
 * Transaction Component
 *
 * Component for creating and viewing transactions
 * Shows when channel is active (initialized)
 *
 * Design:
 * - https://www.figma.com/design/0R11fVZOkNSTJjhTKvUjc7/Ooo?node-id=3138-232280
 */

"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import JSZip from "jszip";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HelpCircle, Download, Upload } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { usePreviousStateSnapshot } from "@/app/state-explorer/_hooks/usePreviousStateSnapshot";
import { useSynthesizer } from "@/app/state-explorer/_hooks/useSynthesizer";
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { addHexPrefix } from "@ethereumjs/util";
import { ProofList } from "./_components/ProofList";
import { Button, AmountInput } from "@/components/ui";
import { TransactionConfirmModal } from "./_components/TransactionConfirmModal";

export function TransactionPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { currentChannelId } = useChannelFlowStore();

  // Form state
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
  const [submitTxHash, setSubmitTxHash] = useState<string | null>(null);

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

  // Generate key seed using MetaMask (Sign action)
  const handleSign = async () => {
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

  // Handle confirm button click (opens modal)
  const handleConfirm = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
      setError(null);
    } else {
      setError("Please fill in all fields correctly");
    }
  };

  // Handle synthesize and generate proof
  const handleSynthesize = async () => {
    if (!currentChannelId) {
      setError("No channel selected");
      return;
    }

    if (!validateForm()) {
      setError("Please fill in all fields correctly");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const normalizedChannelId = currentChannelId?.toLowerCase() || currentChannelId;
      const encodedChannelId = normalizedChannelId ? encodeURIComponent(normalizedChannelId) : currentChannelId;
      
      const response = await fetch(`/api/channels/${encodedChannelId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const responseData = await response.json();
      
      const initTxHash = responseData.data?.initializationTxHash;

      if (!initTxHash) {
        throw new Error(
          "Could not find initialization transaction hash for this channel"
        );
      }

      const previousStateSnapshot = await fetchSnapshot();

      if (!previousStateSnapshot) {
        throw new Error(
          "Could not find previous state snapshot and failed to fetch initial state from on-chain"
        );
      }

      const zipBlob = await synthesize(initTxHash, previousStateSnapshot);
      
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

    const newFolderName = `${channelId.toLowerCase()}-proof#${proofNumber}`;

    for (const [filePath, file] of Object.entries(originalZip.files)) {
      if (file.dir) continue;

      const fileName = filePath.split("/").pop() || filePath;

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
        continue;
      }

      const content = await file.async("uint8array");
      zip.file(`${targetFolder}${fileName}`, content);
    }

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

      const reconstructedZipBlob = await reconstructZip(
        generatedZipBlob,
        currentChannelId,
        proofNumber
      );

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

      const proofMetadata = {
        proofId: proofId,
        sequenceNumber: proofNumber,
        subNumber: subNumber,
        submittedAt: Date.now(),
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

      // Download the reconstructed ZIP file
      const url = URL.createObjectURL(reconstructedZipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `l2-transaction-channel-${currentChannelId}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Set txHash for modal display (using proofId as reference)
      setSubmitTxHash(proofId);

      // Refresh proof list
      setProofListRefreshKey((prev) => prev + 1);
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

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    // Reset form after closing if transaction was completed
    if (submitTxHash) {
      setKeySeed(null);
      setRecipient(null);
      setTokenAmount("");
      setGeneratedZipBlob(null);
      setProofGenerated(false);
      setSubmitTxHash(null);
    }
  };

  // Form is valid only when signed and form fields are filled
  const isFormValid = keySeed && recipient && tokenAmount && validateForm();

  return (
    <div className="font-mono" style={{ width: 544 }}>
      {/* Transaction Section */}
      <div className="flex flex-col gap-6">
        {/* Title */}
        <h2
          className="font-medium text-[#111111]"
          style={{ fontSize: 32, lineHeight: "1.3em" }}
        >
          Transaction
        </h2>

        {/* Recipient L2 Address */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label
              className="font-medium text-[#111111]"
              style={{ fontSize: 18, lineHeight: "1.3em" }}
            >
              Recipient L2 Address
            </label>
            <HelpCircle className="w-5 h-5 text-[#999999]" />
          </div>
          <input
            type="text"
            placeholder="Enter Recipient L2 Address"
            value={recipient ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setRecipient(null);
              } else if (value.startsWith("0x")) {
                setRecipient(value as `0x${string}`);
              } else {
                setRecipient(addHexPrefix(value) as `0x${string}`);
              }
            }}
            className="w-full px-4 py-3.5 border border-[#BBBBBB] rounded text-lg font-mono"
            style={{
              fontSize: 18,
              color: recipient ? "#111111" : "#999999",
            }}
          />
        </div>

        {/* Amount */}
        <AmountInput
          label="Amount"
          value={tokenAmount}
          onChange={setTokenAmount}
          balance="448"
          tokenSymbol="TON"
          onMaxClick={() => setTokenAmount("448")}
        />

        {/* Sign or Confirm Button - Only one visible at a time */}
        {!keySeed ? (
          <Button
            variant="primary"
            size="full"
            onClick={handleSign}
            disabled={isSigning || !isConnected}
          >
            {isSigning ? "Signing..." : "Sign"}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="full"
            onClick={handleConfirm}
            disabled={!isFormValid}
          >
            Confirm
          </Button>
        )}
      </div>

      {/* Proofs Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-medium text-[#111111]"
            style={{ fontSize: 32, lineHeight: "1.3em" }}
          >
            Proofs
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border border-[#111111] rounded bg-white"
              style={{ fontSize: 18 }}
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 border border-[#111111] rounded bg-white"
              style={{ fontSize: 18 }}
            >
              <Upload className="w-5 h-5" />
              Upload
            </button>
          </div>
        </div>
        <ProofList key={proofListRefreshKey} />
      </div>

      {/* Transaction Confirm Modal */}
      {showConfirmModal && currentChannelId && (
        <TransactionConfirmModal
          channelId={currentChannelId}
          recipient={recipient || ""}
          amount={tokenAmount}
          tokenSymbol="TON"
          onGenerateProof={handleSynthesize}
          onSubmitAndDownload={handleSubmitAndDownload}
          isGenerating={isDownloading}
          isSubmitting={isSubmitting}
          proofGenerated={proofGenerated}
          txHash={submitTxHash}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
