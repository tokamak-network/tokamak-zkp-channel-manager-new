/**
 * App Providers
 * 
 * E2E Testing: When __E2E_TEST_MODE__ is set, auto-connects injected wallet.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useConnect, useAccount } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi/config';
import { useState, useEffect } from 'react';

function E2EAutoConnect({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const [attempted, setAttempted] = useState(false);
  
  useEffect(() => {
    const isE2E = typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__;
    
    if (isE2E && !isConnected && !attempted) {
      setAttempted(true);
      const injected = connectors.find(c => c.id === 'injected');
      if (injected) {
        console.log('[E2E] Auto-connecting injected wallet...');
        connect({ connector: injected });
      }
    }
  }, [isConnected, attempted, connect, connectors]);
  
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false } },
  }));

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <E2EAutoConnect>{children}</E2EAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
