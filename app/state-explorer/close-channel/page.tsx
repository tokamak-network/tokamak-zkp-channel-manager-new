"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Button, Card } from "@tokamak/ui";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { useSubmitProof } from "../_hooks/useSubmitProof";
import { useCloseChannel } from "../_hooks/useCloseChannel";
import { useBridgeCoreRead, useBridgeProofManagerRead } from "@/hooks/contract";
import { generateClientSideProof } from "@/lib/clientProofGeneration";
import { keccak256, encodePacked } from "viem";

interface VerifiedProof {
  key: string;
  proofId: string;
  sequenceNumber: number;
  zipFile: {
    filePath: string;
    fileName: string;
    size: number;
  };
  verifiedAt: string | number; // Unix timestamp (number) or ISO string (string) for backward compatibility
  verifiedBy: string;
}

export default function CloseChannelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const channelIdParam = searchParams?.get("channelId");
  const channelId = channelIdParam && channelIdParam.startsWith("0x") 
    ? (channelIdParam as `0x${string}`) 
    : null;

  const channelInfo = useChannelInfo(channelId);

  // Get channel leader to determine if current user is leader
  const { data: channelLeader } = useBridgeCoreRead({
    functionName: "getChannelLeader",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected,
    },
  });

  const isLeader = useMemo(() => {
    if (!channelLeader || !address) return false;
    return String(channelLeader).toLowerCase() === String(address).toLowerCase();
  }, [channelLeader, address]);

  // Phase state: 1 = Submit Proof, 2 = Verify Final Balances
  const [phase, setPhase] = useState<1 | 2>(1);
  const [verifiedProofs, setVerifiedProofs] = useState<VerifiedProof[]>([]);
  const [isLoadingProofs, setIsLoadingProofs] = useState(true);
  const [proofsError, setProofsError] = useState("");

  // Phase 1 states - use useSubmitProof hook
  const {
    loadAndFormatProofs,
    submitProofs,
    isLoadingProofs: isSubmittingProof,
    isSubmitting: isSubmittingTransaction,
    isTransactionSuccess: submitProofSuccess,
    error: submitProofError,
    currentStep: submitProofStep,
  } = useSubmitProof(channelId);

  // Phase 2 states
  const [isGeneratingFinalProof, setIsGeneratingFinalProof] = useState(false);
  const [finalProofStatus, setFinalProofStatus] = useState("");
  const [isClosingChannel, setIsClosingChannel] = useState(false);
  const [closeChannelError, setCloseChannelError] = useState("");
  const [finalBalances, setFinalBalances] = useState<bigint[]>([]);
  const [permutation, setPermutation] = useState<bigint[]>([]);
  const [groth16Proof, setGroth16Proof] = useState<{
    pA: [bigint, bigint, bigint, bigint];
    pB: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
    pC: [bigint, bigint, bigint, bigint];
  } | null>(null);

  // Get channel data for Phase 2
  const { data: channelParticipantsRaw } = useBridgeCoreRead({
    functionName: "getChannelParticipants",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected && phase === 2,
    },
  });
  // Cast to proper array type
  const channelParticipants = channelParticipantsRaw as `0x${string}`[] | undefined;

  const { data: channelTreeSize } = useBridgeCoreRead({
    functionName: "getChannelTreeSize",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected && phase === 2,
    },
  });

  const { data: finalStateRoot } = useBridgeCoreRead({
    functionName: "getChannelFinalStateRoot",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected && phase === 2,
    },
  });

  const { data: channelTargetContract } = useBridgeCoreRead({
    functionName: "getChannelTargetContract",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId && isConnected && phase === 2,
    },
  });

  const { data: preAllocatedKeys } = useBridgeCoreRead({
    functionName: "getPreAllocatedKeys",
    args: channelTargetContract ? [channelTargetContract as `0x${string}`] : undefined,
    query: {
      enabled: !!channelTargetContract && isConnected && phase === 2,
    },
  });

  // useCloseChannel hook
  const {
    closeChannel,
    isProcessing: isClosingChannelProcessing,
    closeSuccess,
    error: closeChannelHookError,
    currentStep: closeChannelStep,
  } = useCloseChannel({
    channelId: channelId as `0x${string}` | null,
    finalBalances: finalBalances.length > 0 ? finalBalances : undefined,
    permutation: permutation.length > 0 ? permutation : undefined,
    proof: groth16Proof || undefined,
  });

  // Step definitions for inline progress display
  const TRANSACTION_STEPS = [
    { key: "signing", label: "Signing Transaction" },
    { key: "confirming", label: "Confirming Transaction" },
  ] as const;

  // Load verified proofs from DB
  useEffect(() => {
    const fetchVerifiedProofs = async () => {
      try {
        setIsLoadingProofs(true);
        const response = await fetch(
          `/api/channels/${channelId}/proofs?type=verified`
        );
        const data = await response.json();

        if (data.success && data.data) {
          let proofsArray: VerifiedProof[] = [];
          if (Array.isArray(data.data)) {
            proofsArray = data.data;
          } else if (data.data && typeof data.data === "object") {
            proofsArray = Object.entries(data.data).map(
              ([key, value]: [string, any]) => ({
                key,
                ...value,
              })
            );
          }
          // Sort by sequence number descending (most recent first)
          proofsArray.sort((a, b) => b.sequenceNumber - a.sequenceNumber);
          setVerifiedProofs(proofsArray);
        }
      } catch (error) {
        console.error("Error fetching verified proofs:", error);
        setProofsError("Failed to load verified proofs");
      } finally {
        setIsLoadingProofs(false);
      }
    };

    if (channelId) {
      fetchVerifiedProofs();
    }
  }, [channelId]);

  // Check if user is leader
  useEffect(() => {
    if (!isLeader && channelInfo) {
      router.push(`/state-explorer?channelId=${channelId}`);
    }
  }, [isLeader, channelInfo, channelId, router]);

  // Get the most recent proof for submission
  const selectedProof = useMemo(() => {
    return verifiedProofs.length > 0 ? verifiedProofs[0] : null;
  }, [verifiedProofs]);

  // Move to Phase 2 when proof submission succeeds
  useEffect(() => {
    if (submitProofSuccess && phase === 1) {
      setTimeout(() => {
        setPhase(2);
      }, 1500);
    }
  }, [submitProofSuccess, phase]);

  // Phase 1: Submit Proof to move channel from Open to Closing
  const handleSubmitProof = useCallback(async () => {
    if (!selectedProof) {
      return;
    }

    try {
      await submitProofs();
    } catch (error) {
      console.error("Error submitting proof:", error);
    }
  }, [selectedProof, submitProofs]);

  // Phase 2: Build permutation array
  const buildPermutation = useCallback(async () => {
    if (!channelParticipants || !finalStateRoot || !channelTargetContract) {
      throw new Error("Missing channel data");
    }

    setFinalProofStatus("Fetching final state snapshot...");

    // Get final state snapshot from API
    const response = await fetch(
      `/api/get-contract-state-for-proof?channelId=${channelId}&stateRoot=${finalStateRoot}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch final state snapshot");
    }
    const snapshotData = await response.json();

    if (!snapshotData.success || !snapshotData.data) {
      throw new Error("Invalid state snapshot data");
    }

    setFinalProofStatus("Calculating permutation...");

    // Get registered keys from contract (already fetched via hook)
    if (!preAllocatedKeys || !Array.isArray(preAllocatedKeys)) {
      throw new Error("Failed to fetch registered keys from contract");
    }
    const registeredKeys: string[] = preAllocatedKeys as string[];

    // Normalize storage key function
    const normalizeStorageKey = (key: string): string => {
      return key.toLowerCase().startsWith("0x")
        ? key.toLowerCase()
        : `0x${key.toLowerCase()}`;
    };

    // Build value map from snapshot
    const valuesByKey = new Map<string, string>();
    snapshotData.data.storageEntries?.forEach(
      (entry: { key: string; value: string }) => {
        const normalizedKey = normalizeStorageKey(entry.key);
        valuesByKey.set(normalizedKey, entry.value);
      }
    );

    // Build permutation: map registered keys to their indices in the snapshot
    const perm: bigint[] = [];
    for (let i = 0; i < registeredKeys.length; i++) {
      const registeredKey = normalizeStorageKey(registeredKeys[i]);
      let foundIndex = -1;

      // Find index in snapshot storage entries
      for (let j = 0; j < snapshotData.data.storageEntries.length; j++) {
        const snapshotKey = normalizeStorageKey(
          snapshotData.data.storageEntries[j].key
        );
        if (snapshotKey === registeredKey) {
          foundIndex = j;
          break;
        }
      }

      if (foundIndex === -1) {
        // Key not found in snapshot, use -1 or 0
        perm.push(BigInt(0));
      } else {
        perm.push(BigInt(foundIndex));
      }
    }

    setPermutation(perm);

    // Build final balances array (one balance per participant)
    const balances: bigint[] = [];
    for (const participant of channelParticipants) {
      // Find participant's balance in snapshot
      let participantBalance = BigInt(0);
      snapshotData.data.storageEntries?.forEach(
        (entry: { key: string; value: string }) => {
          // Extract participant address from key if it matches
          // This is a simplified version - actual implementation may need more logic
          if (entry.key.toLowerCase().includes(participant.toLowerCase())) {
            participantBalance = BigInt(entry.value);
          }
        }
      );
      balances.push(participantBalance);
    }

    setFinalBalances(balances);

    return { permutation: perm, finalBalances: balances, snapshotData };
  }, [
    channelId,
    channelParticipants,
    finalStateRoot,
    channelTargetContract,
    preAllocatedKeys,
  ]);

  // Phase 2: Generate Groth16 proof
  const generateGroth16ProofForClose = useCallback(async () => {
    if (!channelTreeSize || !finalStateRoot || !channelTargetContract) {
      throw new Error("Missing channel data");
    }

    setFinalProofStatus("Preparing circuit input...");

    // Get final state snapshot
    const response = await fetch(
      `/api/get-contract-state-for-proof?channelId=${channelId}&stateRoot=${finalStateRoot}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch final state snapshot");
    }
    const snapshotData = await response.json();

    if (!snapshotData.success || !snapshotData.data) {
      throw new Error("Invalid state snapshot data");
    }

    // Get registered keys from contract (already fetched via hook)
    if (!preAllocatedKeys || !Array.isArray(preAllocatedKeys)) {
      throw new Error("Failed to fetch registered keys from contract");
    }
    const registeredKeys: string[] = preAllocatedKeys as string[];

    const treeSize = Number(channelTreeSize);
    if (![16, 32, 64, 128].includes(treeSize)) {
      throw new Error(`Unsupported tree size: ${treeSize}`);
    }

    // Build storage keys and values arrays
    const storageKeys: string[] = [];
    const storageValues: string[] = [];

    // Normalize storage key
    const normalizeStorageKey = (key: string): string => {
      return key.toLowerCase().startsWith("0x")
        ? key.toLowerCase()
        : `0x${key.toLowerCase()}`;
    };

    // Build value map
    const valuesByKey = new Map<string, string>();
    snapshotData.data.storageEntries?.forEach(
      (entry: { key: string; value: string }) => {
        const normalizedKey = normalizeStorageKey(entry.key);
        valuesByKey.set(normalizedKey, entry.value);
      }
    );

    // Fill arrays up to tree size
    for (let i = 0; i < Math.min(treeSize, registeredKeys.length); i++) {
      const key = registeredKeys[i];
      const normalizedKey = normalizeStorageKey(key);
      const value = valuesByKey.get(normalizedKey) || "0";
      storageKeys.push(normalizedKey);
      storageValues.push(value);
    }

    // Pad to tree size if needed
    while (storageKeys.length < treeSize) {
      storageKeys.push(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      storageValues.push("0");
    }

    setFinalProofStatus(
      "Generating Groth16 proof... This may take a few minutes..."
    );

    // Generate proof
    const proofResult = await generateClientSideProof(
      {
        storage_keys_L2MPT: storageKeys,
        storage_values: storageValues,
        treeSize,
      },
      (status) => setFinalProofStatus(status)
    );

    setGroth16Proof({
      pA: [...proofResult.proof.pA] as [bigint, bigint, bigint, bigint],
      pB: [...proofResult.proof.pB] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
      pC: [...proofResult.proof.pC] as [bigint, bigint, bigint, bigint],
    });

    return proofResult;
  }, [
    channelId,
    channelTreeSize,
    finalStateRoot,
    channelTargetContract,
    preAllocatedKeys,
  ]);

  // Phase 2: Verify final balances and close channel
  const handleVerifyAndClose = useCallback(async () => {
    setIsClosingChannel(true);
    setCloseChannelError("");
    setFinalProofStatus("Preparing final state data...");

    try {
      // Step 1: Build permutation and final balances
      await buildPermutation();

      // Step 2: Generate Groth16 proof
      await generateGroth16ProofForClose();

      // Step 3: Close channel
      setFinalProofStatus("Submitting to blockchain...");
      await closeChannel();

      // Success - redirect to withdraw after a delay
      setTimeout(() => {
        router.push(`/state-explorer?channelId=${channelId}`);
      }, 2000);
    } catch (error) {
      console.error("Error closing channel:", error);
      setCloseChannelError(
        error instanceof Error ? error.message : "Failed to close channel"
      );
    } finally {
      setIsClosingChannel(false);
      setFinalProofStatus("");
    }
  }, [
    buildPermutation,
    generateGroth16ProofForClose,
    closeChannel,
    channelId,
    router,
  ]);

  // Update error state from hook
  useEffect(() => {
    if (closeChannelHookError) {
      setCloseChannelError(closeChannelHookError);
    }
  }, [closeChannelHookError]);

  if (isLoadingProofs) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading verified proofs...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (proofsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle className="h-6 w-6" />
            <span>{proofsError}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div
            className={`flex items-center gap-2 ${
              phase === 1 ? "text-primary" : "text-green-500"
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                phase === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-green-500 text-white"
              }`}
            >
              {phase === 2 ? <CheckCircle className="h-5 w-5" /> : "1"}
            </div>
            <span className="font-medium">Submit Proof</span>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground" />

          <div
            className={`flex items-center gap-2 ${
              phase === 2 ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                phase === 2 ? "bg-primary text-primary-foreground" : "border-2"
              }`}
            >
              2
            </div>
            <span className="font-medium">Verify & Close</span>
          </div>
        </div>
      </div>

      {/* Phase 1: Submit Proof */}
      {phase === 1 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            Phase 1: Submit Proof to Close Channel
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Channel Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Channel ID:</span>
                  <span className="ml-2 font-medium">#{channelId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current State:</span>
                  <span className="ml-2 font-medium">Open</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Verified Proofs Available
              </h3>
              <div className="text-sm text-muted-foreground mb-4">
                Total: {verifiedProofs.length} proof(s)
              </div>

              {selectedProof && (
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{selectedProof.proofId}</div>
                      <div className="text-sm text-muted-foreground">
                        Sequence: {selectedProof.sequenceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Verified:{" "}
                        {new Date(selectedProof.verifiedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">
                      Selected
                    </div>
                  </div>
                </Card>
              )}

              {!selectedProof && (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-4 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>
                    No verified proofs available. Please verify proofs first.
                  </span>
                </div>
              )}
            </div>

            {submitProofError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>{submitProofError}</span>
              </div>
            )}

            {submitProofSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Proof submitted successfully! Moving to Phase 2...</span>
              </div>
            )}

            {/* Step Progress for Phase 1 */}
            {isSubmittingTransaction && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <div className="text-sm font-medium text-blue-700 mb-2">
                  Transaction Progress
                </div>
                {TRANSACTION_STEPS.map((step, index) => {
                  const currentIndex = TRANSACTION_STEPS.findIndex(
                    (s) => s.key === submitProofStep
                  );
                  const isActive = step.key === submitProofStep;
                  const isCompleted = currentIndex > index;

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#3EB100] flex-shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-[#2A72E5] animate-spin flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#CCCCCC] flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          isActive
                            ? "text-[#2A72E5] font-medium"
                            : isCompleted
                              ? "text-[#3EB100]"
                              : "text-[#999999]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/state-explorer?channelId=${channelId}`)
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitProof}
                disabled={
                  !selectedProof ||
                  isSubmittingTransaction ||
                  submitProofSuccess
                }
              >
                {isSubmittingTransaction && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmittingTransaction
                  ? "Submitting..."
                  : "Submit Proof & Move to Closing"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Phase 2: Verify Final Balances */}
      {phase === 2 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            Phase 2: Verify Final Balances & Close Channel
          </h2>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>
                Proof submitted successfully. Channel is now in Closing state.
              </span>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                Final Balance Verification
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This step will generate a Groth16 proof to verify the final
                state of all participants' balances and permanently close the
                channel.
              </p>

              {channelParticipants && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Participants ({channelParticipants.length}):
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {channelParticipants.map((addr, idx) => (
                      <div key={idx} className="font-mono">
                        {addr}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {finalStateRoot && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Final State Root:</div>
                  <div className="text-xs font-mono text-muted-foreground break-all">
                    {finalStateRoot}
                  </div>
                </div>
              )}

              {channelTreeSize && (
                <div className="mt-4">
                  <div className="text-sm font-medium">
                    Tree Size: {Number(channelTreeSize)} leaves
                  </div>
                </div>
              )}

              {permutation.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Permutation Array:</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    [{permutation.map((p) => p.toString()).join(", ")}]
                  </div>
                </div>
              )}

              {finalBalances.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Final Balances:</div>
                  <div className="text-xs space-y-1">
                    {finalBalances.map((balance, idx) => (
                      <div key={idx} className="font-mono">
                        Participant {idx + 1}: {balance.toString()} wei
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {finalProofStatus && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-600">{finalProofStatus}</span>
              </div>
            )}

            {/* Step Progress for Phase 2 - Close Channel Transaction */}
            {isClosingChannelProcessing && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <div className="text-sm font-medium text-blue-700 mb-2">
                  Transaction Progress
                </div>
                {TRANSACTION_STEPS.map((step, index) => {
                  const currentIndex = TRANSACTION_STEPS.findIndex(
                    (s) => s.key === closeChannelStep
                  );
                  const isActive = step.key === closeChannelStep;
                  const isCompleted = currentIndex > index;

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#3EB100] flex-shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-[#2A72E5] animate-spin flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#CCCCCC] flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          isActive
                            ? "text-[#2A72E5] font-medium"
                            : isCompleted
                              ? "text-[#3EB100]"
                              : "text-[#999999]"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {closeChannelError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span>{closeChannelError}</span>
              </div>
            )}

            {closeSuccess && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Channel closed successfully! Redirecting...</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPhase(1)}
                disabled={isClosingChannel || isClosingChannelProcessing}
              >
                Back to Phase 1
              </Button>
              <Button
                onClick={handleVerifyAndClose}
                disabled={
                  isClosingChannel ||
                  isClosingChannelProcessing ||
                  !channelParticipants ||
                  !finalStateRoot ||
                  !channelTreeSize
                }
              >
                {(isClosingChannel || isClosingChannelProcessing) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isClosingChannel || isClosingChannelProcessing
                  ? "Closing Channel..."
                  : "Verify & Close Channel"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
