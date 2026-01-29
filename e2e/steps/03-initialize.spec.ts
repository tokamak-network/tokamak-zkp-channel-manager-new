/**
 * Step 3: Initialize Channel State (UI Flow Test)
 *
 * Tests the channel initialization UI.
 * 
 * Note: This test is skipped in CI because it requires:
 * 1. A real channel ID from Step 1
 * 2. Deposits from Step 2
 * 3. Groth16 proof generation (can take 10+ minutes)
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";
import { PROOF_GENERATION_TIMEOUT } from "../helpers/wait-for-proof";

// Skip in CI - requires real blockchain state
const isCI = process.env.CI === 'true';

// Extended timeout for proof generation
test.setTimeout(15 * 60 * 1000); // 15 minutes

test.describe("Step 3: Initialize Channel State", () => {
  test.skip(isCI, "Skipped in CI - requires real channel and deposits");

  test("leader should initialize channel state", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to channel
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be on deposit page (state 1)
    await expect(page).toHaveURL(/deposit/);

    // Leader should see Initialize State button
    const initButton = page.locator('[data-testid="initialize-state-button"]');
    await expect(initButton).toBeVisible();
    await expect(initButton).toBeEnabled();

    // Click Initialize State
    await initButton.click();

    // Wait for confirmation modal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    // Confirm initialization
    await page.click('button:has-text("Confirm")');

    // Wait for proof generation (this is the long step - up to 10 minutes)
    console.log("[Test] Waiting for Groth16 proof generation...");

    await expect(page.locator('text=State Initialized')).toBeVisible({
      timeout: PROOF_GENERATION_TIMEOUT,
    });

    // After initialization, page should redirect to transaction page
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/transaction/);

    updateChannelState({
      initializedAt: Date.now(),
      txHashes: {
        initialize: "completed",
      },
    });

    console.log("[Test] Channel initialization completed");
  });
});
