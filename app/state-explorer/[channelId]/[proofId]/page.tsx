"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useReadContracts, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { AppLayout } from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  Hash,
  Calendar,
  Users,
  Coins,
  Download,
  Play,
  FileText,
} from "lucide-react";
import { getContractAddress, getContractAbi } from "@tokamak/config";
import { useNetworkId } from "@/hooks/contract/utils";
import { getData, getProofZipContent } from "@/lib/db-client";
import JSZip from "jszip";

// Participant Balance Type
interface ParticipantBalance {
  address: string;
  initialDeposit: string;
  currentBalance: string;
  symbol: string;
  decimals: number;
  hasChange?: boolean;
}

interface ProofData {
  proofId?: string;
  id?: string | number;
  status: "pending" | "verified" | "rejected";
  timestamp: number;
  submitter: string;
  channelId: number | string;
  sequenceNumber?: number;
  subNumber?: number;
  verifier?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  zipFile?: {
    path?: string;
    filePath?: string;
    size: number;
    fileName: string;
    content?: string;
  };
  key?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    badgeClass: "bg-yellow-500/20 border-yellow-500 text-yellow-400",
    description: "Awaiting leader verification",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle2,
    badgeClass: "bg-green-500/20 border-green-500 text-green-400",
    description: "Proof verified and accepted",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    badgeClass: "bg-red-500/20 border-red-500 text-red-400",
    description: "Proof rejected - invalid state",
  },
};

