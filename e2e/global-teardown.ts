/**
 * Playwright Global Teardown
 * Stops Anvil after tests complete
 */

async function globalTeardown() {
  const anvilPid = process.env.ANVIL_PID;
  if (anvilPid) {
    console.log('[Global Teardown] Stopping Anvil (PID:', anvilPid, ')');
    try {
      process.kill(Number(anvilPid), 'SIGTERM');
    } catch {
      // Process may have already exited
    }
  }
}

export default globalTeardown;
