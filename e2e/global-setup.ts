/**
 * Playwright Global Setup
 * Starts Anvil fork before tests run
 */

import { spawn, ChildProcess } from 'child_process';

let anvilProcess: ChildProcess | null = null;

async function waitForAnvil(url: string, timeout = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      });
      if (res.ok) return true;
    } catch {
      // Anvil not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function globalSetup() {
  const RPC_URL = process.env.RPC_URL || process.env.ANVIL_FORK_URL;
  const ANVIL_PORT = 8545;
  const ANVIL_URL = `http://localhost:${ANVIL_PORT}`;
  
  // Check if Anvil is already running
  const alreadyRunning = await waitForAnvil(ANVIL_URL, 2000);
  if (alreadyRunning) {
    console.log('[Global Setup] Anvil already running on port', ANVIL_PORT);
    return;
  }
  
  console.log('[Global Setup] Starting Anvil fork...');
  
  // Build anvil command
  const args = [
    '--host', '0.0.0.0',
    '--port', String(ANVIL_PORT),
    '--accounts', '10',
    '--balance', '10000',
    '--chain-id', '11155111', // Sepolia
  ];
  
  // Add fork URL if available
  if (RPC_URL) {
    args.push('--fork-url', RPC_URL);
    args.push('--fork-block-number', '7500000');
  }
  
  anvilProcess = spawn('anvil', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  
  anvilProcess.stdout?.on('data', (data) => {
    const text = data.toString();
    if (text.includes('Listening')) {
      console.log('[Anvil]', text.trim());
    }
  });
  
  anvilProcess.stderr?.on('data', (data) => {
    console.error('[Anvil Error]', data.toString().trim());
  });
  
  // Store PID for teardown
  if (anvilProcess.pid) {
    process.env.ANVIL_PID = String(anvilProcess.pid);
  }
  
  // Wait for Anvil to be ready
  const ready = await waitForAnvil(ANVIL_URL, 30000);
  if (!ready) {
    throw new Error('Anvil failed to start within 30 seconds');
  }
  
  console.log('[Global Setup] Anvil ready on', ANVIL_URL);
}

export default globalSetup;
