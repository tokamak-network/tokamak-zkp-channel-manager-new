"use client";

import { useState, useEffect, useLayoutEffect, useCallback, Suspense } from "react";
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { useSearchParams, useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { useBridgeCoreRead } from "@/hooks/contract/useBridgeCore";
import { getContractAddress, getContractAbi } from "@tokamak/config";
import { useNetworkId } from "@/hooks/contract/utils";
// Types for database responses
interface Proof {
  key?: string;
  sequenceNumber?: number;
  proofData?: any;
  status?: "submitted" | "verified" | "rejected";
  _createdAt?: string;
  _updatedAt?: string;
  [key: string]: any;
}

interface StateSnapshot {
  snapshotId?: string;
  sequenceNumber?: number;
  merkleRoot?: string;
  stateData?: any;
  _createdAt?: string;
  [key: string]: any;
}
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  Users,
  Coins,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Layers,
  Shield,
  Hash,
  RefreshCw,
  AlertCircle,
  Plus,
} from "lucide-react";
import { TransactionBundleModal } from "@/components/TransactionBundleModal";
import { ProofCard, type ProofData } from "@/components/ProofCard";

// Types
interface ParticipantBalance {
  address: string;
  initialDeposit: string;
  currentBalance: string;
  symbol: string;
  decimals: number;
}

interface StateTransition {
  sequenceNumber: number;
  proofId: string;
  timestamp: number;
  submitter: string;
  merkleRoots: {
    initial: string;
    resulting: string;
  };
  balanceChanges: {
    address: string;
    before: string;
    after: string;
    change: string;
  }[];
}

interface OnChainChannel {
  id: number;
  state: number;
  participantCount: number;
  participants: string[];
  leader: string;
  isLeader: boolean;
  targetAddress: string;
  hasPublicKey: boolean;
}

const ChannelState = {
  0: "none",
  1: "pending",
  2: "active",
  3: "active",
  4: "closing",
  5: "closed",
} as const;

