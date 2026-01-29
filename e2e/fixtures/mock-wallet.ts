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
      
      // Event listeners storage
      const eventListeners = new Map();
      
      // Create mock provider
      const mockProvider = {
        isMetaMask: true,
        _metamask: {
          isUnlocked: () => Promise.resolve(true),
        },
        selectedAddress: ADDRESS,
        chainId: '0xaa36a7', // Sepolia chain ID
        networkVersion: '11155111',
        
        // Emit events
        emit: function(event, ...args) {
          const listeners = eventListeners.get(event) || [];
          listeners.forEach(listener => {
            try {
              listener(...args);
            } catch (err) {
              console.error('[MockWallet] Event listener error:', err);
            }
          });
        },
        
        request: async function({ method, params }) {
          console.log('[MockWallet] request:', method, JSON.stringify(params));
          
          switch (method) {
            case 'wallet_requestPermissions':
              // Return permissions structure that wagmi expects
              console.log('[MockWallet] Granting wallet_requestPermissions');
              return [{
                parentCapability: 'eth_accounts',
                caveats: [{
                  type: 'restrictReturnedAccounts',
                  value: [ADDRESS]
                }]
              }];
              
            case 'wallet_getPermissions':
              // Return existing permissions
              return [{
                parentCapability: 'eth_accounts',
                caveats: [{
                  type: 'restrictReturnedAccounts',
                  value: [ADDRESS]
                }]
              }];
              
            case 'eth_requestAccounts':
              // Emit accountsChanged event when connecting
              setTimeout(() => {
                mockProvider.emit('accountsChanged', [ADDRESS]);
                mockProvider.emit('connect', { chainId: '0xaa36a7' });
              }, 100);
              return [ADDRESS];
              
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
          if (!eventListeners.has(event)) {
            eventListeners.set(event, []);
          }
          eventListeners.get(event).push(callback);
          return this;
        },
        
        addListener: function(event, callback) {
          return this.on(event, callback);
        },
        
        removeListener: function(event, callback) {
          const listeners = eventListeners.get(event) || [];
          const index = listeners.indexOf(callback);
          if (index > -1) {
            listeners.splice(index, 1);
          }
          return this;
        },
        
        removeAllListeners: function(event) {
          if (event) {
            eventListeners.delete(event);
          } else {
            eventListeners.clear();
          }
          return this;
        },
        
        once: function(event, callback) {
          const wrappedCallback = (...args) => {
            this.removeListener(event, wrappedCallback);
            callback(...args);
          };
          return this.on(event, wrappedCallback);
        },
        
        listenerCount: function(event) {
          return (eventListeners.get(event) || []).length;
        },
      };
      
      // Inject the mock provider
      window.ethereum = mockProvider;
      
      console.log('[MockWallet] Injected mock wallet for address:', ADDRESS);
    })();
  `;
}

/**
 * Creates the init script for both provider injection and localStorage setup
 */
function createCombinedInitScript(
  privateKey: string,
  address: string,
  rpcUrl: string
): string {
  const providerScript = createMockProviderScript(privateKey, address, rpcUrl);
  
  // Add localStorage setup to the provider script
  return `
    ${providerScript}
    
    // Set E2E test mode flag for the app to detect
    window.__E2E_TEST_MODE__ = true;
    
    // Pre-populate localStorage with wagmi connection state
    // This needs to run BEFORE wagmi initializes
    (function() {
      const address = '${address}';
      const state = JSON.stringify({
        state: {
          connections: {
            __type: 'Map',
            value: [
              ['mock', {
                accounts: [address],
                chainId: 11155111,
                connector: {
                  id: 'mock',
                  name: 'Mock',
                  type: 'mock',
                },
              }],
            ],
          },
          chainId: 11155111,
          current: 'mock',
        },
        version: 2,
      });
      
      try {
        localStorage.setItem('wagmi.store', state);
        localStorage.setItem('wagmi.recentConnectorId', '"mock"');
        console.log('[MockWallet] Pre-populated localStorage for address:', address);
        console.log('[MockWallet] E2E test mode enabled');
      } catch (e) {
        console.error('[MockWallet] Failed to set localStorage:', e);
      }
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

  // Add combined init script that runs before any page script
  // This includes both the provider injection and localStorage setup
  await page.addInitScript(
    createCombinedInitScript(
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

/**
 * Waits for the wallet to be connected
 * 
 * In E2E mode (NEXT_PUBLIC_E2E_TEST_MODE=true), the app auto-connects using wagmi's mock connector.
 * This function waits for that connection to complete.
 * 
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait for connection (default: 30s)
 */
export async function connectWalletViaUI(page: Page, timeout: number = 30000): Promise<void> {
  // Add event listener for console logs to debug
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('E2E') || text.includes('MockWallet') || text.includes('connect')) {
      console.log('[Browser Console]', text);
    }
  });
  
  // Wait for the wallet to be connected
  // In E2E mode, the app auto-connects via the E2EAutoConnect component
  console.log('[connectWalletViaUI] Waiting for E2E auto-connect...');
  
  try {
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="account-header-button"]');
        const text = button?.textContent || '';
        // Check if the button shows an address (format: network | 0x...) or network name
        return text.includes('0x') || text.includes('Sepolia');
      },
      { timeout }
    );
    console.log('[connectWalletViaUI] Wallet connected successfully');
  } catch (error) {
    console.log('[connectWalletViaUI] Auto-connect timed out, attempting manual connection...');
    
    // Fallback: Try manual connection
    await page.click('[data-testid="account-header-button"]');
    
    const connectButton = page.locator('[data-testid="connect-wallet-button"]');
    if (await connectButton.isVisible({ timeout: 5000 })) {
      await connectButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Close panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}
