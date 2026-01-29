/**
 * Step 5: Submit Proof (Leader)
 *
 * Tests the proof submission flow:
 * 1. Leader approves the proof
 * 2. Leader submits proof on-chain
 * 3. Verify channel state changes to "Closing"
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";

test.describe("Step 5: Submit Proof", () => {
  test("leader should approve and submit proof", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to transaction page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Should be on transaction page
    await expect(page).toHaveURL(/transaction/);

    // Step 1: Find and approve the proof
    // Look for the proof in the list and click approve
    const proofItem = page.locator('[data-testid^="proof-list-item"]').first();
    await expect(proofItem).toBeVisible({ timeout: 10_000 });

    // Click approve button on the proof
    const approveProofButton = proofItem.locator('button:has-text("Approve")');
    if (await approveProofButton.isVisible()) {
      await approveProofButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 2: Click Submit Proof button
    const submitButton = page.locator('[data-testid="submit-proof-button"]');
    await expect(submitButton).toBeEnabled({ timeout: 10_000 });
    await submitButton.click();

    // Wait for submission modal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    // Confirm submission
    await page.click('button:has-text("Confirm")');

    // Wait for transaction confirmation
    await expect(page.locator('text=Proof Submitted')).toBeVisible({
      timeout: 60_000,
    });

    // After proof submission, channel state changes to Closing (3)
    // Page should redirect to state3 page
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/state3/);

    // Update state
    updateChannelState({
      proofSubmittedAt: Date.now(),
      txHashes: {
        submitProof: "completed",
      },
    });

    console.log("[Test] Proof submitted, channel is now Closing");
  });
});
