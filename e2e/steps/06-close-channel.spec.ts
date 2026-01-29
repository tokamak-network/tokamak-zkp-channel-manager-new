/**
 * Step 6: Close Channel (UI Flow Test)
 *
 * Tests the channel closing UI.
 * 
 * Note: This test is skipped in CI because it requires:
 * 1. A real channel in Closing state from Steps 1-5
 * 2. Groth16 proof generation for final balances
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";
import { PROOF_GENERATION_TIMEOUT } from "../helpers/wait-for-proof";

// Skip in CI
const isCI = process.env.CI === 'true';

// Extended timeout for proof generation
test.setTimeout(15 * 60 * 1000); // 15 minutes

test.describe("Step 6: Close Channel", () => {
  test.skip(isCI, "Skipped in CI - requires real channel in Closing state");

  test("leader should close the channel", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to channel (should be on state3 page)
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be on state3 page (Closing state)
    await expect(page).toHaveURL(/state3/);

    // Click Close Channel button
    const closeButton = page.locator('[data-testid="close-channel-button"]');
    await expect(closeButton).toBeVisible();
    await expect(closeButton).toBeEnabled();
    await closeButton.click();

    // Wait for confirmation modal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    // Confirm close
    await page.click('button:has-text("Confirm")');

    // Wait for proof generation and transaction
    console.log("[Test] Waiting for final balance proof generation...");

    await expect(page.locator('text=Channel closed successfully')).toBeVisible({
      timeout: PROOF_GENERATION_TIMEOUT,
    });

    // After closing, should redirect to withdraw page
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/withdraw/);

    updateChannelState({
      closedAt: Date.now(),
      txHashes: {
        close: "completed",
      },
    });

    console.log("[Test] Channel closed successfully");
  });
});