// Channel Selection View Component
function ChannelSelectionView({
  channels,
  onSelectChannel,
  isLoading,
  onRefresh,
  error,
}: {
  channels: OnChainChannel[];
  onSelectChannel: (channel: OnChainChannel) => void;
  isLoading: boolean;
  onRefresh: () => void;
  error: string | null;
}) {
  const activeChannels = channels.filter((c) => {
    const state = ChannelState[c.state as keyof typeof ChannelState];
    return state === "active";
  });
  const pendingChannels = channels.filter((c) => {
    const state = ChannelState[c.state as keyof typeof ChannelState];
    return state === "pending";
  });
  const closedChannels = channels.filter((c) => {
    const state = ChannelState[c.state as keyof typeof ChannelState];
    return state === "closed" || state === "closing";
  });

  return (
    <div className="p-4 pb-20">
      <div className="max-w-5xl w-full mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] p-6 mb-6 shadow-lg shadow-[#4fc3f7]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#4fc3f7] p-2 rounded">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  State Explorer
                </h2>
                <p className="text-gray-400 text-sm">
                  Select a channel to view its state
                </p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-[#4fc3f7]/10 hover:bg-[#4fc3f7]/20 text-[#4fc3f7] rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[#4fc3f7]" />
            <span className="ml-4 text-gray-400">
              Loading your channels from blockchain...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-medium">
                Failed to load channels
              </p>
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* No Channels */}
        {!isLoading && !error && channels.length === 0 && (
          <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No Channels Found
            </h3>
            <p className="text-gray-400">
              You are not participating in any channels.
            </p>
          </div>
        )}

        {/* Active Channels */}
        {!isLoading && activeChannels.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Active Channels ({activeChannels.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 text-left hover:border-[#4fc3f7] transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/20 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold group-hover:text-[#4fc3f7] transition-colors font-mono">
                          Channel #{channel.id}
                        </h4>
                        {channel.isLeader && (
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                            LEADER
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-green-400 text-xs">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      Active
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-[#0a1930]/50 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Participants
                      </div>
                      <div className="text-white font-medium text-sm">
                        {channel.participantCount}
                      </div>
                    </div>
                    <div className="bg-[#0a1930]/50 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Public Key
                      </div>
                      <div className="text-white font-medium text-sm">
                        {channel.hasPublicKey ? "✓ Set" : "✗ Not set"}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Target: {channel.targetAddress.slice(0, 6)}...
                    {channel.targetAddress.slice(-4)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pending Channels */}
        {!isLoading && pendingChannels.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              Pending Channels ({pendingChannels.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-yellow-500/30 p-5 text-left hover:border-yellow-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold font-mono">
                        Channel #{channel.id}
                      </h4>
                      {channel.isLeader && (
                        <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          LEADER
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-yellow-400 text-xs">
                      <Clock className="w-3 h-3" />
                      Pending
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {channel.participantCount} participants • Awaiting
                    initialization
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Closed Channels */}
        {!isLoading && closedChannels.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              Closed Channels ({closedChannels.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-gray-600/30 p-5 text-left hover:border-gray-500/50 transition-all opacity-60 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-gray-400 font-semibold font-mono">
                      Channel #{channel.id}
                    </h4>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <XCircle className="w-3 h-3" />
                      Closed
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {channel.participantCount} participants
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// State Explorer Detail View Component
function StateExplorerDetailView({
  channel,
  onBack,
  userAddress,
}: {
  channel: OnChainChannel;
  onBack: () => void;
  userAddress: string;
}) {
  const [filter, setFilter] = useState<
    "all" | "pending" | "verified" | "rejected"
  >("all");
  const [isBalancesExpanded, setIsBalancesExpanded] = useState(false);
  const [participantBalances, setParticipantBalances] = useState<
    ParticipantBalance[]
  >([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [isLoadingProofs, setIsLoadingProofs] = useState(true);
  const [initialMerkleRoot, setInitialMerkleRoot] = useState<string>("N/A");
  const [currentMerkleRoot, setCurrentMerkleRoot] = useState<string>("N/A");
  const [stateTransitions, setStateTransitions] = useState<StateTransition[]>(
    []
  );
  const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
  const [isTransitionsExpanded, setIsTransitionsExpanded] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [selectedProofForApproval, setSelectedProofForApproval] = useState<
    string | null
  >(null);
  const [isDeletingProof, setIsDeletingProof] = useState<string | null>(null);
  const publicClient = usePublicClient();
  const networkId = useNetworkId();
  const bridgeCoreAddress = getContractAddress("BridgeCore", networkId);
  const bridgeCoreAbi = getContractAbi("BridgeCore");

  // Get token info
  const isETH =
    channel.targetAddress === "0x0000000000000000000000000000000000000001" ||
    channel.targetAddress === "0x0000000000000000000000000000000000000000";

  // Get token info using publicClient directly in useEffect
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [tokenSymbol, setTokenSymbol] = useState<string>("ETH");

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (isETH || channel.targetAddress === "0x0000000000000000000000000000000000000000") {
        setTokenDecimals(18);
        setTokenSymbol("ETH");
        return;
      }

      if (!publicClient) return;

      try {
        const [decimals, symbol] = await Promise.all([
          publicClient.readContract({
            address: channel.targetAddress as `0x${string}`,
            abi: [
              {
                name: "decimals",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [{ name: "", type: "uint8" }],
              },
            ] as const,
            functionName: "decimals",
          }),
          publicClient.readContract({
            address: channel.targetAddress as `0x${string}`,
            abi: [
              {
                name: "symbol",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [{ name: "", type: "string" }],
              },
            ] as const,
            functionName: "symbol",
          }),
        ]);

        setTokenDecimals(Number(decimals) || 18);
        setTokenSymbol(String(symbol) || "TOKEN");
      } catch (error) {
        console.error("Error fetching token info:", error);
        setTokenDecimals(18);
        setTokenSymbol("TOKEN");
      }
    };

    fetchTokenInfo();
  }, [channel.targetAddress, isETH, publicClient]);

  const decimals = tokenDecimals;
  const symbol = tokenSymbol;

  // Get initial deposits
  const depositContracts = channel.participants.map((participant) => ({
    address: bridgeCoreAddress,
    abi: bridgeCoreAbi,
    functionName: "getParticipantDeposit" as const,
    args: [BigInt(channel.id), participant as `0x${string}`] as const,
  }));

  const { data: initialDeposits } = useReadContracts({
    contracts: depositContracts,
    enabled: channel.participants.length > 0,
  });

  // Fetch channel data from database
  const fetchChannelData = useCallback(async () => {
    if (!publicClient || !initialDeposits || channel.participants.length === 0) {
      return;
    }

    setIsLoadingBalances(true);
    setIsLoadingProofs(true);
    setIsLoadingTransitions(true);

    try {
      const channelId = channel.id.toString();

      // Get proofs from API
      const [verifiedResponse, submittedResponse, rejectedResponse, snapshotsResponse] = await Promise.all([
        fetch(`/api/channels/${channelId}/proofs?type=verified`).catch(() => ({ ok: false, json: () => Promise.resolve({ proofs: [] }) })),
        fetch(`/api/channels/${channelId}/proofs?type=submitted`).catch(() => ({ ok: false, json: () => Promise.resolve({ proofs: [] }) })),
        fetch(`/api/channels/${channelId}/proofs?type=rejected`).catch(() => ({ ok: false, json: () => Promise.resolve({ proofs: [] }) })),
        fetch(`/api/channels/${channelId}/snapshots?limit=100`).catch(() => ({ ok: false, json: () => Promise.resolve({ snapshots: [] }) })),
      ]);

      const [verifiedData, submittedData, rejectedData, snapshotsData] = await Promise.all([
        verifiedResponse.json().catch(() => ({ proofs: [] })),
        submittedResponse.json().catch(() => ({ proofs: [] })),
        rejectedResponse.json().catch(() => ({ proofs: [] })),
        snapshotsResponse.json().catch(() => ({ snapshots: [] })),
      ]);

      const verifiedProofs = (verifiedData?.proofs || []) as Proof[];
      const submittedProofs = (submittedData?.proofs || []) as Proof[];
      const rejectedProofs = (rejectedData?.proofs || []) as Proof[];

      // Combine all proofs
      const allProofs: Proof[] = [
        ...verifiedProofs.map((p: Proof) => ({ ...p, status: "verified" as const })),
        ...submittedProofs.map((p: Proof) => ({ ...p, status: "submitted" as const })),
        ...rejectedProofs.map((p: Proof) => ({ ...p, status: "rejected" as const })),
      ];

      setProofs(allProofs);

      // Get state snapshots
      const snapshots: StateSnapshot[] = snapshotsData.snapshots || [];
      
      // Process snapshots for state transitions
      const transitions: StateTransition[] = snapshots
        .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
        .map((snapshot, idx) => {
          const prevSnapshot = idx > 0 ? snapshots[idx - 1] : null;
          return {
            sequenceNumber: snapshot.sequenceNumber || 0,
            proofId: snapshot.snapshotId || `snapshot-${idx}`,
            timestamp: snapshot._createdAt
              ? new Date(snapshot._createdAt).getTime()
              : Date.now(),
            submitter: (snapshot as any).submitter || "Unknown",
            merkleRoots: {
              initial: prevSnapshot?.merkleRoot || snapshot.merkleRoot || "N/A",
              resulting: snapshot.merkleRoot || "N/A",
            },
            balanceChanges: [], // Will be populated if snapshot has balance data
          };
        });

      setStateTransitions(transitions);

      // Set merkle roots
      if (snapshots.length > 0) {
        const firstSnapshot = snapshots[0];
        const lastSnapshot = snapshots[snapshots.length - 1];
        setInitialMerkleRoot(firstSnapshot.merkleRoot || "N/A");
        setCurrentMerkleRoot(lastSnapshot.merkleRoot || "N/A");
      }

      // Set participant balances
      const balances: ParticipantBalance[] = channel.participants.map(
        (participant, idx) => {
          const initialDeposit =
            (initialDeposits?.[idx]?.result as bigint) || BigInt(0);
          const initialDepositFormatted = formatUnits(initialDeposit, decimals);
          
          // Try to get current balance from latest snapshot
          let currentBalance = initialDepositFormatted;
          if (snapshots.length > 0) {
            const latestSnapshot = snapshots[snapshots.length - 1];
            const stateData = latestSnapshot.stateData as any;
            if (stateData?.balances?.[participant]) {
              currentBalance = formatUnits(
                BigInt(stateData.balances[participant]),
                decimals
              );
            }
          }

          return {
            address: participant,
            initialDeposit: initialDepositFormatted,
            currentBalance,
            symbol,
            decimals,
          };
        }
      );

      setParticipantBalances(balances);
    } catch (error) {
      console.error("Error fetching channel data:", error);
      // Fallback balances
      const fallbackBalances: ParticipantBalance[] = channel.participants.map(
        (participant, idx) => {
          const initialDeposit =
            (initialDeposits?.[idx]?.result as bigint) || BigInt(0);
          return {
            address: participant,
            initialDeposit: formatUnits(initialDeposit, decimals),
            currentBalance: formatUnits(initialDeposit, decimals),
            symbol,
            decimals,
          };
        }
      );
      setParticipantBalances(fallbackBalances);
    } finally {
      setIsLoadingBalances(false);
      setIsLoadingProofs(false);
      setIsLoadingTransitions(false);
    }
  }, [initialDeposits, channel.id, channel.participants, publicClient, decimals, symbol]);

  useEffect(() => {
    if (initialDeposits && channel.participants.length > 0) {
      fetchChannelData();
    }
  }, [initialDeposits, channel.participants.length, fetchChannelData]);

  // Check if user is leader
  const isLeader = channel.isLeader;

  // Handle proof verification
  const handleVerifyProof = async (proof: ProofData) => {
    if (!isLeader || !proof.key || !proof.sequenceNumber) {
      return;
    }

    setIsVerifying(proof.key as string);

    try {
      // Call backend API to perform atomic verification
      const response = await fetch("/api/verify-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel.id,
          proofKey: proof.key,
          sequenceNumber: proof.sequenceNumber,
          verifierAddress: userAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to verify proof");
      }

      const result = await response.json();
      console.log("Proof verified successfully:", result);

      // Refresh proofs
      await fetchChannelData();
      setSelectedProofForApproval(null);
    } catch (error) {
      console.error("Error verifying proof:", error);
      alert(
        `Failed to verify proof: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsVerifying(null);
    }
  };

  // Handle proof deletion
  const handleDeleteProof = async (proof: ProofData) => {
    if (!proof.key) {
      return;
    }

    setIsDeletingProof(proof.key);

    try {
      const response = await fetch("/api/delete-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId: channel.id,
          proofKey: proof.key,
          userAddress: userAddress,
          isLeader: isLeader,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete proof");
      }

      // Refresh proofs
      await fetchChannelData();
    } catch (error) {
      console.error("Error deleting proof:", error);
      alert(
        `Failed to delete proof: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsDeletingProof(null);
    }
  };

  const filteredProofs = proofs
    .map((proof) => {
      // Convert Proof to ProofData format
      const proofData: ProofData = {
        id: proof.key || proof.sequenceNumber || "",
        status:
          proof.status === "submitted"
            ? "pending"
            : (proof.status as ProofData["status"]) || "pending",
        timestamp:
          proof.timestamp ||
          (proof._createdAt
            ? new Date(proof._createdAt).getTime()
            : Date.now()),
        submitter: proof.submitter || "",
        channelId: channel.id,
        proofId: proof.proofId || proof.key,
        sequenceNumber: proof.sequenceNumber,
        subNumber: proof.subNumber,
        key: proof.key,
      };
      return proofData;
    })
    .filter((proof) => {
      if (filter === "all") return true;
      if (filter === "pending") return proof.status === "pending";
      if (filter === "verified") return proof.status === "verified";
      if (filter === "rejected") return proof.status === "rejected";
      return true;
    });

  const stats = {
    total: proofs.length,
    verified: proofs.filter((p) => p.status === "verified").length,
    pending: proofs.filter((p) => p.status === "submitted").length,
    rejected: proofs.filter((p) => p.status === "rejected").length,
  };

  const channelStateLabel =
    ChannelState[channel.state as keyof typeof ChannelState] || "unknown";

  return (
    <div className="p-4 pb-20">
      <div className="max-w-7xl w-full mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] p-6 mb-4 shadow-lg shadow-[#4fc3f7]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#4fc3f7]/10 rounded transition-colors text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="bg-[#4fc3f7] p-2 rounded">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white font-mono">
                    Channel #{channel.id}
                  </h2>
                  {channel.isLeader && (
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded font-medium">
                      LEADER
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      channelStateLabel === "active"
                        ? "bg-green-500/20 text-green-400"
                        : channelStateLabel === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {channelStateLabel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBundleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-all hover:shadow-lg hover:shadow-green-500/30 font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Transaction
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {channel.participantCount} participants
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Public Key: {channel.hasPublicKey ? "Set" : "Not set"}
            </span>
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4" />
              Target: {channel.targetAddress.slice(0, 6)}...
              {channel.targetAddress.slice(-4)}
            </span>
          </div>
        </div>

        {/* Participant Balances Section */}
        <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] shadow-lg shadow-[#4fc3f7]/20 mb-4 overflow-hidden">
          <button
            onClick={() => setIsBalancesExpanded(!isBalancesExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#4fc3f7]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#4fc3f7] p-1.5 rounded">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-white">
                  Participant Balances
                </h3>
                <p className="text-xs text-gray-400">
                  {channel.participantCount} participants
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isLoadingBalances ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span className="text-gray-400 text-xs">
                  Total:{" "}
                  <span className="text-white font-medium">
                    {participantBalances
                      .reduce(
                        (sum, p) => sum + parseFloat(p.currentBalance || "0"),
                        0
                      )
                      .toFixed(2)}{" "}
                    {symbol}
                  </span>
                </span>
              )}
              {isBalancesExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#4fc3f7]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#4fc3f7]" />
              )}
            </div>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out ${
              isBalancesExpanded
                ? "max-h-[600px] opacity-100"
                : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            <div className="px-4 pb-4 space-y-6">
              {/* Initial Deposits */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#4fc3f7] rounded-full" />
                    Initial Deposits
                  </h4>
                  {initialMerkleRoot !== "N/A" && (
                    <div className="flex items-center gap-2 bg-[#0a1930]/70 border border-[#4fc3f7]/20 px-3 py-1 rounded">
                      <Hash className="w-3 h-3 text-[#4fc3f7]" />
                      <span className="text-[10px] text-gray-400">
                        Initial Root:
                      </span>
                      <span className="font-mono text-[10px] text-[#4fc3f7]">
                        {initialMerkleRoot.slice(0, 8)}...
                        {initialMerkleRoot.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
                {isLoadingBalances ? (
                  <div className="text-center py-4">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#4fc3f7] mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {participantBalances.map((participant, index) => (
                      <div
                        key={participant.address}
                        className={`bg-[#0a1930]/50 border p-3 hover:border-[#4fc3f7]/50 transition-all rounded ${
                          participant.address.toLowerCase() ===
                          userAddress?.toLowerCase()
                            ? "border-[#4fc3f7]/50 bg-[#4fc3f7]/5"
                            : "border-[#4fc3f7]/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-[#4fc3f7] px-1.5 py-0.5 rounded text-white font-bold text-[10px]">
                            #{index + 1}
                          </span>
                          <span className="font-mono text-xs text-[#4fc3f7] truncate flex-1">
                            {participant.address.slice(0, 6)}...
                            {participant.address.slice(-4)}
                          </span>
                          {participant.address.toLowerCase() ===
                            userAddress?.toLowerCase() && (
                            <span className="text-[9px] text-[#4fc3f7] bg-[#4fc3f7]/20 px-1 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-[#1a2347]/50 px-2 py-1 rounded text-xs">
                          <Coins className="w-3 h-3 text-[#4fc3f7]" />
                          <span className="font-medium text-white">
                            {parseFloat(participant.initialDeposit).toFixed(2)}
                          </span>
                          <span className="text-gray-400">
                            {participant.symbol}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Balances */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-1 bg-green-500 rounded-full" />
                    Current State Balances
                  </h4>
                  {currentMerkleRoot !== "N/A" && (
                    <div className="flex items-center gap-2 bg-[#0a1930]/70 border border-green-500/20 px-3 py-1 rounded">
                      <Hash className="w-3 h-3 text-green-400" />
                      <span className="text-[10px] text-gray-400">
                        Current Root:
                      </span>
                      <span className="font-mono text-[10px] text-green-400">
                        {currentMerkleRoot.slice(0, 8)}...
                        {currentMerkleRoot.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>
                {isLoadingBalances ? (
                  <div className="text-center py-4">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#4fc3f7] mx-auto" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {participantBalances.map((participant, index) => (
                      <div
                        key={participant.address}
                        className={`bg-[#0a1930]/50 border p-3 hover:border-green-500/50 transition-all rounded ${
                          participant.address.toLowerCase() ===
                          userAddress?.toLowerCase()
                            ? "border-green-500/50 bg-green-500/5"
                            : "border-green-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-500 px-1.5 py-0.5 rounded text-white font-bold text-[10px]">
                            #{index + 1}
                          </span>
                          <span className="font-mono text-xs text-green-400 truncate flex-1">
                            {participant.address.slice(0, 6)}...
                            {participant.address.slice(-4)}
                          </span>
                          {participant.address.toLowerCase() ===
                            userAddress?.toLowerCase() && (
                            <span className="text-[9px] text-green-400 bg-green-500/20 px-1 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-[#1a2347]/50 px-2 py-1 rounded text-xs">
                          <Coins className="w-3 h-3 text-green-400" />
                          <span className="font-medium text-white">
                            {parseFloat(participant.currentBalance).toFixed(2)}
                          </span>
                          <span className="text-gray-400">
                            {participant.symbol}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] p-6 shadow-lg shadow-[#4fc3f7]/20 mb-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Total Proofs
                </span>
                <div className="bg-[#4fc3f7] p-2 rounded">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
            </div>

            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Verified
                </span>
                <div className="bg-green-500 p-2 rounded">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {stats.verified}
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Pending
                </span>
                <div className="bg-yellow-500 p-2 rounded">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {stats.pending}
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Rejected
                </span>
                <div className="bg-red-500 p-2 rounded">
                  <XCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-400">
                {stats.rejected}
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center justify-between">
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as typeof filter)
              }
              className="w-48 bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 text-white px-4 py-2 rounded"
            >
              <option value="all">All Proofs</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={fetchChannelData}
              disabled={isLoadingProofs}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4fc3f7] to-[#2196f3] text-white rounded-lg hover:from-[#2196f3] hover:to-[#1976d2] transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingProofs ? "animate-spin" : ""}`}
              />
              <span>
                {isLoadingProofs ? "Refreshing..." : "Refresh Proofs"}
              </span>
            </button>
          </div>

          {/* State Transition Timeline */}
          {stateTransitions.length > 0 && (
            <div className="mb-6 bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/50 shadow-lg overflow-hidden">
              <button
                onClick={() =>
                  setIsTransitionsExpanded(!isTransitionsExpanded)
                }
                className="w-full flex items-center justify-between p-4 hover:bg-[#4fc3f7]/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#4fc3f7] p-1.5 rounded">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-white">
                      State Transition History
                    </h3>
                    <p className="text-xs text-gray-400">
                      {stateTransitions.length} state
                      {stateTransitions.length > 1 ? "s" : ""} recorded
                    </p>
                  </div>
                </div>
                {isTransitionsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#4fc3f7]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#4fc3f7]" />
                )}
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  isTransitionsExpanded
                    ? "max-h-[600px] opacity-100 overflow-y-auto"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <div className="px-4 pb-4">
                  {isLoadingTransitions ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#4fc3f7] mx-auto" />
                      <p className="text-gray-400 text-sm mt-4">
                        Loading state history...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stateTransitions.map((transition) => (
                        <div
                          key={transition.proofId}
                          className="bg-[#0a1930]/50 border border-[#4fc3f7]/30 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#4fc3f7]/20 px-3 py-1 rounded">
                                <span className="text-[#4fc3f7] font-bold text-sm">
                                  #{transition.sequenceNumber}
                                </span>
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {transition.proofId}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {new Date(
                                    transition.timestamp
                                  ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-400 text-xs">
                                Submitter
                              </div>
                              <div className="text-white font-mono text-xs">
                                {transition.submitter.slice(0, 6)}...
                                {transition.submitter.slice(-4)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#1a2347]/50 rounded">
                            <div>
                              <div className="text-gray-400 text-[10px] mb-1 flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                Initial Root
                              </div>
                              <div className="text-[#4fc3f7] font-mono text-[10px]">
                                {transition.merkleRoots.initial.slice(0, 10)}
                                ...
                                {transition.merkleRoots.initial.slice(-8)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-[10px] mb-1 flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                Resulting Root
                              </div>
                              <div className="text-green-400 font-mono text-[10px]">
                                {transition.merkleRoots.resulting.slice(0, 10)}
                                ...
                                {transition.merkleRoots.resulting.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pending Proofs Approval Section (Leader Only) */}
          {isLeader &&
            filteredProofs.filter((p) => p.status === "pending").length > 0 && (
              <div className="mb-6 bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-amber-500/50 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Pending Proofs Approval
                  </h3>
                  <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded font-medium">
                    LEADER ACTION REQUIRED
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Select one proof to approve. All other proofs in the same
                  sequence will be automatically rejected.
                </p>

                <div className="space-y-3 mb-4">
                  {filteredProofs
                    .filter((p) => p.status === "pending")
                    .map((proof) => (
                      <label
                        key={proof.key || proof.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedProofForApproval === proof.key
                            ? "bg-amber-500/10 border-amber-500/50"
                            : "bg-[#0a1930]/50 border-[#4fc3f7]/30 hover:border-amber-500/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="proofApproval"
                          value={proof.key as string}
                          checked={selectedProofForApproval === proof.key}
                          onChange={(e) =>
                            setSelectedProofForApproval(e.target.value)
                          }
                          className="w-4 h-4 text-amber-500 focus:ring-amber-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">
                              {proof.proofId || proof.id || proof.key}
                            </span>
                            <span className="text-xs text-gray-400">
                              Sequence #{proof.sequenceNumber}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Submitted: </span>
                              <span className="text-white">
                                {proof.timestamp
                                  ? new Date(proof.timestamp).toLocaleString()
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Submitter: </span>
                              <span className="text-white font-mono text-xs">
                                {proof.submitter
                                  ? `${proof.submitter.slice(
                                      0,
                                      6
                                    )}...${proof.submitter.slice(-4)}`
                                  : "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                </div>

                <button
                  onClick={async () => {
                    if (!selectedProofForApproval) return;
                    const proofToApprove = filteredProofs.find(
                      (p) => p.key === selectedProofForApproval
                    );
                    if (proofToApprove) {
                      await handleVerifyProof(proofToApprove);
                      setSelectedProofForApproval(null);
                    }
                  }}
                  disabled={!selectedProofForApproval || isVerifying !== null}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Approve Selected Proof
                    </>
                  )}
                </button>
              </div>
            )}

          {/* Proofs List */}
          {isLoadingProofs ? (
            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/50 p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#4fc3f7] mx-auto mb-4" />
              <p className="text-gray-400">Loading proofs...</p>
            </div>
          ) : filteredProofs.length === 0 ? (
            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/50 p-12 text-center">
              <Activity className="h-12 w-12 text-[#4fc3f7] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {proofs.length === 0
                  ? "No Proofs Submitted"
                  : "No Proofs Match Filter"}
              </h3>
              <p className="text-gray-400">
                {proofs.length === 0
                  ? "This channel has been initialized but no proofs have been submitted yet."
                  : "No proofs match the selected filter"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProofs.map((proof) => (
                <ProofCard
                  key={proof.key || proof.id}
                  proof={proof}
                  isLeader={isLeader}
                  onVerify={handleVerifyProof}
                  isVerifying={isVerifying === proof.key}
                  onDelete={handleDeleteProof}
                  isDeleting={isDeletingProof === proof.key}
                  userAddress={userAddress}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction Bundle Modal */}
      <TransactionBundleModal
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
        defaultChannelId={channel.id.toString()}
      />
    </div>
  );
}

// Main Page Component
function StateExplorerPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState<OnChainChannel | null>(
    null
  );
  const networkId = useNetworkId();
  const bridgeCoreAddress = getContractAddress("BridgeCore", networkId);
  const bridgeCoreAbi = getContractAbi("BridgeCore");

  const [channels, setChannels] = useState<OnChainChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's channels from blockchain
  const fetchChannels = async (forceRefresh = false) => {
    if (!address || !publicClient) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get total channels count
      const totalChannels = (await publicClient.readContract({
        address: bridgeCoreAddress,
        abi: bridgeCoreAbi,
        functionName: "getTotalChannels",
      })) as bigint;

      const totalChannelsCount = Number(totalChannels);
      const userChannels: OnChainChannel[] = [];

      // Check each channel (channel IDs start from 1)
      for (let i = 1; i <= totalChannelsCount; i++) {
        try {
          // Get leader
          const leader = (await publicClient.readContract({
            address: bridgeCoreAddress,
            abi: bridgeCoreAbi,
            functionName: "getChannelLeader",
            args: [BigInt(i)],
          })) as string;

          if (
            !leader ||
            leader === "0x0000000000000000000000000000000000000000"
          ) {
            continue;
          }

          // Get participants
          const participants = (await publicClient.readContract({
            address: bridgeCoreAddress,
            abi: bridgeCoreAbi,
            functionName: "getChannelParticipants",
            args: [BigInt(i)],
          })) as string[];

          const isParticipant = participants.some(
            (p) => p.toLowerCase() === address.toLowerCase()
          );
          const isLeader = leader.toLowerCase() === address.toLowerCase();

          // Get channel info
          const [channelInfo, publicKey, targetAddress] = await Promise.all([
            publicClient.readContract({
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getChannelInfo",
              args: [BigInt(i)],
            }) as Promise<
              readonly [`0x${string}`, number, bigint, `0x${string}`]
            >,
            publicClient.readContract({
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getChannelPublicKey",
              args: [BigInt(i)],
            }) as Promise<[bigint, bigint]>,
            publicClient.readContract({
              address: bridgeCoreAddress,
              abi: bridgeCoreAbi,
              functionName: "getChannelTargetContract",
              args: [BigInt(i)],
            }) as Promise<string>,
          ]);

          const state = channelInfo[1];
          const participantCount = Number(channelInfo[2]);

          userChannels.push({
            id: i,
            state: state,
            participantCount: participantCount,
            participants: participants,
            leader: leader,
            isLeader: isLeader,
            targetAddress: targetAddress,
            hasPublicKey:
              publicKey[0] !== BigInt(0) || publicKey[1] !== BigInt(0),
          });
        } catch (err) {
          console.warn(`Error fetching channel ${i}:`, err);
        }
      }

      setChannels(userChannels);
    } catch (err) {
      console.error("Failed to fetch channels:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch channels");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address && publicClient) {
      fetchChannels(false);
    } else if (!isConnected) {
      setChannels([]);
      setIsLoading(false);
    }
  }, [isConnected, address, publicClient]);

  // Auto-select channel from URL
  useEffect(() => {
    const channelIdParam = searchParams.get("channelId");
    if (channelIdParam && channels.length > 0 && !selectedChannel) {
      const channelIdNum = parseInt(channelIdParam, 10);
      const channel = channels.find((c) => c.id === channelIdNum);
      if (channel) {
        setSelectedChannel(channel);
      }
    }
  }, [searchParams, channels, selectedChannel]);

  const handleSelectChannel = (channel: OnChainChannel) => {
    setSelectedChannel(channel);
  };

  const handleBack = () => {
    setSelectedChannel(null);
    router.push("/state-explorer");
  };

  return (
    <>
      {selectedChannel ? (
        <StateExplorerDetailView
          channel={selectedChannel}
          onBack={handleBack}
          userAddress={address || ""}
        />
      ) : (
        <ChannelSelectionView
          channels={channels}
          onSelectChannel={handleSelectChannel}
          isLoading={isLoading}
          onRefresh={() => fetchChannels(true)}
          error={error}
        />
      )}
    </>
  );
}

// Wrapper with Suspense boundary
export default function StateExplorerPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StateExplorerPage />
    </Suspense>
  );
}
