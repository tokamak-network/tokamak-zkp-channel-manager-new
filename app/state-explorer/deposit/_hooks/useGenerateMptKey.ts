/**
 * Custom Hook: Generate MPT Key
 *
 * Handles MPT key generation using wallet signature (client-side)
 */

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useChannelFlowStore } from "@/stores/useChannelFlowStore";
import { useDepositStore } from "@/stores/useDepositStore";
import { L2_PRV_KEY_MESSAGE } from "@/lib/l2KeyMessage";
import { deriveL2KeysAndAddressFromSignature } from "@/lib/tokamakl2js";

export function useGenerateMptKey() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  // Use currentChannelId (bytes32 string) instead of channelId (bigint)
  const channelId = useChannelFlowStore((state) => state.currentChannelId);
  const setCurrentUserMPTKey = useDepositStore(
    (state) => state.setCurrentUserMPTKey
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const generateMPTKey = useCallback(async () => {
    console.log("🚀 generateMPTKey called (client-side)", {
      isConnected,
      address,
      channelId: channelId?.toString(),
      signMessageAsync: !!signMessageAsync,
      slotIndex: 0, // Fixed to 0
    });

    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      console.error("❌ Wallet not connected");
      return null;
    }

    if (!channelId) {
      setError("Please select a channel first");
      console.error("❌ Channel ID not set");
      return null;
    }

    if (!signMessageAsync) {
      setError("Wallet signing not available. Please reconnect your wallet.");
      console.error("❌ signMessageAsync not available");
      return null;
    }

    setIsGenerating(true);
    setError("");

    try {
      const message = L2_PRV_KEY_MESSAGE + channelId.toString();
      console.log("📝 Signing message:", message);

      const signature = await signMessageAsync({ message });
      console.log("✅ Signature received:", signature);

      // Generate MPT key directly in browser (client-side)
      console.log("🔑 Generating MPT key in browser...");
      const accountL2 = deriveL2KeysAndAddressFromSignature(
        signature,
        0 // Slot index fixed to 0
      );
      console.log("✅ MPT key generated:", accountL2);

      setCurrentUserMPTKey(accountL2.mptKey);
      setError("");
      console.log("✨ MPT Key set successfully:", accountL2.mptKey);

      return accountL2.mptKey;
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
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isConnected, address, channelId, signMessageAsync, setCurrentUserMPTKey]);

  return {
    generateMPTKey,
    isGenerating,
    error,
  };
}
