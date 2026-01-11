/**
 * Initialize State Page
 *
 * Initialize channel state (Leader only)
 * Supports channel selection
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChannelFlowStore, useInitializeStore } from "@/stores";
import { Button, Card, CardContent, CardHeader } from "@tokamak/ui";
import { ChannelSelector } from "@/app/create-channel/_components/ChannelSelector";
import type { Channel } from "@/lib/db";
import {
  useBridgeProofManagerWrite,
  useBridgeProofManagerWaitForReceipt,
  useBridgeProofManagerAddress,
} from "@/hooks/contract";
import { getContractAbi } from "@tokamak/config";
import { useGenerateInitialProof } from "./_hooks/useGenerateInitialProof";

function InitializeStatePageContent() {
  const searchParams = useSearchParams();
  const channelId = useChannelFlowStore((state) => state.channelId);
  const setChannelId = useChannelFlowStore((state) => state.setChannelId);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channelParticipants, setChannelParticipants] = useState<string[]>([]);

  // Note: Leader can initialize channel state at any time, no need to wait for all deposits
  const {
    isGeneratingProof,
    proofData,
    isInitializing,
    isConfirmingInitialize,
    setChannelId: setInitializeStoreChannelId,
    setGeneratingProof,
    setProofData,
    setInitializing,
    setInitializeTxHash,
    setConfirmingInitialize,
    setInitializeError,
    setProofError,
  } = useInitializeStore();

  // Get contract address and ABI for BridgeProofManager
  const proofManagerAddress = useBridgeProofManagerAddress();
  const proofManagerAbi = getContractAbi("BridgeProofManager");

  // Prepare initialize transaction
  const { writeContract: writeInitialize, data: initializeTxHash } =
    useBridgeProofManagerWrite();
  const {
    isLoading: isWaitingInitialize,
    isSuccess: initializeSuccess,
    error: initializeTxError,
  } = useBridgeProofManagerWaitForReceipt({
    hash: initializeTxHash,
  });

  // Proof generation hook
  const {
    generateProof,
    isGenerating: isGeneratingProofHook,
    status: proofStatus,
    error: proofError,
  } = useGenerateInitialProof({ channelId });

  // Check URL parameter for channelId
  useEffect(() => {
    const channelIdParam = searchParams.get("channelId");
    if (channelIdParam) {
      try {
        const id = BigInt(channelIdParam);
        setChannelId(id);
        setInitializeStoreChannelId(id);

        // Fetch channel data
        fetch(`/api/channels/${channelIdParam}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setSelectedChannel(data.data);
              if (data.data.participants) {
                setChannelParticipants(data.data.participants);
              }
            }
          })
          .catch(console.error);
      } catch (error) {
        console.error("Invalid channelId parameter:", error);
      }
    }
  }, [searchParams, setChannelId, setInitializeStoreChannelId]);

  // Load channel data if channelId exists but channel not selected
  useEffect(() => {
    if (channelId && !selectedChannel) {
      fetch(`/api/channels/${channelId.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSelectedChannel(data.data);
            if (data.data.participants) {
              setChannelParticipants(data.data.participants);
            }
          }
        })
        .catch(console.error);
    }
  }, [channelId, selectedChannel]);

  // Initialize store with channelId
  useEffect(() => {
    if (channelId) {
      setInitializeStoreChannelId(channelId);
    }
  }, [channelId, setInitializeStoreChannelId]);

  // Handle channel selection
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    if (channel.channelId) {
      const id = BigInt(channel.channelId);
      setChannelId(id);
      setInitializeStoreChannelId(id);

      if (channel.participants) {
        setChannelParticipants(channel.participants);
      }

      // Update URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("channelId", channel.channelId);
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  // Removed deposit completion check - leader can initialize anytime

  // Update initialize state based on transaction status
  useEffect(() => {
    setInitializing(isWaitingInitialize);
  }, [isWaitingInitialize, setInitializing]);

  useEffect(() => {
    setConfirmingInitialize(isWaitingInitialize);
  }, [isWaitingInitialize, setConfirmingInitialize]);

  useEffect(() => {
    if (initializeTxHash) {
      setInitializeTxHash(initializeTxHash);
    }
  }, [initializeTxHash, setInitializeTxHash]);

  // Save initialization transaction hash to DB on success
  useEffect(() => {
    if (initializeSuccess && initializeTxHash && channelId) {
      setInitializing(false);
      setConfirmingInitialize(false);
      console.log("✅ Channel initialized successfully:", initializeTxHash);

      // Save initialization transaction hash to DB
      const channelIdStr = channelId.toString();
      fetch(`/api/channels/${channelIdStr}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          initializationTxHash: initializeTxHash,
          initializedAt: new Date().toISOString(),
          status: "active", // Update status to active after initialization
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("✅ Initialization transaction hash saved to DB");
          } else {
            console.error(
              "❌ Failed to save initialization tx hash:",
              data.error
            );
          }
        })
        .catch((error) => {
          console.error("❌ Error saving initialization tx hash:", error);
        });
    }
  }, [
    initializeSuccess,
    initializeTxHash,
    channelId,
    setInitializing,
    setConfirmingInitialize,
  ]);

  useEffect(() => {
    if (initializeTxError) {
      setInitializeError(
        initializeTxError.message || "Initialize transaction failed"
      );
      setInitializing(false);
      setConfirmingInitialize(false);
      console.error("❌ Initialize error:", initializeTxError);
    }
  }, [
    initializeTxError,
    setInitializeError,
    setInitializing,
    setConfirmingInitialize,
  ]);

  const handleGenerateProof = async () => {
    if (!channelId) return;

    setGeneratingProof(true);
    setProofError(null);

    try {
      const proof = await generateProof();
      if (proof) {
        setProofData(proof);
      }
    } catch (error) {
      console.error("Error generating proof:", error);
      setProofError(
        error instanceof Error ? error.message : "Failed to generate proof"
      );
    } finally {
      setGeneratingProof(false);
    }
  };

  const handleInitialize = async () => {
    if (!proofData || !channelId) {
      console.error("Missing proof data or channel ID");
      return;
    }

    console.log("Initializing channel state...", {
      channelId: channelId.toString(),
      proofData,
    });

    setInitializing(true);
    setInitializeError(null);

    try {
      // Prepare proof struct for contract
      const proof = {
        pA: proofData.pA,
        pB: proofData.pB,
        pC: proofData.pC,
        merkleRoot: proofData.merkleRoot as `0x${string}`,
      };

      // Call contract (don't await - let wagmi handle the transaction)
      writeInitialize({
        address: proofManagerAddress,
        abi: proofManagerAbi,
        functionName: "initializeChannelState",
        args: [channelId, proof],
      });
    } catch (error) {
      console.error("Error initializing channel state:", error);
      setInitializeError(
        error instanceof Error
          ? error.message
          : "Failed to initialize channel state"
      );
      setInitializing(false);
      setConfirmingInitialize(false);
    }
  };

  // Show channel selector if no channel is selected
  if (!channelId && !selectedChannel) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Initialize Channel State</h2>
            <p className="text-sm text-gray-600">
              Select a channel to initialize state (Leader only)
            </p>
          </CardHeader>
        </Card>
        <ChannelSelector
          onSelectChannel={handleSelectChannel}
          selectedChannelId={undefined}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Initialize Channel State</h2>
            {channelId && (
              <p className="text-sm text-gray-600">
                Channel ID: {channelId.toString()}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedChannel(null);
              setChannelId(null);
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.delete("channelId");
                window.history.replaceState({}, "", url.toString());
              }
            }}
          >
            Change Channel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Proof Generation */}
        <div>
          <h3 className="font-semibold mb-3">Generate ZK Proof</h3>
          {!proofData ? (
            <div className="space-y-2">
              <Button
                onClick={handleGenerateProof}
                disabled={isGeneratingProof || isGeneratingProofHook}
                className="w-full"
              >
                {isGeneratingProof || isGeneratingProofHook
                  ? "Generating Proof..."
                  : "Generate Proof"}
              </Button>
              {proofStatus && (
                <p className="text-sm text-gray-600">{proofStatus}</p>
              )}
              {proofError && (
                <p className="text-sm text-red-600">Error: {proofError}</p>
              )}
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              ✓ Proof generated successfully
              <div className="mt-2 text-xs font-mono">
                Merkle Root: {proofData.merkleRoot.slice(0, 20)}...
              </div>
            </div>
          )}
        </div>

        {/* Initialize Button */}
        {proofData && (
          <div>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing || isConfirmingInitialize}
              className="w-full"
            >
              {isInitializing || isConfirmingInitialize
                ? "Initializing..."
                : "Initialize Channel State"}
            </Button>
          </div>
        )}

        {/* Status Messages */}
        {initializeTxHash && !initializeSuccess && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            Transaction submitted: {initializeTxHash.slice(0, 20)}...
            {isConfirmingInitialize && " Waiting for confirmation..."}
          </div>
        )}

        {initializeSuccess && initializeTxHash && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Channel initialized successfully!
            <div className="mt-1 text-xs">
              Tx: {initializeTxHash.slice(0, 20)}...
            </div>
          </div>
        )}

        {/* Error Messages */}
        {initializeTxError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            Error:{" "}
            {initializeTxError.message || "Initialize transaction failed"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function InitializeStatePage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-[var(--foreground)]">
          Initialize State
        </h2>
        <p className="text-[var(--muted-foreground)]">
          Initialize channel state (Leader only)
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        }
      >
        <InitializeStatePageContent />
      </Suspense>
    </>
  );
}
