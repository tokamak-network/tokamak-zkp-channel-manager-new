/**
 * Mock Wallet Provider for E2E Testing
 *
 * Injects a mock Ethereum provider that automatically signs transactions.
 * This allows Playwright to test Web3 dApps without manual wallet interaction.
 */

import { type Page } from "@playwright/test";
import { TEST_ACCOUNTS } from "./test-accounts";

/**
 * Creates a mock Ethereum provider script to inject into the page
 */
function createMockProviderScript(
  privateKey: string,
  address: string,
  rpcUrl: string
): string {
  return `
    (function() {
      // Store the private key and address
      const PRIVATE_KEY = '${privateKey}';
      const ADDRESS = '${address}';
      const RPC_URL = '${rpcUrl}';
      
      // Simple signing utilities (using browser's built-in crypto)
      async function signMessage(message, privateKey) {
        // For E2E testing, we'll make actual RPC calls
        // The signing happens server-side via Anvil
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_sign',
            params: [ADDRESS, message],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      async function sendTransaction(tx) {
        // Ensure from is set
        tx.from = ADDRESS;
        
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_sendTransaction',
            params: [tx],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message);
        }
        return data.result;
      }
      
      async function call(tx, block) {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [tx, block || 'latest'],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      async function getChainId() {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      async function getBlockNumber() {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      async function getBalance(address, block) {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, block || 'latest'],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      async function estimateGas(tx) {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_estimateGas',
            params: [tx],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      async function getTransactionReceipt(txHash) {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [txHash],
            id: Date.now(),
          }),
        });
        const data = await response.json();
        return data.result;
      }
      
      // Create mock provider
      const mockProvider = {
        isMetaMask: true,
        _metamask: {
          isUnlocked: () => Promise.resolve(true),
        },
        selectedAddress: ADDRESS,
        chainId: '0xaa36a7', // Sepolia chain ID
        networkVersion: '11155111',
        
        request: async function({ method, params }) {
          console.log('[MockWallet] request:', method, params);
          
          switch (method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
              return [ADDRESS];
              
            case 'eth_chainId':
              return await getChainId();
              
            case 'net_version':
              return '11155111';
              
            case 'eth_blockNumber':
              return await getBlockNumber();
              
            case 'eth_getBalance':
              return await getBalance(params[0], params[1]);
              
            case 'eth_call':
              return await call(params[0], params[1]);
              
            case 'eth_estimateGas':
              return await estimateGas(params[0]);
              
            case 'eth_sendTransaction':
              return await sendTransaction(params[0]);
              
            case 'eth_getTransactionReceipt':
              return await getTransactionReceipt(params[0]);
              
            case 'personal_sign':
              return await signMessage(params[0], PRIVATE_KEY);
              
            case 'eth_signTypedData_v4':
              // For typed data signing, use personal_sign as fallback
              return await signMessage(params[1], PRIVATE_KEY);
              
            case 'wallet_switchEthereumChain':
              // Accept any chain switch request
              return null;
              
            case 'wallet_addEthereumChain':
              // Accept any chain add request
              return null;
              
            default:
              // Forward unknown methods to RPC
              const response = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: method,
                  params: params || [],
                  id: Date.now(),
                }),
              });
              const data = await response.json();
              if (data.error) {
                throw new Error(data.error.message);
              }
              return data.result;
          }
        },
        
        on: function(event, callback) {
          console.log('[MockWallet] on:', event);
          if (event === 'accountsChanged') {
            callback([ADDRESS]);
          }
          if (event === 'chainChanged') {
            callback('0xaa36a7');
          }
          return this;
        },
        
        removeListener: function() {
          return this;
        },
        
        removeAllListeners: function() {
          return this;
        },
      };
      
      // Inject the mock provider
      window.ethereum = mockProvider;
      
      console.log('[MockWallet] Injected mock wallet for address:', ADDRESS);
    })();
  `;
}

/**
 * Injects a mock wallet into the page for testing
 *
 * @param page - Playwright page instance
 * @param account - Which test account to use ('leader' or 'participant')
 * @param rpcUrl - Anvil RPC URL (default: http://localhost:8545)
 */
export async function injectMockWallet(
  page: Page,
  account: "leader" | "participant" = "leader",
  rpcUrl: string = "http://localhost:8545"
): Promise<void> {
  const testAccount = TEST_ACCOUNTS[account];

  // Add init script that runs before any page script
  await page.addInitScript(
    createMockProviderScript(
      testAccount.privateKey,
      testAccount.address,
      rpcUrl
    )
  );
}

/**
 * Gets the current account address being used
 */
export function getTestAccountAddress(
  account: "leader" | "participant"
): `0x${string}` {
  return TEST_ACCOUNTS[account].address;
}
