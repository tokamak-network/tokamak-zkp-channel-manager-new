/**
 * Step 3: Initialize Channel State
 *
 * Tests the channel initialization flow (leader only):
 * 1. Click Initialize State button
 * 2. Wait for Groth16 proof generation (up to 10 minutes)
 * 3. Sign and submit transaction
 * 4. Verify channel state changes to "Open"
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";
import { PROOF_GENERATION_TIMEOUT } from "../helpers/wait-for-proof";

// Extended timeout for proof generation
test.setTimeout(15 * 60 * 1000); // 15 minutes

test.describe("Step 3: Initialize Channel State", () => {
  test("leader should initialize channel state", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to channel
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

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
    // The modal should show progress indicators
    console.log("[Test] Waiting for Groth16 proof generation...");

    // Wait for proof generation to complete
    // Look for success indicators in the modal
    await expect(page.locator('text=State Initialized')).toBeVisible({
      timeout: PROOF_GENERATION_TIMEOUT,
    });

    // After initialization, page should redirect to transaction page
    await page.waitForTimeout(3000); // Wait for redirect
    await expect(page).toHaveURL(/transaction/);

    // Update state
    updateChannelState({
      initializedAt: Date.now(),
      txHashes: {
        initialize: "completed",
      },
    });

    console.log("[Test] Channel initialization completed");
  });
});