export default function ProofDetailPage() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.channelId as string;
  const proofId = params.proofId
    ? decodeURIComponent(params.proofId as string)
    : "";
  const { address } = useAccount();
  const networkId = useNetworkId();
  const bridgeCoreAddress = getContractAddress("BridgeCore", networkId);
  const bridgeCoreAbi = getContractAbi("BridgeCore");

  const channelIdBigInt = useMemo(() => {
    try {
      return BigInt(channelId);
    } catch {
      return null;
    }
  }, [channelId]);

  const [proof, setProof] = useState<ProofData | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [participantBalances, setParticipantBalances] = useState<
    ParticipantBalance[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState("TOKEN");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    verified: boolean;
    message: string;
    output?: string;
    error?: string;
  } | null>(null);
  const [zipContent, setZipContent] = useState<string | null>(null);
  const [isLoadingZip, setIsLoadingZip] = useState(false);

  const channelContracts = useMemo(() => {
    if (channelIdBigInt === null) return undefined;
    return [
      {
        address: bridgeCoreAddress,
        abi: bridgeCoreAbi,
        functionName: "getChannelInfo",
        args: [channelIdBigInt],
      },
      {
        address: bridgeCoreAddress,
        abi: bridgeCoreAbi,
        functionName: "getChannelParticipants",
        args: [channelIdBigInt],
      },
      {
        address: bridgeCoreAddress,
        abi: bridgeCoreAbi,
        functionName: "getChannelLeader",
        args: [channelIdBigInt],
      },
    ] as const;
  }, [channelIdBigInt, bridgeCoreAddress, bridgeCoreAbi]);

  const { data: channelReads } = useReadContracts({
    contracts: channelContracts,
    enabled: Boolean(channelContracts),
  });

  const channelInfo = channelReads?.[0]?.result as
    | readonly [`0x${string}`, number, bigint, `0x${string}`]
    | undefined;
  const channelParticipants = channelReads?.[1]?.result as
    | readonly `0x${string}`[]
    | undefined;
  const channelLeader = channelReads?.[2]?.result as `0x${string}` | undefined;

  const tokenAddress = channelInfo?.[0];
  const isEthToken = useMemo(() => {
    if (!tokenAddress) return false;
    return (
      tokenAddress === "0x0000000000000000000000000000000000000001" ||
      tokenAddress === "0x0000000000000000000000000000000000000000"
    );
  }, [tokenAddress]);

  const tokenContracts = useMemo(() => {
    if (!tokenAddress || isEthToken) return undefined;
    return [
      {
        address: tokenAddress as `0x${string}`,
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
      },
      {
        address: tokenAddress as `0x${string}`,
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
      },
    ] as const;
  }, [tokenAddress, isEthToken]);

  const { data: tokenData } = useReadContracts({
    contracts: tokenContracts,
    enabled: Boolean(tokenContracts),
  });

  const depositContracts = useMemo(() => {
    if (!channel || channel.participants.length === 0) return [];
    return channel.participants.map((participant: string) => ({
      address: bridgeCoreAddress,
      abi: bridgeCoreAbi,
      functionName: "getParticipantDeposit",
      args: [BigInt(channel.id), participant as `0x${string}`],
    }));
  }, [channel, bridgeCoreAddress, bridgeCoreAbi]);

  const { data: depositData } = useReadContracts({
    contracts: depositContracts,
    enabled: depositContracts.length > 0,
  });

  // Fetch proof data from database
  useEffect(() => {
    const fetchProof = async () => {
      if (!channelId || !proofId) {
        console.log("ProofDetailPage: Missing channelId or proofId", {
          channelId,
          proofId,
        });
        return;
      }

      console.log("ProofDetailPage: Fetching proof", { channelId, proofId });
      setIsLoading(true);
      try {
        const channelIdStr = String(channelId);

        // Try to find proof in submittedProofs, verifiedProofs, or rejectedProofs
        const [submittedProofs, verifiedProofs, rejectedProofs] =
          await Promise.all([
            getData<Record<string, any>>(
              `channels.${channelIdStr}.submittedProofs`
            ),
            getData<Record<string, any>>(
              `channels.${channelIdStr}.verifiedProofs`
            ),
            getData<Record<string, any>>(
              `channels.${channelIdStr}.rejectedProofs`
            ),
          ]);

        let foundProof: any = null;
        let proofStatus: "submittedProofs" | "verifiedProofs" | "rejectedProofs" =
          "submittedProofs";

        // Search in submittedProofs
        if (submittedProofs) {
          const submittedList = Object.entries(submittedProofs).map(
            ([key, value]: [string, any]) => ({ ...value, key })
          );
          foundProof = submittedList.find((p: any) => {
            const pProofId = String(p.proofId || "").toLowerCase();
            const pId = String(p.id || "").toLowerCase();
            const pKey = String(p.key || "").toLowerCase();
            const searchId = String(proofId || "").toLowerCase();
            return (
              pProofId === searchId || pId === searchId || pKey === searchId
            );
          });
          if (foundProof) {
            proofStatus = "submittedProofs";
          }
        }

        // Search in verifiedProofs
        if (!foundProof && verifiedProofs) {
          const verifiedList = Object.entries(verifiedProofs).map(
            ([key, value]: [string, any]) => ({ ...value, key })
          );
          foundProof = verifiedList.find((p: any) => {
            const pProofId = String(p.proofId || "").toLowerCase();
            const pId = String(p.id || "").toLowerCase();
            const pKey = String(p.key || "").toLowerCase();
            const searchId = String(proofId || "").toLowerCase();
            return (
              pProofId === searchId || pId === searchId || pKey === searchId
            );
          });
          if (foundProof) {
            proofStatus = "verifiedProofs";
          }
        }

        // Search in rejectedProofs
        if (!foundProof && rejectedProofs) {
          const rejectedList = Object.entries(rejectedProofs).map(
            ([key, value]: [string, any]) => ({ ...value, key })
          );
          foundProof = rejectedList.find((p: any) => {
            const pProofId = String(p.proofId || "").toLowerCase();
            const pId = String(p.id || "").toLowerCase();
            const pKey = String(p.key || "").toLowerCase();
            const searchId = String(proofId || "").toLowerCase();
            return (
              pProofId === searchId || pId === searchId || pKey === searchId
            );
          });
          if (foundProof) {
            proofStatus = "rejectedProofs";
          }
        }

        if (foundProof) {
          // Get zipFile data if it exists
          let zipFileData = foundProof.zipFile;

          // Get the storage key for the proof
          const storageProofId =
            foundProof.key ||
            (foundProof.proofId
              ? foundProof.proofId.replace(/#/g, "-")
              : null) ||
            (foundProof.id ? `proof-${foundProof.id}` : null);

          console.log("ProofDetailPage: Looking for ZIP file", {
            channelId,
            proofId,
            foundProofKey: foundProof.key,
            foundProofProofId: foundProof.proofId,
            storageProofId,
            proofStatus: foundProof.status,
          });

          if (storageProofId) {
            // Use getProofZipContent to fetch ZIP file content
            try {
              const result = await getProofZipContent(
                channelIdStr,
                storageProofId,
                proofStatus
              );

              if (result?.content) {
                console.log(
                  "ProofDetailPage: Found ZIP content, length:",
                  result.content.length
                );
                zipFileData = {
                  ...foundProof.zipFile,
                  size: result.size || foundProof.zipFile?.size || 0,
                  fileName:
                    result.fileName ||
                    foundProof.zipFile?.fileName ||
                    `proof-${foundProof.proofId || foundProof.id || "unknown"}.zip`,
                  content: result.content,
                };
              } else {
                console.warn(
                  "ProofDetailPage: getProofZipContent returned null or no content"
                );
              }
            } catch (error) {
              console.warn("ProofDetailPage: Failed to fetch ZIP content:", error);
            }
          }

          const proofData: ProofData = {
            ...foundProof,
            channelId: channelId,
            status:
              foundProof.status === "submitted"
                ? "pending"
                : (foundProof.status as ProofData["status"]) || "pending",
            timestamp:
              foundProof.timestamp ||
              foundProof.submittedAt ||
              Date.now(),
            verifier: foundProof.verifiedBy || foundProof.verifier,
            zipFile: zipFileData,
          };

          setProof(proofData);
        }
      } catch (error) {
        console.error("Error fetching proof:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProof();
  }, [channelId, proofId]);

  // Fetch ZIP content (handles both file-based and legacy formats)
  useEffect(() => {
    const loadZipContent = async () => {
      if (!proof || !channelId) return;

      // If we already have content in memory, use it
      if (proof.zipFile?.content) {
        setZipContent(proof.zipFile.content);
        return;
      }

      // If there's a filePath, fetch from API
      if (proof.zipFile?.filePath || proof.key) {
        setIsLoadingZip(true);
        try {
          const status =
            proof.status === "verified"
              ? "verifiedProofs"
              : proof.status === "rejected"
              ? "rejectedProofs"
              : "submittedProofs";

          const proofKey =
            proof.key || proof.proofId?.replace("#", "-") || "";
          const result = await getProofZipContent(
            String(channelId),
            proofKey,
            status
          );

          if (result?.content) {
            setZipContent(result.content);
          }
        } catch (error) {
          console.error("Failed to load ZIP content:", error);
        } finally {
          setIsLoadingZip(false);
        }
      }
    };

    loadZipContent();
  }, [proof, channelId]);

  // Fetch channel data and participants
  useEffect(() => {
    if (!channelInfo || !channelParticipants || !channelLeader) return;

    const state = channelInfo[1];
    const participantCount = Number(channelInfo[2]);

    setChannel({
      id: Number(channelId),
      targetAddress: channelInfo[0],
      state,
      participantCount,
      participants: channelParticipants.map((p) => p.toLowerCase()),
      leader: channelLeader.toLowerCase(),
    });
  }, [channelInfo, channelParticipants, channelLeader, channelId]);

  useEffect(() => {
    if (!tokenAddress) return;

    if (isEthToken) {
      setDecimals(18);
      setSymbol("ETH");
      return;
    }

    const tokenDecimals = tokenData?.[0]?.result;
    const tokenSymbol = tokenData?.[1]?.result;

    setDecimals(Number(tokenDecimals ?? 18));
    setSymbol(String(tokenSymbol ?? "TOKEN"));
  }, [tokenAddress, isEthToken, tokenData]);

  // Fetch participant balances
  useEffect(() => {
    if (!channel || channel.participants.length === 0) return;
    if (!depositData || depositData.length === 0) return;

    const balances: ParticipantBalance[] = channel.participants.map(
      (participant: string, idx: number) => {
        const initialDeposit =
          (depositData[idx]?.result as bigint | undefined) ?? BigInt(0);
        const initialDepositFormatted = formatUnits(initialDeposit, decimals);

        return {
          address: participant,
          initialDeposit: initialDepositFormatted,
          currentBalance: initialDepositFormatted, // Simplified - would need proof analysis for actual balance
          symbol,
          decimals,
        };
      }
    );

    setParticipantBalances(balances);
  }, [channel, depositData, decimals, symbol]);

  if (isLoading || !proof) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  const config = statusConfig[proof.status];
  const Icon = config.icon;
  const proofDisplayId = proof.proofId || `#${proof.id || proofId}`;

  return (
    <AppLayout>
      <div className="p-4 pb-20">
        <div className="max-w-6xl w-full mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/state-explorer?channelId=${channelId}`)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 text-white hover:border-[#4fc3f7] hover:bg-[#1a2347] rounded transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explorer
          </button>

          {/* Header Card */}
          <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] p-6 mb-6 shadow-lg shadow-[#4fc3f7]/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Proof {proofDisplayId}
                </h2>
                <p className="text-gray-400">{config.description}</p>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 border ${config.badgeClass} rounded font-medium w-fit`}
              >
                <Icon className="w-5 h-5" />
                {config.label}
              </div>
            </div>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Channel</span>
                <div className="bg-[#4fc3f7] p-2 rounded">
                  <Hash className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#4fc3f7]">
                #{channelId}
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Timestamp
                </span>
                <div className="bg-[#4fc3f7] p-2 rounded">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(proof.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">
                  Submitter
                </span>
                <div className="bg-[#4fc3f7] p-2 rounded">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-xs font-mono text-gray-400 break-all">
                {proof.submitter?.slice(0, 10)}...{proof.submitter?.slice(-8)}
              </div>
            </div>

            {proof.verifier && (
              <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Verifier
                  </span>
                  <div className="bg-green-500 p-2 rounded">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-xs font-mono text-gray-400 break-all">
                  {proof.verifier.slice(0, 10)}...{proof.verifier.slice(-8)}
                </div>
              </div>
            )}
          </div>

          {/* Participant Balances Section */}
          <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] p-6 mb-6 shadow-lg shadow-[#4fc3f7]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#4fc3f7] p-2 rounded">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Channel Participants & Token Balances
                </h3>
                <p className="text-sm text-gray-400">
                  Token balances for each participant
                </p>
              </div>
            </div>

            {participantBalances.length === 0 ? (
              <div className="text-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4">
                {participantBalances.map((participant, index) => (
                  <div
                    key={participant.address}
                    className="bg-[#0a1930]/50 border border-[#4fc3f7]/30 p-5 hover:border-[#4fc3f7] transition-all rounded"
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#4fc3f7]/20">
                      <div className="bg-[#4fc3f7] px-3 py-1 rounded text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">
                          Participant Address
                        </div>
                        <div className="font-mono text-sm text-[#4fc3f7]">
                          {participant.address}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#1a2347] border border-gray-600/30 p-4 rounded">
                        <div className="text-xs text-gray-500 mb-2">
                          Initial Deposit
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-400">
                            {participant.symbol}
                          </span>
                        </div>
                        <div className="text-xl font-mono text-gray-400">
                          {parseFloat(participant.initialDeposit).toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-[#1a2347] border border-[#4fc3f7]/30 p-4 rounded">
                        <div className="text-xs text-[#4fc3f7] mb-2">
                          Current Balance
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className="w-4 h-4 text-[#4fc3f7]" />
                          <span className="text-sm font-medium text-[#4fc3f7]">
                            {participant.symbol}
                          </span>
                        </div>
                        <div className="text-xl font-mono font-semibold text-white">
                          {parseFloat(participant.currentBalance).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification & Download Section */}
          <div className="bg-gradient-to-b from-[#1a2347] to-[#0a1930] border border-[#4fc3f7] p-6 shadow-lg shadow-[#4fc3f7]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#4fc3f7] p-2 rounded">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Verification & Files
                </h3>
                <p className="text-sm text-gray-400">
                  Download proof files and verify independently
                </p>
              </div>
            </div>

            {/* Verification Result */}
            {verifyResult && (
              <div
                className={`mb-4 p-4 rounded-lg border ${
                  verifyResult.verified
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {verifyResult.verified ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span
                    className={`font-medium ${
                      verifyResult.verified ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {verifyResult.message}
                  </span>
                </div>
                {verifyResult.error && (
                  <p className="text-sm text-red-300 mt-1">
                    {verifyResult.error}
                  </p>
                )}
                {verifyResult.output && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                      Show verification output
                    </summary>
                    <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-400 overflow-auto max-h-32">
                      {verifyResult.output}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Verify Button */}
              <button
                onClick={async () => {
                  if (!zipContent) {
                    window.alert(
                      "ZIP file not found. The proof must have a ZIP file with proof.json to verify."
                    );
                    return;
                  }

                  setIsVerifying(true);
                  setVerifyResult(null);

                  try {
                    const response = await fetch("/api/verify-proof-binary", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        proofZipBase64: zipContent,
                      }),
                    });

                    const result = await response.json();
                    setVerifyResult({
                      verified: result.verified,
                      message:
                        result.message ||
                        (result.verified
                          ? "Verification successful"
                          : "Verification failed"),
                      output: result.output,
                      error: result.error || result.details,
                    });
                  } catch (error) {
                    setVerifyResult({
                      verified: false,
                      message: "Verification failed",
                      error:
                        error instanceof Error
                          ? error.message
                          : "Unknown error occurred",
                    });
                  } finally {
                    setIsVerifying(false);
                  }
                }}
                disabled={isVerifying || isLoadingZip || !zipContent}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded transition-all font-medium ${
                  isVerifying || isLoadingZip || !zipContent
                    ? "bg-gray-600 cursor-not-allowed text-gray-300"
                    : "bg-green-600 hover:bg-green-500 text-white hover:shadow-lg hover:shadow-green-500/30"
                }`}
              >
                {isVerifying ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Verify Proof</span>
                  </>
                )}
              </button>

              {/* Download All Files (ZIP) */}
              <button
                onClick={async () => {
                  if (!zipContent) {
                    window.alert(
                      "ZIP file not found. The proof may not have a ZIP file uploaded."
                    );
                    return;
                  }

                  try {
                    // Convert base64 to bytes
                    const base64Content = zipContent;
                    const binaryString = atob(base64Content);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Parse the original ZIP
                    const originalZip = await JSZip.loadAsync(bytes);

                    // Create a new ZIP with organized structure
                    const newZip = new JSZip();
                    const proofFolderName = `channel-proof-${
                      proof.proofId || proof.id || "unknown"
                    }`;

                    // Extract files and put them directly in the proof folder
                    const files = Object.keys(originalZip.files);
                    for (const filePath of files) {
                      const file = originalZip.files[filePath];
                      if (!file.dir) {
                        const content = await file.async("uint8array");

                        // Extract just the filename
                        let fileName = filePath;
                        if (filePath.includes("/")) {
                          const parts = filePath.split("/");
                          for (let i = parts.length - 1; i >= 0; i--) {
                            if (parts[i] && parts[i].trim() !== "") {
                              fileName = parts[i];
                              break;
                            }
                          }
                        }

                        // Add file to the new ZIP under the proof folder
                        newZip.file(`${proofFolderName}/${fileName}`, content);
                      }
                    }

                    // Generate the new ZIP
                    const newZipBlob = await newZip.generateAsync({
                      type: "blob",
                    });

                    // Create download link
                    const url = URL.createObjectURL(newZipBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${proofFolderName}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error("Error downloading ZIP file:", error);
                    window.alert(
                      "Failed to download ZIP file. Please try again."
                    );
                  }
                }}
                disabled={!zipContent}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-[#4fc3f7] hover:bg-[#029bee] text-white rounded transition-all hover:shadow-lg hover:shadow-[#4fc3f7]/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>Download Files (ZIP)</span>
              </button>
            </div>

            {/* Info Text */}
            <div className="mt-6 p-4 bg-[#0a1930]/50 border border-[#4fc3f7]/30 rounded">
              <p className="text-sm text-gray-400">
                <span className="text-[#4fc3f7] font-semibold">Note:</span>{" "}
                Download includes both proof and state files in a ZIP archive.
                You can verify the computation independently using the
                verification tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
