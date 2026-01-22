/**
 * useConnectedAccounts Hook
 *
 * Provides access to all accounts exposed by the connected wallet,
 * with functionality to switch between accounts and request additional account access.
 *
 * Features:
 * - List all accounts the wallet has exposed to the dApp
 * - Track currently active account
 * - Request wallet to expose additional accounts (wallet_requestPermissions)
 * - Refresh accounts list after permission changes
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useConnect,
  useConnectorClient,
} from "wagmi";
import type { Address } from "viem";

export interface ConnectedAccount {
  address: Address;
  isActive: boolean;
  label?: string;
}

interface UseConnectedAccountsReturn {
  /** All accounts exposed by the wallet */
  accounts: ConnectedAccount[];
  /** Currently active account address */
  activeAddress: Address | undefined;
  /** Whether the hook is loading accounts */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh the accounts list from the wallet */
  refreshAccounts: () => Promise<void>;
  /** Request wallet to expose additional accounts */
  requestMoreAccounts: () => Promise<void>;
  /** Whether requesting more accounts is in progress */
  isRequestingAccounts: boolean;
}

export function useConnectedAccounts(): UseConnectedAccountsReturn {
  const { address: activeAddress, isConnected, connector } = useAccount();
  const { connectors } = useConnect();
  const { data: connectorClient } = useConnectorClient();

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingAccounts, setIsRequestingAccounts] = useState(false);

  // Fetch all accounts from the connected wallet
  const refreshAccounts = useCallback(async () => {
    if (!isConnected || !connector) {
      setAccounts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get all accounts from the connector
      let walletAccounts: readonly Address[] = [];

      // Try to get accounts from the connector
      if (connector.getAccounts) {
        walletAccounts = await connector.getAccounts();
      } else if (connectorClient) {
        // Fallback: try to get accounts via eth_accounts
        try {
          const result = await connectorClient.request({
            method: "eth_accounts",
          });
          walletAccounts = result as Address[];
        } catch {
          // If eth_accounts fails, use the current address
          if (activeAddress) {
            walletAccounts = [activeAddress];
          }
        }
      } else if (activeAddress) {
        // Last fallback: just use the current address
        walletAccounts = [activeAddress];
      }

      // Map to ConnectedAccount format
      const mappedAccounts: ConnectedAccount[] = walletAccounts.map((addr) => ({
        address: addr,
        isActive: addr.toLowerCase() === activeAddress?.toLowerCase(),
      }));

      setAccounts(mappedAccounts);
    } catch (err) {
      console.error("[useConnectedAccounts] Error fetching accounts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch accounts");

      // Fallback to current address
      if (activeAddress) {
        setAccounts([{ address: activeAddress, isActive: true }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, connector, connectorClient, activeAddress]);

  // Request wallet to expose additional accounts
  const requestMoreAccounts = useCallback(async () => {
    if (!isConnected || !connectorClient) {
      setError("Wallet not connected");
      return;
    }

    setIsRequestingAccounts(true);
    setError(null);

    try {
      // Request permission to access accounts
      // This will open the wallet's account selection UI
      await connectorClient.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // After permission is granted, refresh the accounts list
      await refreshAccounts();
    } catch (err) {
      console.error("[useConnectedAccounts] Error requesting accounts:", err);

      // Handle user rejection gracefully
      if (
        err instanceof Error &&
        (err.message.includes("rejected") || err.message.includes("denied"))
      ) {
        setError("Request was rejected by user");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to request accounts"
        );
      }
    } finally {
      setIsRequestingAccounts(false);
    }
  }, [isConnected, connectorClient, refreshAccounts]);

  // Fetch accounts when connection state changes
  useEffect(() => {
    if (isConnected) {
      refreshAccounts();
    } else {
      setAccounts([]);
      setError(null);
    }
  }, [isConnected, refreshAccounts]);

  // Update active status when activeAddress changes
  useEffect(() => {
    if (activeAddress && accounts.length > 0) {
      setAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          isActive: acc.address.toLowerCase() === activeAddress.toLowerCase(),
        }))
      );
    }
  }, [activeAddress]);

  return {
    accounts,
    activeAddress,
    isLoading,
    error,
    refreshAccounts,
    requestMoreAccounts,
    isRequestingAccounts,
  };
}
