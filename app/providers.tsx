/**
 * App Providers
 * 
 * Wraps the app with necessary providers (Wagmi, React Query, etc.)
 * 
 * E2E Testing Mode:
 * When NEXT_PUBLIC_E2E_TEST_MODE is set, automatically connects the mock wallet.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useConnect, useAccount } from 'wagmi';
import { wagmiConfig, isE2ETestMode } from '@/lib/wagmi/config';
import { useState, useEffect } from 'react';

/**
 * Check if running in E2E test mode (client-side)
 */
function useIsE2EMode(): boolean {
  const [isE2E, setIsE2E] = useState(false);
  
  useEffect(() => {
    // Check window flag set by mock-wallet.ts
    const e2eFlag = typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__ === true;
    const envFlag = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
    setIsE2E(e2eFlag || envFlag || isE2ETestMode);
  }, []);
  
  return isE2E;
}

/**
 * E2E Auto Connect Component
 * Automatically connects the mock wallet in E2E test mode
 */
function E2EAutoConnect({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const [hasAttemptedConnect, setHasAttemptedConnect] = useState(false);
  const isE2E = useIsE2EMode();
  
  useEffect(() => {
    // Only auto-connect in E2E mode and if not already connected
    if (isE2E && !isConnected && !hasAttemptedConnect) {
      setHasAttemptedConnect(true);
      
      console.log('[E2E] E2E mode detected, available connectors:', connectors.map(c => c.id));
      
      // Find the mock connector
      const mockConnector = connectors.find(c => c.id === 'mock' || c.name === 'Mock');
      
      if (mockConnector) {
        console.log('[E2E] Auto-connecting mock wallet...');
        connect({ connector: mockConnector });
      } else {
        // Fallback to injected connector (should have mock provider)
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (injectedConnector) {
          console.log('[E2E] Auto-connecting with injected connector...');
          connect({ connector: injectedConnector });
        } else if (connectors[0]) {
          console.log('[E2E] Auto-connecting with first available connector:', connectors[0].name);
          connect({ connector: connectors[0] });
        }
      }
    }
  }, [isE2E, isConnected, hasAttemptedConnect, connect, connectors]);
  
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Always render E2EAutoConnect - it will check for E2E mode internally
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <E2EAutoConnect>{children}</E2EAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
