/**
 * State 3 Component
 *
 * Shows when channel is in Closing state (state 3)
 * Displays close channel button that calls verifyFinalBalancesGroth16()
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useConfig } from "wagmi";
import { readContracts } from "@wagmi/core";
import { Button, Card, CardContent } from "@tokamak/ui";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useVerifyFinalBalances } from "./_hooks";
import { useBridgeCoreRead, useBridgeProofManagerRead, useBridgeCoreAddress, useBridgeCoreAbi } from "@/hooks/contract";
import { generateClientSideProof } from "@/lib/clientProofGeneration";
import JSZip from "jszip";

interface StateSnapshot {
  channelId: number;
  stateRoot: string;
  registeredKeys: string[];
  storageEntries: Array<{ key: string; value: string }>;
  contractAddress: string;
  preAllocatedLeaves: Array<{ key: string; value: string }>;
}

export function State3Page() {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const bridgeCoreAddress = useBridgeCoreAddress();
  const bridgeCoreAbi = useBridgeCoreAbi();
  const { currentChannelId } = useChannelFlowStore();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalBalances, setFinalBalances] = useState<bigint[]>([]);
  const [permutation, setPermutation] = useState<bigint[]>([]);
  const [groth16Proof, setGroth16Proof] = useState<{
    pA: [bigint, bigint, bigint, bigint];
    pB: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
    pC: [bigint, bigint, bigint, bigint];
  } | null>(null);

  // Get channel state to verify it's in state 3
  const { data: channelStateData } = useBridgeCoreRead({
    functionName: "getChannelState",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  // Get channel data for closing
  const { data: channelParticipants } = useBridgeCoreRead({
    functionName: "getChannelParticipants",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  const { data: channelTreeSize } = useBridgeCoreRead({
    functionName: "getChannelTreeSize",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  const {
    data: finalStateRoot,
    isLoading: isFinalStateRootLoading,
    isError: isFinalStateRootError,
    error: finalStateRootError,
  } = useBridgeCoreRead({
    functionName: "getChannelFinalStateRoot",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  // Debug finalStateRoot fetching
  useEffect(() => {
    console.log("[State3Page] 🔍 Final State Root Debug:", {
      currentChannelId,
      isConnected,
      enabled: !!currentChannelId && isConnected,
      isFinalStateRootLoading,
      isFinalStateRootError,
      finalStateRootError: finalStateRootError?.message,
      finalStateRoot,
      finalStateRootType: typeof finalStateRoot,
      finalStateRootString: finalStateRoot?.toString(),
    });
  }, [
    currentChannelId,
    isConnected,
    isFinalStateRootLoading,
    isFinalStateRootError,
    finalStateRootError,
    finalStateRoot,
  ]);

  const { data: channelTargetContract } = useBridgeCoreRead({
    functionName: "getChannelTargetContract",
    args: currentChannelId ? [currentChannelId as `0x${string}`] : undefined,
    query: {
      enabled: !!currentChannelId && isConnected,
    },
  });

  const { data: preAllocatedKeysData } = useBridgeCoreRead({
    functionName: "getPreAllocatedKeys",
    args: channelTargetContract ? [channelTargetContract as `0x${string}`] : undefined,
    query: {
      enabled: !!channelTargetContract && isConnected,
    },
  });
  
  // Cast preAllocatedKeys to the correct type
  const preAllocatedKeys = preAllocatedKeysData as `0x${string}`[] | undefined;

  // Hook for verifying final balances
  const {
    verifyFinalBalances,
    isProcessing: isVerifying,
    isTransactionSuccess,
    error: hookError,
  } = useVerifyFinalBalances({
    channelId: currentChannelId as `0x${string}` | null,
    finalBalances: finalBalances.length > 0 ? finalBalances : undefined,
    permutation: permutation.length > 0 ? permutation : undefined,
    proof: groth16Proof || undefined,
  });

  // Update error state from hook
  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  // Build permutation array based on BridgeProofManager.sol contract logic
  // Contract expects: permutation.length == preAllocatedCount + participants.length
  // permutation[i] = index in registeredKeys (publicSignals) where i-th entry should be placed
  const buildPermutation = useCallback(async () => {
    console.log("[State3Page] 📊 buildPermutation - Input check:", {
      hasChannelParticipants: !!channelParticipants,
      channelParticipants,
      hasFinalStateRoot: !!finalStateRoot,
      finalStateRoot,
      finalStateRootType: typeof finalStateRoot,
      finalStateRootString: finalStateRoot?.toString(),
      hasChannelTargetContract: !!channelTargetContract,
      channelTargetContract,
      hasPreAllocatedKeys: !!preAllocatedKeys,
      preAllocatedKeysCount: preAllocatedKeys ? (preAllocatedKeys as any[]).length : 0,
    });

    if (!channelParticipants || !finalStateRoot || !channelTargetContract) {
      const missingData = {
        channelParticipants: !channelParticipants ? "MISSING" : "OK",
        finalStateRoot: !finalStateRoot ? "MISSING" : "OK",
        channelTargetContract: !channelTargetContract ? "MISSING" : "OK",
      };
      console.error(
        "[State3Page] ❌ buildPermutation - Missing data:",
        missingData
      );
      throw new Error(`Missing channel data: ${JSON.stringify(missingData)}`);
    }

    setStatus("Loading latest verified proof from DB...");

    // Step 1: Load latest verified proof's state_snapshot.json (like useSubmitProof.ts)
    const normalizedChannelId = currentChannelId!.toLowerCase();
    const encodedChannelId = encodeURIComponent(normalizedChannelId);

    // Fetch verified proofs from DB
    const proofsResponse = await fetch(
      `/api/channels/${encodedChannelId}/proofs?type=verified`
    );

    if (!proofsResponse.ok) {
      throw new Error(`Failed to fetch verified proofs: HTTP ${proofsResponse.status}`);
    }

    const proofsData = await proofsResponse.json();
    if (!proofsData.success || !proofsData.data) {
      throw new Error("No verified proofs available");
    }

    // Get proofs array and sort by sequence number
    let proofsArray: Array<{ key: string; sequenceNumber: number }> = [];
    if (Array.isArray(proofsData.data)) {
      proofsArray = proofsData.data;
    } else if (proofsData.data && typeof proofsData.data === "object") {
      proofsArray = Object.entries(proofsData.data).map(([key, value]: [string, any]) => ({
        key,
        ...value,
      }));
    }

    proofsArray.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    if (proofsArray.length === 0) {
      throw new Error("No verified proofs found");
    }

    // Get the latest (last) proof
    const latestProof = proofsArray[proofsArray.length - 1];
    const proofId = latestProof.key;
    console.log("[State3Page] 📦 Latest verified proof for permutation:", { proofId, sequenceNumber: latestProof.sequenceNumber });

    // Load the proof ZIP file
    setStatus("Loading proof ZIP file...");
    const zipApiUrl = `/api/get-proof-zip?channelId=${encodeURIComponent(normalizedChannelId)}&proofId=${encodeURIComponent(proofId)}&status=verifiedProofs&format=binary`;
    const zipResponse = await fetch(zipApiUrl);
    
    if (!zipResponse.ok) {
      let errorDetails = `HTTP ${zipResponse.status}`;
      try {
        const errorData = await zipResponse.json();
        errorDetails = errorData.error || errorData.details || errorDetails;
      } catch {
        errorDetails = zipResponse.statusText || errorDetails;
      }
      throw new Error(`Failed to load proof file: ${proofId} (${errorDetails})`);
    }

    const zipBlob = await zipResponse.blob();
    const zipArrayBuffer = await zipBlob.arrayBuffer();
    const zip = await JSZip.loadAsync(zipArrayBuffer);

    // Find and parse state_snapshot.json
    let stateSnapshotJson: string | null = null;
    const files = Object.keys(zip.files);
    for (const filePath of files) {
      const fileName = filePath.split("/").pop()?.toLowerCase();
      if (fileName === "state_snapshot.json") {
        const file = zip.file(filePath);
        if (file) {
          stateSnapshotJson = await file.async("string");
          break;
        }
      }
    }

    if (!stateSnapshotJson) {
      throw new Error("state_snapshot.json not found in proof ZIP file");
    }

    const stateSnapshot = JSON.parse(stateSnapshotJson) as StateSnapshot;
    console.log("[State3Page] 📦 State snapshot from verified proof (for permutation):", stateSnapshot);

    setStatus("Calculating permutation...");

    // Use registeredKeys from state_snapshot.json - this is the order used in proof generation
    const registeredKeys = stateSnapshot.registeredKeys || [];
    const storageEntries = stateSnapshot.storageEntries || [];
    const snapshotPreAllocatedLeaves = stateSnapshot.preAllocatedLeaves || [];

    console.log("[State3Page] 📦 Storage entries from verified proof:", storageEntries);
    console.log("[State3Page] 🌿 PreAllocated leaves from snapshot:", snapshotPreAllocatedLeaves);

    if (!channelTreeSize) {
      throw new Error("Channel tree size is required");
    }

    const treeSize = Number(channelTreeSize);
    const preAllocatedCount = preAllocatedKeys ? preAllocatedKeys.length : 0;
    const participantsArray = channelParticipants as unknown as `0x${string}`[];
    const participantCount = participantsArray.length;
    
    console.log("[State3Page] 🌳 Tree size:", treeSize);
    console.log("[State3Page] 🌿 PreAllocated count from contract:", preAllocatedCount);
    console.log("[State3Page] 👥 Participant count:", participantCount);

    // Create a map from normalized key to its index in registeredKeys (proof order)
    const registeredKeyIndexMap = new Map<string, number>();
    registeredKeys.forEach((key: string, index: number) => {
      const normalizedKey = key.toLowerCase().startsWith("0x")
        ? key.toLowerCase()
        : `0x${key.toLowerCase()}`;
      registeredKeyIndexMap.set(normalizedKey, index);
    });

    // Also create a map from key to value from storageEntries
    const storageValueMap = new Map<string, string>();
    storageEntries.forEach((entry: { key: string; value: string }) => {
      const normalizedKey = entry.key.toLowerCase().startsWith("0x")
        ? entry.key.toLowerCase()
        : `0x${entry.key.toLowerCase()}`;
      storageValueMap.set(normalizedKey, entry.value);
    });
    // Add preAllocatedLeaves to the value map
    snapshotPreAllocatedLeaves.forEach((entry: { key: string; value: string }) => {
      const normalizedKey = entry.key.toLowerCase().startsWith("0x")
        ? entry.key.toLowerCase()
        : `0x${entry.key.toLowerCase()}`;
      if (!storageValueMap.has(normalizedKey)) {
        storageValueMap.set(normalizedKey, entry.value);
      }
    });

    // Contract expects permutation length = preAllocatedCount + participantCount
    // NOT treeSize!
    const expectedPermutationLength = preAllocatedCount + participantCount;
    console.log("[State3Page] 📐 Expected permutation length:", expectedPermutationLength);

    const perm: bigint[] = [];
    const balances: bigint[] = [];

    // Step 1: Add permutation entries for pre-allocated leaves FIRST
    // Contract iterates preAllocatedKeys from contract storage
    if (preAllocatedCount > 0 && preAllocatedKeys) {
      console.log("[State3Page] 🌿 Processing pre-allocated keys from contract:", preAllocatedKeys);
      
      for (let i = 0; i < preAllocatedKeys.length; i++) {
        const preAllocKey = preAllocatedKeys[i];
        const normalizedKey = preAllocKey.toLowerCase();
        
        // Find where this key is in registeredKeys (proof order)
        const proofIndex = registeredKeyIndexMap.get(normalizedKey);
        
        if (proofIndex !== undefined) {
          perm.push(BigInt(proofIndex));
          console.log(`[State3Page] 🌿 PreAlloc[${i}]: key ${normalizedKey} -> proof index ${proofIndex}`);
        } else {
          console.warn(`[State3Page] ⚠️ PreAlloc key ${normalizedKey} not found in registeredKeys, using 0`);
          perm.push(BigInt(0));
        }
      }
    }

    // Step 2: Add permutation entries for participants
    // Get MPT keys for each participant
    setStatus("Fetching participant MPT keys...");
    const mptKeyContracts = participantsArray.map((participant: `0x${string}`) => ({
      address: bridgeCoreAddress,
      abi: bridgeCoreAbi,
      functionName: "getL2MptKey" as const,
      args: [currentChannelId as `0x${string}`, participant],
    }));

    const mptKeyResults = await readContracts(config, {
      contracts: mptKeyContracts,
    });

    console.log("[State3Page] 👥 Processing participants for permutation and balances:");

    for (let i = 0; i < participantsArray.length; i++) {
      const participant = participantsArray[i];
      const mptKeyResult = mptKeyResults[i];

      if (!mptKeyResult || mptKeyResult.status !== "success") {
        console.warn(
          `[State3Page] ⚠️ Failed to fetch MPT key for participant ${i} (${participant})`
        );
        perm.push(BigInt(0));
        balances.push(BigInt(0));
        continue;
      }

      const mptKey = mptKeyResult.result as bigint;
      const mptKeyHex = `0x${mptKey.toString(16).padStart(64, "0")}`.toLowerCase();

      // Find where this MPT key is in registeredKeys (proof order)
      const proofIndex = registeredKeyIndexMap.get(mptKeyHex);

      if (proofIndex !== undefined) {
        perm.push(BigInt(proofIndex));
        
        // Get balance from storageValueMap
        const balanceValue = storageValueMap.get(mptKeyHex) || "0";
        let balance: bigint;
        if (balanceValue === "0x" || balanceValue === "") {
          balance = BigInt(0);
        } else if (balanceValue.startsWith("0x")) {
          balance = BigInt(balanceValue);
        } else {
          balance = BigInt(balanceValue);
        }
        balances.push(balance);
        
        console.log(
          `[State3Page] ✅ Participant ${i} (${participant}): MPT key ${mptKeyHex} -> proof index ${proofIndex}, balance = ${balance.toString()}`
        );
      } else {
        console.warn(
          `[State3Page] ⚠️ No registeredKey found for participant ${i} (${participant}) with MPT key ${mptKeyHex}, using index 0`
        );
        perm.push(BigInt(0));
        balances.push(BigInt(0));
      }
    }

    // Verify permutation length matches contract expectation
    if (perm.length !== expectedPermutationLength) {
      console.error(`[State3Page] ❌ Permutation length mismatch! Expected ${expectedPermutationLength}, got ${perm.length}`);
    }

    console.log("[State3Page] 🔢 Final permutation array:", {
      length: perm.length,
      expectedLength: expectedPermutationLength,
      values: perm.map((p) => p.toString()),
    });

    console.log(
      "[State3Page] 💰 Final balances (participant order):",
      balances.map((b) => b.toString())
    );
    
    setPermutation(perm);
    setFinalBalances(balances);

    return { permutation: perm, finalBalances: balances };
  }, [
    currentChannelId,
    channelParticipants,
    finalStateRoot,
    channelTargetContract,
    channelTreeSize,
    preAllocatedKeys,
    config,
    bridgeCoreAddress,
    bridgeCoreAbi,
  ]);

  // Generate Groth16 proof (similar to close-channel page)
  const generateGroth16ProofForClose = useCallback(async () => {
    console.log("[State3Page] 🔐 generateGroth16ProofForClose - Input check:", {
      hasChannelTreeSize: !!channelTreeSize,
      channelTreeSize: channelTreeSize?.toString(),
      hasFinalStateRoot: !!finalStateRoot,
      finalStateRoot,
      finalStateRootType: typeof finalStateRoot,
      finalStateRootString: finalStateRoot?.toString(),
      hasChannelTargetContract: !!channelTargetContract,
      channelTargetContract,
    });

    if (!channelTreeSize || !finalStateRoot || !channelTargetContract) {
      const missingData = {
        channelTreeSize: !channelTreeSize ? "MISSING" : "OK",
        finalStateRoot: !finalStateRoot ? "MISSING" : "OK",
        channelTargetContract: !channelTargetContract ? "MISSING" : "OK",
      };
      console.error(
        "[State3Page] ❌ generateGroth16ProofForClose - Missing data:",
        missingData
      );
      throw new Error(`Missing channel data: ${JSON.stringify(missingData)}`);
    }

    setStatus("Loading latest verified proof from DB...");

    // Step 1: Load latest verified proof's state_snapshot.json (like useSubmitProof.ts)
    const normalizedChannelId = currentChannelId!.toLowerCase();
    const encodedChannelId = encodeURIComponent(normalizedChannelId);

    // Fetch verified proofs from DB
    const proofsResponse = await fetch(
      `/api/channels/${encodedChannelId}/proofs?type=verified`
    );

    if (!proofsResponse.ok) {
      throw new Error(`Failed to fetch verified proofs: HTTP ${proofsResponse.status}`);
    }

    const proofsData = await proofsResponse.json();
    if (!proofsData.success || !proofsData.data) {
      throw new Error("No verified proofs available");
    }

    // Get proofs array and sort by sequence number
    let proofsArray: Array<{ key: string; sequenceNumber: number }> = [];
    if (Array.isArray(proofsData.data)) {
      proofsArray = proofsData.data;
    } else if (proofsData.data && typeof proofsData.data === "object") {
      proofsArray = Object.entries(proofsData.data).map(([key, value]: [string, any]) => ({
        key,
        ...value,
      }));
    }

    proofsArray.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    if (proofsArray.length === 0) {
      throw new Error("No verified proofs found");
    }

    // Get the latest (last) proof
    const latestProof = proofsArray[proofsArray.length - 1];
    const proofId = latestProof.key;
    console.log("[State3Page] 📦 Latest verified proof:", { proofId, sequenceNumber: latestProof.sequenceNumber });

    // Load the proof ZIP file
    setStatus("Loading proof ZIP file...");
    const zipApiUrl = `/api/get-proof-zip?channelId=${encodeURIComponent(normalizedChannelId)}&proofId=${encodeURIComponent(proofId)}&status=verifiedProofs&format=binary`;
    const zipResponse = await fetch(zipApiUrl);
    
    if (!zipResponse.ok) {
      let errorDetails = `HTTP ${zipResponse.status}`;
      try {
        const errorData = await zipResponse.json();
        errorDetails = errorData.error || errorData.details || errorDetails;
      } catch {
        errorDetails = zipResponse.statusText || errorDetails;
      }
      throw new Error(`Failed to load proof file: ${proofId} (${errorDetails})`);
    }

    const zipBlob = await zipResponse.blob();
    const zipArrayBuffer = await zipBlob.arrayBuffer();
    const zip = await JSZip.loadAsync(zipArrayBuffer);

    // Find and parse state_snapshot.json
    let stateSnapshotJson: string | null = null;
    const files = Object.keys(zip.files);
    for (const filePath of files) {
      const fileName = filePath.split("/").pop()?.toLowerCase();
      if (fileName === "state_snapshot.json") {
        const file = zip.file(filePath);
        if (file) {
          stateSnapshotJson = await file.async("string");
          break;
        }
      }
    }

    if (!stateSnapshotJson) {
      throw new Error("state_snapshot.json not found in proof ZIP file");
    }

    const stateSnapshot = JSON.parse(stateSnapshotJson) as StateSnapshot;
    console.log("[State3Page] 📦 State snapshot from verified proof:", stateSnapshot);

    const treeSize = Number(channelTreeSize);
    if (![16, 32, 64, 128].includes(treeSize)) {
      throw new Error(`Unsupported tree size: ${treeSize}`);
    }

    // Use registeredKeys and storageEntries from state_snapshot.json
    const registeredKeys = stateSnapshot.registeredKeys || [];
    const storageEntries = stateSnapshot.storageEntries || [];
    const preAllocatedLeaves = stateSnapshot.preAllocatedLeaves || [];

    console.log("[State3Page] 🔐 Proof generation - storage entries (from verified proof):", storageEntries);
    console.log("[State3Page] 🔑 Registered keys (from verified proof):", registeredKeys);
    console.log("[State3Page] 🌿 Pre-allocated leaves (from verified proof):", preAllocatedLeaves);

    // Create a map of storage entry key to entry (including preAllocatedLeaves)
    const storageEntryMap = new Map<string, { key: string; value: string }>();
    
    // Add storage entries
    storageEntries.forEach((entry: { key: string; value: string }) => {
      const normalizedKey = entry.key.toLowerCase().startsWith("0x")
        ? entry.key.toLowerCase()
        : `0x${entry.key.toLowerCase()}`;
      storageEntryMap.set(normalizedKey, entry);
    });

    // Add pre-allocated leaves
    preAllocatedLeaves.forEach((entry: { key: string; value: string }) => {
      const normalizedKey = entry.key.toLowerCase().startsWith("0x")
        ? entry.key.toLowerCase()
        : `0x${entry.key.toLowerCase()}`;
      if (!storageEntryMap.has(normalizedKey)) {
        storageEntryMap.set(normalizedKey, entry);
      }
    });

    // Build storage keys and values arrays in registeredKeys order
    const storageKeys: string[] = [];
    const storageValues: string[] = [];

    // Add storage entries in registeredKeys order
    for (let i = 0; i < Math.min(registeredKeys.length, treeSize); i++) {
      const registeredKey = registeredKeys[i];
      const normalizedKey = registeredKey.toLowerCase().startsWith("0x")
        ? registeredKey.toLowerCase()
        : `0x${registeredKey.toLowerCase()}`;
      
      const entry = storageEntryMap.get(normalizedKey);
      if (entry) {
        storageKeys.push(normalizedKey); // Use normalized key format
        // state_snapshot.json has hex values like "0x0de0b6b3a7640000"
        // Convert to decimal string for circuit
        let normalizedValue = entry.value || "0";
        if (normalizedValue === "0x" || normalizedValue === "") {
          normalizedValue = "0";
        } else if (normalizedValue.startsWith("0x")) {
          // Convert hex to decimal string
          normalizedValue = BigInt(normalizedValue).toString();
        }
        storageValues.push(normalizedValue);
        console.log(`[State3Page] 🔑 Circuit input[${i}]:`, {
          registeredKey: normalizedKey,
          key: entry.key,
          value: entry.value,
          normalizedValue,
        });
      } else {
        // Key not found in storageEntries, use zero
        storageKeys.push(normalizedKey);
        storageValues.push("0");
        console.log(`[State3Page] ⚠️ Circuit input[${i}]: key ${normalizedKey} not found in storageEntries, using 0`);
      }
    }

    // Pad to tree size if needed
    while (storageKeys.length < treeSize) {
      storageKeys.push(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      storageValues.push("0");
    }

    console.log("[State3Page] 📊 Circuit input summary:", {
      treeSize,
      actualEntries: registeredKeys.length,
      paddedEntries: storageKeys.length - registeredKeys.length,
      totalKeys: storageKeys.length,
    });

    setStatus("Generating Groth16 proof... This may take a few minutes...");

    // Generate proof
    const proofResult = await generateClientSideProof(
      {
        storage_keys_L2MPT: storageKeys,
        storage_values: storageValues,
        treeSize,
      },
      (status) => setStatus(status)
    );

    // Debug: Log publicSignals for verification
    console.log("[State3Page] 🔍 Proof generation result:", {
      publicSignalsLength: proofResult.publicSignals.length,
      expectedPublicSignalsLength: treeSize * 2 + 1,
      publicSignals: proofResult.publicSignals,
      merkleRoot: proofResult.proof.merkleRoot,
      firstPublicSignal: proofResult.publicSignals[0],
    });
    
    // Verify publicSignals length
    if (proofResult.publicSignals.length !== treeSize * 2 + 1) {
      console.warn(`[State3Page] ⚠️ PublicSignals length mismatch! Expected ${treeSize * 2 + 1}, got ${proofResult.publicSignals.length}`);
    }

    setGroth16Proof({
      pA: [...proofResult.proof.pA] as [bigint, bigint, bigint, bigint],
      pB: [...proofResult.proof.pB] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
      pC: [...proofResult.proof.pC] as [bigint, bigint, bigint, bigint],
    });

    return proofResult;
  }, [
    currentChannelId,
    channelTreeSize,
    finalStateRoot,
    channelTargetContract,
  ]);

  // Handle close channel
  const handleCloseChannel = async () => {
    console.log("[State3Page] 🚀 handleCloseChannel called");
    console.log("[State3Page] 📋 Initial state check:", {
      currentChannelId,
      isConnected,
      channelParticipants,
      finalStateRoot,
      finalStateRootType: typeof finalStateRoot,
      finalStateRootString: finalStateRoot?.toString(),
      channelTreeSize: channelTreeSize?.toString(),
      channelTargetContract,
      preAllocatedKeys: preAllocatedKeys
        ? `Array(${preAllocatedKeys.length})`
        : "undefined",
    });

    if (!currentChannelId) {
      setError("Channel ID is required");
      console.error("[State3Page] ❌ No channel ID");
      return;
    }

    console.log(
      "[State3Page] ✅ Starting close channel process for:",
      currentChannelId
    );

    setIsProcessing(true);
    setError(null);
    setStatus("Preparing final state data...");

    try {
      // Step 1: Build permutation and final balances
      console.log("[State3Page] 📊 Step 1: Building permutation...");
      const permResult = await buildPermutation();
      console.log("[State3Page] ✅ Permutation built:", {
        finalBalances: permResult.finalBalances.map((b) => b.toString()),
        permutation: permResult.permutation.map((p) => p.toString()),
      });

      // Step 2: Generate Groth16 proof
      console.log("[State3Page] 🔐 Step 2: Generating Groth16 proof...");
      const proofResult = await generateGroth16ProofForClose();
      console.log("[State3Page] ✅ Groth16 proof generated:", {
        pA: [...proofResult.proof.pA].map((p: bigint) => p.toString()),
        pB: [...proofResult.proof.pB].map((p: bigint) => p.toString()),
        pC: [...proofResult.proof.pC].map((p: bigint) => p.toString()),
      });

      // Step 3: Verify final balances and close channel
      console.log("[State3Page] 🔗 Step 3: Verifying final balances...");
      console.log("[State3Page] 📋 Data to submit:", {
        finalBalances: permResult.finalBalances,
        permutation: permResult.permutation,
        proof: {
          pA: [...proofResult.proof.pA],
          pB: [...proofResult.proof.pB],
          pC: [...proofResult.proof.pC],
        },
      });

      setStatus("Submitting to blockchain...");

      // Pass the values directly to verifyFinalBalances instead of relying on state
      await verifyFinalBalances({
        finalBalances: permResult.finalBalances,
        permutation: permResult.permutation,
        proof: {
          pA: [...proofResult.proof.pA] as [bigint, bigint, bigint, bigint],
          pB: [...proofResult.proof.pB] as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
          pC: [...proofResult.proof.pC] as [bigint, bigint, bigint, bigint],
        },
      });

      console.log("[State3Page] ✅ Close channel completed successfully");
    } catch (err) {
      console.error("[State3Page] ❌ Error closing channel:", err);
      console.error("[State3Page] 📊 Error details:", {
        message: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        type: typeof err,
        err,
      });
      setError(err instanceof Error ? err.message : "Failed to close channel");
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Debug: Log button state
  useEffect(() => {
    console.log("[State3Page] Button state:", {
      isProcessing,
      isVerifying,
      isTransactionSuccess,
      isConnected,
      hasChannelParticipants: !!channelParticipants,
      hasFinalStateRoot: !!finalStateRoot,
      hasChannelTreeSize: !!channelTreeSize,
      channelParticipants,
      finalStateRoot,
      channelTreeSize,
    });
  }, [
    isProcessing,
    isVerifying,
    isTransactionSuccess,
    isConnected,
    channelParticipants,
    finalStateRoot,
    channelTreeSize,
  ]);

  return (
    <Card className="max-w-2xl">
      <CardContent className="space-y-6 pt-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Channel Closing</h3>
          <p className="text-gray-600 text-sm">
            Channel is in Closing state (state 3). Verify final balances to
            close the channel and move to state 4 (Closed).
          </p>
        </div>

        {/* Channel Info */}
        {currentChannelId && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Channel ID</p>
            <p className="text-lg font-mono font-medium text-gray-900">
              {currentChannelId}
            </p>
            {channelStateData !== undefined && (
              <p className="text-sm text-gray-500 mt-2">
                Current State: {Number(channelStateData)} (Closing)
              </p>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <p className="font-semibold text-yellow-800 mb-2">Debug Info:</p>
          <div className="space-y-1 text-yellow-700">
            <p>Connected: {isConnected ? "✓" : "✗"}</p>
            <p>
              Channel Participants:{" "}
              {channelParticipants ? `✓ (${(channelParticipants as unknown as `0x${string}`[]).length})` : "✗"}
            </p>
            <p>Final State Root: {finalStateRoot ? "✓" : "✗"}</p>
            <p>
              Channel Tree Size:{" "}
              {channelTreeSize ? `✓ (${Number(channelTreeSize)})` : "✗"}
            </p>
            <p>Processing: {isProcessing ? "Yes" : "No"}</p>
            <p>Verifying: {isVerifying ? "Yes" : "No"}</p>
          </div>
        </div>

        {/* Status Messages */}
        {status && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-700 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{status}</span>
          </div>
        )}

        {isTransactionSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>
              Channel closed successfully! Channel state is now 4 (Closed).
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Warning messages for missing data */}
        {isConnected && !channelParticipants && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            ⚠️ Loading channel participants...
          </div>
        )}
        {isConnected && !finalStateRoot && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            ⚠️ Loading final state root...
          </div>
        )}
        {isConnected && !channelTreeSize && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            ⚠️ Loading channel tree size...
          </div>
        )}

        {/* Close Channel Button */}
        <Button
          onClick={handleCloseChannel}
          disabled={
            isProcessing ||
            isVerifying ||
            isTransactionSuccess ||
            !isConnected ||
            !channelParticipants ||
            !finalStateRoot ||
            !channelTreeSize
          }
          className="w-full"
        >
          {isProcessing || isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {status || "Verifying Final Balances..."}
            </>
          ) : isTransactionSuccess ? (
            "Channel Closed"
          ) : (
            "Close Channel"
          )}
        </Button>

        {!isConnected && (
          <p className="text-sm text-gray-500 text-center">
            Please connect your wallet to close the channel.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
