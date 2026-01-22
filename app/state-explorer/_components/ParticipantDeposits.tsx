/**
 * ParticipantDeposits Component
 *
 * Shows deposit status of all channel participants
 * Only visible to the channel leader
 * Can be collapsible
 */

"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useBridgeCoreRead } from "@/hooks/contract";
import { useChannelInfo } from "@/hooks/useChannelInfo";
import { formatUnits } from "viem";
import { formatAddress } from "@/lib/utils/format";
import { CheckCircle, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ParticipantDepositsProps {
  channelId: string | null;
  tokenSymbol?: string;
  tokenDecimals?: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showLeaderCheck?: boolean; // If false, shows for all users (e.g., in modal)
  compact?: boolean; // For modal display
}

interface ParticipantDepositInfo {
  address: `0x${string}`;
  deposit: bigint | null;
  mptKey: bigint | null;
  isLoading: boolean;
  hasRegistered: boolean; // True if MPT key is registered (deposited, even with 0 amount)
}

export function ParticipantDeposits({
  channelId,
  tokenSymbol = "TON",
  tokenDecimals = 18,
  collapsible = false,
  defaultExpanded = false,
  showLeaderCheck = true,
  compact = false,
}: ParticipantDepositsProps) {
  const { address } = useAccount();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Get channel info (includes participants)
  const channelInfo = useChannelInfo(
    channelId ? (channelId as `0x${string}`) : null
  );

  // Get channel leader
  const { data: channelLeader, isLoading: isLoadingLeader } = useBridgeCoreRead({
    functionName: "getChannelLeader",
    args: channelId ? [channelId as `0x${string}`] : undefined,
    query: {
      enabled: !!channelId,
    },
  });

  // Check if current user is leader
  const isLeader = useMemo(() => {
    if (!channelLeader || !address) return false;
    return String(channelLeader).toLowerCase() === String(address).toLowerCase();
  }, [channelLeader, address]);

  // Get participants list
  const participants = channelInfo?.participants || [];

  // Get deposit for each participant using individual hooks
  const participantDeposits = useParticipantDeposits(
    channelId,
    participants,
    tokenDecimals
  );

  // Don't render if no channel
  if (!channelId || isLoadingLeader) {
    return null;
  }

  // Check leader only if showLeaderCheck is true
  if (showLeaderCheck && !isLeader) {
    return null;
  }

  if (channelInfo.isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#999999]" />
        <span className="ml-2 text-[#999999]" style={{ fontSize: 14 }}>
          Loading participants...
        </span>
      </div>
    );
  }

  if (participants.length === 0) {
    return null;
  }

  // Calculate totals
  const totalDeposited = participantDeposits.reduce((sum, p) => {
    return sum + (p.deposit || BigInt(0));
  }, BigInt(0));

  // Count registered participants (those who have deposited, even 0 amount)
  const registeredCount = participantDeposits.filter(
    (p) => p.hasRegistered
  ).length;

  const handleToggle = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-2" : "gap-4"}`}>
      {/* Section Title */}
      <div
        className={`flex items-center justify-between ${collapsible ? "cursor-pointer" : ""}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <h3
            className="font-medium text-[#111111]"
            style={{ fontSize: compact ? 14 : 18, lineHeight: "1.3em" }}
          >
            Participant Deposits
          </h3>
          {collapsible && (
            isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#666666]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#666666]" />
            )
          )}
        </div>
        <span
          className="text-[#666666]"
          style={{ fontSize: compact ? 12 : 14 }}
        >
          {registeredCount} / {participants.length} registered
        </span>
      </div>

      {/* Content (collapsible) */}
      {(!collapsible || isExpanded) && (
        <>
          {/* No deposits message */}
          {registeredCount === 0 && (
            <div
              className={`flex items-center justify-center ${compact ? "py-4" : "py-6"} rounded`}
              style={{ backgroundColor: "#F8F8F8" }}
            >
              <span
                className="text-[#999999]"
                style={{ fontSize: compact ? 12 : 14 }}
              >
                No one has deposited yet
              </span>
            </div>
          )}

          {/* Participants List - only show when at least one has deposited */}
          {registeredCount > 0 && (
          <div
            className="flex flex-col gap-2"
            style={{
              maxHeight: compact ? 180 : 240,
              overflowY: "auto",
            }}
          >
            {participantDeposits.map((participant, index) => {
              const isCurrentUser = address?.toLowerCase() === participant.address.toLowerCase();

              return (
                <div
                  key={participant.address}
                  className={`flex items-center justify-between ${compact ? "p-2" : "p-3"} rounded ${
                    isCurrentUser ? "bg-[#E8F4FD]" : "bg-[#F8F8F8]"
                  }`}
                  style={{ border: isCurrentUser ? "1px solid #2A72E5" : "1px solid transparent" }}
                >
                  <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    {participant.isLoading ? (
                      <Loader2 className={`${compact ? "w-4 h-4" : "w-5 h-5"} animate-spin text-[#999999]`} />
                    ) : participant.hasRegistered ? (
                      <CheckCircle className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-[#3EB100]`} />
                    ) : (
                      <Clock className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-[#999999]`} />
                    )}

                    {/* Address */}
                    <div className="flex flex-col">
                      <span
                        className="text-[#111111]"
                        style={{ fontSize: compact ? 12 : 14, fontWeight: 500 }}
                      >
                        {formatAddress(participant.address)}
                        {isCurrentUser && (
                          <span className="ml-2 text-[#2A72E5]">(You)</span>
                        )}
                      </span>
                      {channelLeader && participant.address.toLowerCase() === String(channelLeader).toLowerCase() && (
                        <span
                          className="text-[#666666]"
                          style={{ fontSize: compact ? 10 : 12 }}
                        >
                          Leader
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deposit Amount */}
                  <div className="text-right">
                    {participant.isLoading ? (
                      <span className="text-[#999999]" style={{ fontSize: compact ? 12 : 14 }}>
                        Loading...
                      </span>
                    ) : participant.hasRegistered ? (
                      <span
                        className="text-[#111111]"
                        style={{ fontSize: compact ? 12 : 14, fontWeight: 500 }}
                      >
                        {parseFloat(formatUnits(participant.deposit || BigInt(0), tokenDecimals)).toFixed(2)} {tokenSymbol}
                      </span>
                    ) : (
                      <span
                        className="text-[#999999]"
                        style={{ fontSize: compact ? 12 : 14 }}
                      >
                        Not registered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Total - only show when at least one has deposited */}
          {registeredCount > 0 && (
            <div
              className={`flex items-center justify-between ${compact ? "p-2" : "p-3"} rounded`}
              style={{ backgroundColor: "#F2F2F2" }}
            >
              <span
                className="font-medium text-[#111111]"
                style={{ fontSize: compact ? 12 : 14 }}
              >
                Total Deposited
              </span>
              <span
                className="font-medium text-[#111111]"
                style={{ fontSize: compact ? 12 : 14 }}
              >
                {parseFloat(formatUnits(totalDeposited, tokenDecimals)).toFixed(2)} {tokenSymbol}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Custom hook to fetch deposits and MPT keys for multiple participants
function useParticipantDeposits(
  channelId: string | null,
  participants: `0x${string}`[],
  tokenDecimals: number
): ParticipantDepositInfo[] {
  // We need to call getParticipantDeposit and getL2MptKey for each participant
  // Using individual hooks for up to 8 participants
  
  // Deposits - refetch every 5 seconds to get latest on-chain data
  const deposit0 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[0] ? [channelId as `0x${string}`, participants[0]] : undefined,
    query: { enabled: !!channelId && !!participants[0], refetchInterval: 5000 },
  });
  const deposit1 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[1] ? [channelId as `0x${string}`, participants[1]] : undefined,
    query: { enabled: !!channelId && !!participants[1], refetchInterval: 5000 },
  });
  const deposit2 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[2] ? [channelId as `0x${string}`, participants[2]] : undefined,
    query: { enabled: !!channelId && !!participants[2], refetchInterval: 5000 },
  });
  const deposit3 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[3] ? [channelId as `0x${string}`, participants[3]] : undefined,
    query: { enabled: !!channelId && !!participants[3], refetchInterval: 5000 },
  });
  const deposit4 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[4] ? [channelId as `0x${string}`, participants[4]] : undefined,
    query: { enabled: !!channelId && !!participants[4], refetchInterval: 5000 },
  });
  const deposit5 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[5] ? [channelId as `0x${string}`, participants[5]] : undefined,
    query: { enabled: !!channelId && !!participants[5], refetchInterval: 5000 },
  });
  const deposit6 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[6] ? [channelId as `0x${string}`, participants[6]] : undefined,
    query: { enabled: !!channelId && !!participants[6], refetchInterval: 5000 },
  });
  const deposit7 = useBridgeCoreRead({
    functionName: "getParticipantDeposit",
    args: channelId && participants[7] ? [channelId as `0x${string}`, participants[7]] : undefined,
    query: { enabled: !!channelId && !!participants[7], refetchInterval: 5000 },
  });

  // MPT Keys (to check registration status) - refetch every 5 seconds
  const mptKey0 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[0] ? [channelId as `0x${string}`, participants[0]] : undefined,
    query: { enabled: !!channelId && !!participants[0], refetchInterval: 5000 },
  });
  const mptKey1 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[1] ? [channelId as `0x${string}`, participants[1]] : undefined,
    query: { enabled: !!channelId && !!participants[1], refetchInterval: 5000 },
  });
  const mptKey2 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[2] ? [channelId as `0x${string}`, participants[2]] : undefined,
    query: { enabled: !!channelId && !!participants[2], refetchInterval: 5000 },
  });
  const mptKey3 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[3] ? [channelId as `0x${string}`, participants[3]] : undefined,
    query: { enabled: !!channelId && !!participants[3], refetchInterval: 5000 },
  });
  const mptKey4 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[4] ? [channelId as `0x${string}`, participants[4]] : undefined,
    query: { enabled: !!channelId && !!participants[4], refetchInterval: 5000 },
  });
  const mptKey5 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[5] ? [channelId as `0x${string}`, participants[5]] : undefined,
    query: { enabled: !!channelId && !!participants[5], refetchInterval: 5000 },
  });
  const mptKey6 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[6] ? [channelId as `0x${string}`, participants[6]] : undefined,
    query: { enabled: !!channelId && !!participants[6], refetchInterval: 5000 },
  });
  const mptKey7 = useBridgeCoreRead({
    functionName: "getL2MptKey",
    args: channelId && participants[7] ? [channelId as `0x${string}`, participants[7]] : undefined,
    query: { enabled: !!channelId && !!participants[7], refetchInterval: 5000 },
  });

  const deposits = [deposit0, deposit1, deposit2, deposit3, deposit4, deposit5, deposit6, deposit7];
  const mptKeys = [mptKey0, mptKey1, mptKey2, mptKey3, mptKey4, mptKey5, mptKey6, mptKey7];

  return useMemo(() => {
    return participants.map((address, index) => {
      const depositResult = deposits[index];
      const mptKeyResult = mptKeys[index];
      
      const deposit = depositResult?.data !== undefined ? BigInt(String(depositResult.data)) : null;
      const mptKey = mptKeyResult?.data !== undefined ? BigInt(String(mptKeyResult.data)) : null;
      
      // hasRegistered is true if MPT key is non-zero (meaning they called deposit function)
      const hasRegistered = mptKey !== null && mptKey > BigInt(0);
      
      return {
        address,
        deposit,
        mptKey,
        isLoading: (depositResult?.isLoading ?? false) || (mptKeyResult?.isLoading ?? false),
        hasRegistered,
      };
    });
  }, [
    participants,
    ...deposits.map(d => d.data),
    ...deposits.map(d => d.isLoading),
    ...mptKeys.map(m => m.data),
    ...mptKeys.map(m => m.isLoading),
  ]);
}
