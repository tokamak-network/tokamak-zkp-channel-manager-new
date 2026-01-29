/**
 * Step 1: Create Channel
 *
 * Tests the channel creation flow:
 * 1. Connect wallet (mock)
 * 2. Select app type (ERC20)
 * 3. Generate channel ID
 * 4. Add participant addresses
 * 5. Create channel transaction
 */

import { test, expect } from "@playwright/test";
import { injectMockWallet, getTestAccountAddress, connectWalletViaUI } from "../fixtures/mock-wallet";
import { TEST_ACCOUNTS } from "../fixtures/test-accounts";
import {
  saveChannelState,
  createInitialState,
  updateChannelState,
} from "../fixtures/channel-state";
import { waitForTransactionConfirmation } from "../helpers/wait-for-tx";

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

    // Step 1: Select app type (ERC20)
    // Click the app dropdown
    await page.click('button:has-text("Select App")');
    await page.click('button:has-text("ERC20")');

    // Verify ERC20 is selected
    await expect(page.locator('button:has-text("ERC20")')).toBeVisible();

    // Step 2: Generate Channel ID
    await page.click('[data-testid="generate-channel-id-button"]');

    // Wait for channel ID to be generated (channel ID is 66 chars: 0x + 64 hex chars)
    // Look for the channel ID display area which contains a long 0x string
    await expect(page.locator('[data-testid="generate-channel-id-button"]')).not.toBeVisible({ timeout: 10_000 });
    // The channel ID should now be displayed in a span with truncated text
    await expect(page.locator('text=/0x[a-fA-F0-9]{40,}/')).toBeVisible({ timeout: 10_000 });

    // Step 3: Add participant address
    const participantInput = page.locator('[data-testid="participant-address-input-0"]');
    await participantInput.fill(TEST_ACCOUNTS.participant.address);

    // Wait for validation
    await page.waitForTimeout(1000);

    // Verify the participant address was accepted (check mark appears next to the input)
    // The checkmark is inside the Input component as a rightIcon
    await expect(
      page.locator('[data-testid="participant-address-input-0"]')
        .locator('..') // Parent container
        .locator('.lucide-check')
    ).toBeVisible();

    // Step 4: Click Create Channel button
    const createButton = page.locator('[data-testid="create-channel-button"]');
    await expect(createButton).toBeEnabled();
    await createButton.click();

    // Step 5: Wait for confirmation modal
    await expect(page.locator('text=Confirm Transaction')).toBeVisible({ timeout: 10_000 });

    // Click confirm in modal
    await page.locator('button:has-text("Confirm")').last().click();

    // Wait for transaction to be signed and confirmed
    // Mock wallet auto-signs, so we wait for success state
    // The modal will show "Channel Created" when successful
    await expect(page.locator('h3:has-text("Channel Created")')).toBeVisible({
      timeout: 60_000,
    });

    // Get the channel ID from the page
    const channelIdElement = page.locator('text=0x').first();
    const channelIdText = await channelIdElement.textContent();

    // Extract channel ID (should be a 0x... string)
    const channelIdMatch = channelIdText?.match(/0x[a-fA-F0-9]+/);
    const channelId = channelIdMatch?.[0];

    expect(channelId).toBeTruthy();
    expect(channelId).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Save channel state for next steps
    updateChannelState({
      channelId: channelId!,
      txHashes: {
        create: "pending", // Would be extracted from page if available
      },
    });

    console.log(`[Test] Channel created: ${channelId}`);
  });
});
