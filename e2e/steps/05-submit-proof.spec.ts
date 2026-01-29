/**
 * Step 5: Submit Proof (UI Flow Test)
 *
 * Tests the proof submission UI.
 * 
 * Note: This test is skipped in CI because it requires:
 * 1. A real channel with L2 transactions from Steps 1-4
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";

// Skip in CI
const isCI = process.env.CI === 'true';

test.describe("Step 5: Submit Proof", () => {
  test.skip(isCI, "Skipped in CI - requires real channel with proofs");

  test("leader should approve and submit proof", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to transaction page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be on transaction page
    await expect(page).toHaveURL(/transaction/);

    // Find and approve the proof
    const proofItem = page.locator('[data-testid^="proof-list-item"]').first();
    await expect(proofItem).toBeVisible({ timeout: 10_000 });

    // Click approve button on the proof
    const approveProofButton = proofItem.locator('button:has-text("Approve")');
    if (await approveProofButton.isVisible()) {
      await approveProofButton.click();
      await page.waitForTimeout(1000);
    }

    // Click Submit Proof button
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
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/state3/);

    updateChannelState({
      proofSubmittedAt: Date.now(),
      txHashes: {
        submitProof: "completed",
      },
    });

    console.log("[Test] Proof submitted, channel is now Closing");
  });
});
