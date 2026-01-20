/**
 * Custom Hook: Token Approval
 *
 * Handles ERC20 token approval flow for deposit transactions
 */

import { useMemo, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ERC20_ABI } from "@/lib/erc20";
import { useDepositStore } from "@/stores";
import { isValidAmount, parseInputAmount } from "@/lib/utils/format";

interface UseTokenApprovalParams {
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  depositAmount: string;
}

/**
 * Hook for managing ERC20 token approval
 */
export function useTokenApproval({
  tokenAddress,
  spenderAddress,
  depositAmount,
}: UseTokenApprovalParams) {
  const { address } = useAccount();
  const { setNeedsApproval, setApproving } = useDepositStore();

  // Check ERC20 token allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: {
      enabled:
        !!address &&
        !!tokenAddress &&
        !!spenderAddress &&
        isValidAmount(depositAmount),
    },
  });

  // Calculate if approval is needed
  const needsApproval = useMemo(() => {
    if (!allowance || !isValidAmount(depositAmount)) return false;
    const amount = parseInputAmount(depositAmount);
    return amount > allowance;
  }, [allowance, depositAmount, isValidAmount, parseInputAmount]);

  // Update store when needsApproval changes
  useEffect(() => {
    setNeedsApproval(needsApproval);
  }, [needsApproval, setNeedsApproval]);

  // Prepare approve transaction
  const { writeContract: writeApprove, data: approveTxHash } =
    useWriteContract();
  const { isLoading: isApproving, isSuccess: approvalSuccess } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
    });

  // Update approving state
  useEffect(() => {
    setApproving(isApproving);
  }, [isApproving, setApproving]);

  // Handle approve
  const handleApprove = async () => {
    if (!tokenAddress || !spenderAddress || !isValidAmount(depositAmount))
      return;

    try {
      const amount = parseInputAmount(depositAmount);
      await writeApprove({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spenderAddress, amount],
      });
    } catch (error) {
      console.error("Error approving token:", error);
      throw error;
    }
  };

  return {
    allowance,
    needsApproval,
    isApproving,
    approvalSuccess,
    handleApprove,
    isValidAmount,
    parseInputAmount,
  };
}
