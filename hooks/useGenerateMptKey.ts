/**
 * Custom Hook: Generate MPT Key and L2 Address
 *
 * Handles MPT key and L2 address generation using wallet signature (client-side)
 * This is a common hook that can be used across the application.
 */

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { deriveL2KeysAndAddressFromSignature } from "@/lib/tokamakl2js";

export interface L2AccountInfo {
  l2Address: `0x${string}`;
  mptKey: `0x${string}`;
  privateKey: `0x${string}`;
  publicKey: `0x${string}`;
}

interface UseGenerateMptKeyParams {
  /**
   * Channel ID (bytes32 string). If not provided, will not generate.
   */
  channelId?: string | null;
  /**
   * Slot index for MPT key derivation. Defaults to 0.
   */
  slotIndex?: number;
  /**
   * Optional callback to store MPT key (e.g., in Zustand store)
   */
  onMptKeyGenerated?: (mptKey: `0x${string}`) => void;
}

interface UseGenerateMptKeyReturn {
  /**
   * Generate MPT key and L2 address from wallet signature
   */
  generate: () => Promise<L2AccountInfo | null>;
  /**
   * Whether generation is in progress
   */
  isGenerating: boolean;
  /**
   * Error message if generation failed
   */
  error: string | null;
  /**
   * Last generated L2 account info
   */
  accountInfo: L2AccountInfo | null;
}

/**
 * Hook to generate MPT key and L2 address from wallet signature
 *
 * @param params - Configuration parameters
 * @returns Object with generate function, loading state, error, and account info
 */
export function useGenerateMptKey(
  params: UseGenerateMptKeyParams = {}
): UseGenerateMptKeyReturn {
  const { channelId, slotIndex = 0, onMptKeyGenerated } = params;
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<L2AccountInfo | null>(null);

  const generate = useCallback(async (): Promise<L2AccountInfo | null> => {
    console.log("🚀 useGenerateMptKey.generate called (client-side)", {
      isConnected,
      address,
      channelId: channelId?.toString(),
      signMessageAsync: !!signMessageAsync,
      slotIndex,
    });

    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      console.error("❌ Wallet not connected");
      return null;
    }

    if (!channelId) {
      setError("Please provide a channel ID");
      console.error("❌ Channel ID not provided");
      return null;
    }

    if (!signMessageAsync) {
      setError("Wallet signing not available. Please reconnect your wallet.");
      console.error("❌ signMessageAsync not available");
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const message = L2_PRV_KEY_MESSAGE + channelId.toString();
      console.log("📝 Signing message:", message);

      const signature = await signMessageAsync({ message });
      console.log("✅ Signature received:", signature);

      // Generate MPT key and L2 address directly in browser (client-side)
      console.log("🔑 Generating MPT key and L2 address in browser...");
      const accountL2 = deriveL2KeysAndAddressFromSignature(
        signature,
        slotIndex
      );
      console.log("✅ Account info generated:", accountL2);

      const info: L2AccountInfo = {
        l2Address: accountL2.l2Address,
        mptKey: accountL2.mptKey,
        privateKey: accountL2.privateKey,
        publicKey: accountL2.publicKey,
      };

      setAccountInfo(info);

      // Call optional callback to store MPT key
      if (onMptKeyGenerated) {
        onMptKeyGenerated(accountL2.mptKey);
      }

      setError(null);
      console.log("✨ Account info set successfully:", info);

      return info;
    } catch (err) {
      console.error("❌ Error generating MPT key:", err);
      if (err instanceof Error) {
        if (
          err.message.includes("User rejected") ||
          err.message.includes("rejected")
        ) {
          setError("Signature cancelled by user");
        } else if (
          err.message.includes("ConnectorNotFoundError") ||
          err.message.includes("Connector not found")
        ) {
          setError(
            "Wallet connection lost. Please disconnect and reconnect your wallet."
          );
        } else if (err.message.includes("ChainMismatchError")) {
          setError("Wrong network. Please switch to the correct network.");
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError("Failed to generate MPT key. Please try again.");
      }
      setAccountInfo(null);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [
    isConnected,
    address,
    channelId,
    signMessageAsync,
    slotIndex,
    onMptKeyGenerated,
  ]);

  return {
    generate,
    isGenerating,
    error,
    accountInfo,
  };
}
