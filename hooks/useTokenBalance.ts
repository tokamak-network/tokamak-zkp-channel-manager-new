/**
 * Custom Hook: Token Balance
 *
 * Fetches ERC20 token balance for a given address
 */

import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { ERC20_ABI } from "@/lib/erc20";

interface UseTokenBalanceParams {
  tokenAddress: `0x${string}`;
}

/**
 * Hook for fetching ERC20 token balance
 */
export function useTokenBalance({ tokenAddress }: UseTokenBalanceParams) {
  const { address } = useAccount();

  const { data: balance, ...rest } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress,
    },
  });

  return {
    balance,
    ...rest,
  };
}
