/**
 * Test for usePreviousStateSnapshot hook
 * 
 * Tests fetching initial channel state from on-chain data for channel ID 10.
 * Uses React Testing Library to test the hook in a React component context.
 * 
 * Run with: npm test -- test/hooks/usePreviousStateSnapshot.test.tsx
 */

import { renderHook, waitFor } from "@testing-library/react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePreviousStateSnapshot } from "@/components/_hooks/usePreviousStateSnapshot";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env file from test directory
function loadEnv() {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFile);
    const envPath = join(currentDir, "..", ".env");
    const envContent = readFileSync(envPath, "utf-8");
    const env: Record<string, string> = {};

    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          env[key.trim()] = value;
        }
      }
    });

    return env;
  } catch (error) {
    return {};
  }
}

const env = loadEnv();
const RPC_URL =
  env.RPC_URL ||
  process.env.RPC_URL ||
  (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : "https://rpc.sepolia.org");

// Create wagmi config for testing
const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(RPC_URL),
  },
});

// Create query client for React Query
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

// Wrapper component for testing hooks
function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

describe("usePreviousStateSnapshot", () => {
  const CHANNEL_ID = "10";

  it("should fetch snapshot for channel ID 10", async () => {
    const { result } = renderHook(
      () =>
        usePreviousStateSnapshot({
          channelId: CHANNEL_ID,
          bundleSnapshot: null,
        }),
      { wrapper }
    );

    // Initially should be loading or null
    expect(result.current.previousStateSnapshot).toBeNull();
    expect(result.current.error).toBeNull();

    // Trigger fetch
    await waitFor(
      async () => {
        const snapshot = await result.current.fetchSnapshot();
        expect(snapshot).not.toBeNull();
        expect(snapshot?.channelId).toBe(Number(CHANNEL_ID));
        expect(snapshot?.stateRoot).toBeDefined();
        expect(snapshot?.contractAddress).toBeDefined();
      },
      { timeout: 10000 }
    );

    // After fetch, snapshot should be available
    await waitFor(() => {
      expect(result.current.previousStateSnapshot).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    const snapshot = result.current.previousStateSnapshot;
    expect(snapshot).not.toBeNull();
    expect(snapshot?.channelId).toBe(Number(CHANNEL_ID));
    expect(snapshot?.stateRoot).toBeDefined();
    expect(snapshot?.contractAddress).toBeDefined();
    expect(snapshot?.registeredKeys).toBeDefined();
    expect(snapshot?.storageEntries).toBeDefined();
    expect(snapshot?.preAllocatedLeaves).toBeDefined();
  });

  it("should use bundleSnapshot if provided", async () => {
    const mockSnapshot = {
      channelId: 10,
      stateRoot: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      registeredKeys: ["0xkey1", "0xkey2"],
      storageEntries: [{ key: "0xkey1", value: "0xvalue1" }],
      contractAddress: "0xcontract",
      preAllocatedLeaves: [],
    };

    const { result } = renderHook(
      () =>
        usePreviousStateSnapshot({
          channelId: CHANNEL_ID,
          bundleSnapshot: mockSnapshot,
        }),
      { wrapper }
    );

    // Should immediately use bundleSnapshot
    expect(result.current.previousStateSnapshot).toEqual(mockSnapshot);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle null channelId", async () => {
    const { result } = renderHook(
      () =>
        usePreviousStateSnapshot({
          channelId: null,
          bundleSnapshot: null,
        }),
      { wrapper }
    );

    const snapshot = await result.current.fetchSnapshot();
    expect(snapshot).toBeNull();
    expect(result.current.previousStateSnapshot).toBeNull();
  });
});
