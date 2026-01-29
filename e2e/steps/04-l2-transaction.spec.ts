/**
 * Step 4: L2 Transaction (UI Flow Test)
 *
 * Tests creating an L2 transaction UI.
 * 
 * Note: This test is skipped in CI because it requires:
 * 1. A real initialized channel from Steps 1-3
 * 2. Tokamak-Zk-EVM synthesizer for proof generation
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";
import { PROOF_GENERATION_TIMEOUT } from "../helpers/wait-for-proof";

// Skip in CI
const isCI = process.env.CI === 'true';

// Extended timeout for proof generation
test.setTimeout(15 * 60 * 1000); // 15 minutes

test.describe("Step 4: L2 Transaction", () => {
  test.skip(isCI, "Skipped in CI - requires initialized channel");

  test("should create L2 transaction with proof", async ({ page }) => {
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

    // Should be on transaction page (state 2 - Open)
    await expect(page).toHaveURL(/transaction/);

    // Step 1: Enter recipient L2 address
    const recipientInput = page.locator('[data-testid="recipient-address-input"]');
    const recipientL2Address = "0x" + "1".repeat(64); // Placeholder L2 address
    await recipientInput.fill(recipientL2Address);

    // Step 2: Enter transfer amount
    const amountInput = page.locator('[data-testid="transfer-amount-input"]');
    await amountInput.fill("10");

    // Step 3: Click Create Transaction button
    const createTxButton = page.locator('[data-testid="create-transaction-button"]');
    await expect(createTxButton).toBeEnabled();
    await createTxButton.click();

    // Step 4: Wait for proof generation modal
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10_000 });

    console.log("[Test] Waiting for L2 transaction proof generation...");

    await expect(page.locator('text=Proof Generated')).toBeVisible({
      timeout: PROOF_GENERATION_TIMEOUT,
    });

    // Close the modal
    await page.click('button:has-text("Close")');

    // Verify proof appears in the proof list
    await expect(page.locator('text=proof#1')).toBeVisible({ timeout: 10_000 });

    updateChannelState({
      transactionAt: Date.now(),
      txHashes: {
        transaction: "completed",
      },
    });

    console.log("[Test] L2 transaction created with proof");
  });
});
