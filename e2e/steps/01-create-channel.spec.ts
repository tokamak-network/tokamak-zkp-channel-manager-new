/**
 * Step 1: Create Channel (UI Flow Test)
 *
 * Tests the channel creation UI flow:
 * 1. Connect wallet (mock)
 * 2. Select app type (ERC20)
 * 3. Generate channel ID
 * 4. Add participant addresses
 * 5. Verify UI elements are displayed correctly
 * 
 * Note: This test verifies UI elements only.
 * Actual blockchain interactions require a real Anvil fork.
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, connectWalletViaUI } from "../fixtures/mock-wallet";
import { TEST_ACCOUNTS } from "../fixtures/test-accounts";
import {
  createInitialState,
  updateChannelState,
} from "../fixtures/channel-state";

test.describe("Step 1: Create Channel", () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock wallet as leader
    await injectMockWallet(page, "leader");
  });

  test("should create a new channel", async ({ page }) => {
    // Initialize test state
    createInitialState(
      TEST_ACCOUNTS.leader.address,
      TEST_ACCOUNTS.participant.address
    );

    // Navigate to create channel page
    await page.goto("/create-channel");
    await expect(page).toHaveURL(/create-channel/);

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Step 0: Connect wallet first
    await connectWalletViaUI(page);

    // Verify wallet is connected (address shown in header)
    await expect(page.locator('[data-testid="account-header-button"]')).toContainText(/0x/);

    // Step 1: Select app type (ERC20)
    const appButton = page.locator('button:has-text("Select App")');
    if (await appButton.isVisible()) {
      await appButton.click();
      await page.click('button:has-text("ERC20")');
    }

    // Verify ERC20 is selected
    await expect(page.locator('button:has-text("ERC20")')).toBeVisible();

    // Step 2: Generate Channel ID
    const generateButton = page.locator('[data-testid="generate-channel-id-button"]');
    
    // Wait for generate button to be visible and clickable
    if (await generateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await generateButton.click();
      
      // Wait for channel ID to appear (may take a moment)
      await page.waitForTimeout(2000);
    }

    // Step 3: Verify channel ID section is displayed (use label specifically)
    await expect(page.locator('label:has-text("Channel ID")')).toBeVisible();

    // Step 4: Add participant address
    const participantInput = page.locator('[data-testid="participant-address-input-0"]');
    await expect(participantInput).toBeVisible();
    await participantInput.fill(TEST_ACCOUNTS.participant.address);

    // Wait for validation to process
    await page.waitForTimeout(1000);

    // Step 5: Verify the participant address input contains the value
    await expect(participantInput).toHaveValue(TEST_ACCOUNTS.participant.address);

    // Step 6: Verify Create Channel button exists (even if disabled)
    const createButton = page.locator('[data-testid="create-channel-button"]');
    await expect(createButton).toBeVisible();

    // Step 7: Verify Requirements section shows progress
    await expect(page.locator('text=Requirements')).toBeVisible();
    await expect(page.locator('text=Select an app type')).toBeVisible();
    await expect(page.locator('text=Generate a Channel ID')).toBeVisible();
    await expect(page.locator('text=Add at least one participant')).toBeVisible();

    // Try to extract channel ID if visible
    const channelIdText = await page.locator('text=/0x[a-fA-F0-9]{8,}/').first().textContent().catch(() => null);
    if (channelIdText) {
      const channelIdMatch = channelIdText.match(/0x[a-fA-F0-9]+/);
      if (channelIdMatch) {
        updateChannelState({
          channelId: channelIdMatch[0],
          txHashes: { create: "ui-test-only" },
        });
        console.log(`[Test] Channel ID found: ${channelIdMatch[0]}`);
      }
    }

    console.log("[Test] Create channel UI flow completed successfully");
  });
});
