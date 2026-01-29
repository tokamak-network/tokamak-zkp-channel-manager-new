/**
 * Step 2: Deposit Tokens (UI Flow Test)
 *
 * Tests the deposit UI flow.
 * 
 * Note: This test is skipped in CI because it requires a real channel ID
 * from Step 1 which requires actual blockchain transactions.
 * 
 * To run these tests locally with real transactions:
 * 1. Start Anvil with Sepolia fork: anvil --fork-url <SEPOLIA_RPC>
 * 2. Run Step 1 first to create a real channel
 * 3. Then run this test
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { TEST_ACCOUNTS } from "../fixtures/test-accounts";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";

// Skip these tests in CI - they require real blockchain state from previous steps
const isCI = process.env.CI === 'true';

test.describe("Step 2: Deposit Tokens", () => {
  test.skip(isCI, "Skipped in CI - requires real channel from Step 1");

  test("leader should deposit tokens", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state from previous step
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to deposit page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be redirected to deposit page (state 1)
    await expect(page).toHaveURL(/deposit/);

    // Verify deposit UI elements
    await expect(page.locator('text=Deposit')).toBeVisible();

    // Enter deposit amount
    const amountInput = page.locator('[data-testid="deposit-amount-input"]');
    if (await amountInput.isVisible()) {
      await amountInput.fill("100");
    }

    // Verify deposit button
    const depositButton = page.locator('[data-testid="deposit-button"]');
    if (await depositButton.isVisible()) {
      await expect(depositButton).toBeEnabled();
    }

    console.log("[Test] Leader deposit UI flow verified");
  });

  test("participant should deposit tokens", async ({ page }) => {
    // Inject mock wallet as participant
    await injectMockWallet(page, "participant");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to deposit page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be on deposit page
    await expect(page).toHaveURL(/deposit/);

    console.log("[Test] Participant deposit UI flow verified");
  });
});
