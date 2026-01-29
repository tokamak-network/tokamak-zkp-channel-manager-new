/**
 * Step 2: Deposit Tokens
 *
 * Tests the deposit flow for both leader and participant:
 * 1. Navigate to deposit page
 * 2. Enter deposit amount
 * 3. Approve token (if needed)
 * 4. Execute deposit transaction
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet } from "../fixtures/mock-wallet";
import { TEST_ACCOUNTS } from "../fixtures/test-accounts";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";

test.describe("Step 2: Deposit Tokens", () => {
  test("leader should deposit tokens", async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");

    // Load channel state from previous step
    const state = loadChannelState();
    expect(state?.channelId).toBeTruthy();

    // Navigate to deposit page
    await page.goto(`/state-explorer?channelId=${state!.channelId}`);
    await page.waitForLoadState("networkidle");

    // Should be redirected to deposit page (state 1)
    await expect(page).toHaveURL(/deposit/);

    // Enter deposit amount
    const amountInput = page.locator('[data-testid="deposit-amount-input"]');
    await amountInput.fill("100");

    // Check if approval is needed
    const approveButton = page.locator('[data-testid="approve-button"]');
    if (await approveButton.isVisible()) {
      // Click approve
      await approveButton.click();

      // Wait for approval transaction
      await expect(page.locator('text=Approved')).toBeVisible({
        timeout: 60_000,
      });
    }

    // Click deposit button
    const depositButton = page.locator('[data-testid="deposit-button"]');
    await expect(depositButton).toBeEnabled();
    await depositButton.click();

    // Wait for deposit confirmation modal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    // Confirm deposit
    await page.click('button:has-text("Confirm")');

    // Wait for deposit completion
    // This includes MPT key generation signature + deposit transaction
    await expect(page.locator('text=Deposit completed')).toBeVisible({
      timeout: 120_000, // 2 minutes for both signatures
    });

    // Update state
    updateChannelState({
      depositedAt: Date.now(),
      txHashes: {
        leaderDeposit: "completed",
      },
    });

    console.log("[Test] Leader deposit completed");
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

    // Should be on deposit page
    await expect(page).toHaveURL(/deposit/);

    // Enter deposit amount
    const amountInput = page.locator('[data-testid="deposit-amount-input"]');
    await amountInput.fill("50");

    // Check if approval is needed
    const approveButton = page.locator('[data-testid="approve-button"]');
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await expect(page.locator('text=Approved')).toBeVisible({
        timeout: 60_000,
      });
    }

    // Click deposit button
    const depositButton = page.locator('[data-testid="deposit-button"]');
    await expect(depositButton).toBeEnabled();
    await depositButton.click();

    // Confirm deposit
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });
    await page.click('button:has-text("Confirm")');

    // Wait for completion
    await expect(page.locator('text=Deposit completed')).toBeVisible({
      timeout: 120_000,
    });

    // Update state
    updateChannelState({
      txHashes: {
        participantDeposit: "completed",
      },
    });

    console.log("[Test] Participant deposit completed");
  });
});
