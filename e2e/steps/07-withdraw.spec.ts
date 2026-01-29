/**
 * Step 7: Withdraw (UI Flow Test)
 *
 * Tests the withdrawal UI.
 * 
 * Note: This test is skipped in CI because it requires:
 * 1. A real closed channel from Steps 1-6
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";

// Skip in CI
const isCI = process.env.CI === 'true';

test.describe("Step 7: Withdraw", () => {
  test.skip(isCI, "Skipped in CI - requires real closed channel");

  test("leader should withdraw final balance", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to withdraw page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be on withdraw page (state 4 - Closed)
    await expect(page).toHaveURL(/withdraw/);

    // Verify withdrawable amount is displayed
    await expect(page.locator('text=Amount')).toBeVisible();

    // Click withdraw button
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await expect(withdrawButton).toBeVisible();
    await expect(withdrawButton).toBeEnabled();
    await withdrawButton.click();

    // Wait for confirmation modal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    // Confirm withdrawal
    await page.click('button:has-text("Confirm")');

    // Wait for transaction confirmation
    await expect(page.locator('text=Withdrawn')).toBeVisible({
      timeout: 60_000,
    });

    updateChannelState({
      withdrawnAt: Date.now(),
      txHashes: {
        leaderWithdraw: "completed",
      },
    });

    console.log("[Test] Leader withdrawal completed");
  });

  test("participant should withdraw final balance", async ({ page }) => {
    // Inject mock wallet as participant
    await injectMockWallet(page, "participant");

    // Load channel state
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to withdraw page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Connect wallet first
    await connectWalletViaUI(page);

    // Should be on withdraw page
    await expect(page).toHaveURL(/withdraw/);

    // Click withdraw button
    const withdrawButton = page.locator('[data-testid="withdraw-button"]');
    await expect(withdrawButton).toBeVisible();
    await expect(withdrawButton).toBeEnabled();
    await withdrawButton.click();

    // Confirm withdrawal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
    await page.click('button:has-text("Confirm")');

    // Wait for completion
    await expect(page.locator('text=Withdrawn')).toBeVisible({
      timeout: 60_000,
    });

    updateChannelState({
      txHashes: {
        participantWithdraw: "completed",
      },
    });

    console.log("[Test] Participant withdrawal completed");
    console.log("[Test] Channel lifecycle test completed!");
  });
});
