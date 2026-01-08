'use client';

import { useState, useCallback } from 'react';

/**
 * useWallet - 지갑 연결 훅
 * 
 * TODO: 실제 구현 시
 * - wagmi 사용
 * - 다중 지갑 지원
 * - 네트워크 전환
 */

interface UseWalletReturn {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // TODO: 실제 지갑 연결 로직
      // const accounts = await window.ethereum?.request({ method: 'eth_requestAccounts' });
      // setAddress(accounts[0]);
      
      // Mock
      await new Promise((r) => setTimeout(r, 1000));
      setAddress('0x1234...5678');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return {
    address,
    isConnected: !!address,
    isConnecting,
    connect,
    disconnect,
  };
}

