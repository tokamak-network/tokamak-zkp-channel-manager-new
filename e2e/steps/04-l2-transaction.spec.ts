/**
 * Step 4: L2 Transaction
 *
 * Tests creating an L2 transaction:
 * 1. Enter recipient L2 address
 * 2. Enter transfer amount
 * 3. Create transaction (generates ZK proof)
 * 4. Verify proof appears in proof list
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, getTestAccountAddress, connectWalletViaUI } from "../fixtures/mock-wallet";
import { loadChannelState, updateChannelState } from "../fixtures/channel-state";
import { PROOF_GENERATION_TIMEOUT } from "../helpers/wait-for-proof";

// Extended timeout for proof generation
test.setTimeout(15 * 60 * 1000); // 15 minutes

test.describe("Step 4: L2 Transaction", () => {
  test("should create L2 transaction with proof", async ({ page }) => {
    // Inject mock wallet as leader (or participant can do this too)
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
    // We need to get the participant's L2 address
    // For testing, we'll use a dummy L2 address format
    const recipientInput = page.locator('[data-testid="recipient-address-input"]');
    // L2 address is derived from wallet address, using a placeholder for now
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

    // The modal will show:
    // 1. Signing for L2 key generation
    // 2. Proof generation progress (SSE stream)
    // 3. Completion

    console.log("[Test] Waiting for L2 transaction proof generation...");

    // Wait for proof generation to complete
    await expect(page.locator('text=Proof Generated')).toBeVisible({
      timeout: PROOF_GENERATION_TIMEOUT,
    });

    // Close the modal
    await page.click('button:has-text("Close")');

    // Verify proof appears in the proof list
    await expect(page.locator('text=proof#1')).toBeVisible({ timeout: 10_000 });

    // Update state
    updateChannelState({
      transactionAt: Date.now(),
      txHashes: {
        transaction: "completed",
      },
    });

    console.log("[Test] L2 transaction created with proof");
  });
});
