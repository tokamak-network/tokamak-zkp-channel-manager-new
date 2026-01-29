/**
 * Proof Generation Wait Helpers for E2E Testing
 *
 * Utilities for waiting for proof generation to complete.
 * Proof generation can take up to 10 minutes in CI.
 */

import { type Page, expect } from "@playwright/test";

// Proof generation timeout: 10 minutes (as specified)
export const PROOF_GENERATION_TIMEOUT = 10 * 60 * 1000;

/**
 * Proof generation step indicators
 */
export const PROOF_STEPS = {
  idle: "idle",
  signing: "signing",
  generating: "generating",
  synthesizing: "synthesizing",
  proving: "proving",
  verifying: "verifying",
  extracting: "extracting",
  uploading: "uploading",
  completed: "completed",
  error: "error",
} as const;

/**
 * Waits for proof generation modal to show progress
 */
export async function waitForProofGenerationStart(
  page: Page,
  timeout: number = 30_000
): Promise<void> {
  // Wait for the proof generation modal to appear
  await expect(
    page.locator('[data-testid="proof-generation-modal"]')
  ).toBeVisible({ timeout });
}

/**
 * Waits for proof generation to complete
 * This handles the long proof generation process with proper timeout
 *
 * @param page - Playwright page instance
 * @param timeout - Timeout in ms (default: 10 minutes)
 */
export async function waitForProofGenerationComplete(
  page: Page,
  timeout: number = PROOF_GENERATION_TIMEOUT
): Promise<void> {
  // Wait for either completed or error state
  await Promise.race([
    expect(page.locator('[data-testid="proof-completed"]')).toBeVisible({
      timeout,
    }),
    expect(page.locator('[data-testid="proof-error"]')).toBeVisible({
      timeout,
    }),
  ]);

  // Check if there was an error
  const errorVisible = await page
    .locator('[data-testid="proof-error"]')
    .isVisible();
  if (errorVisible) {
    const errorText = await page
      .locator('[data-testid="proof-error"]')
      .textContent();
    throw new Error(`Proof generation failed: ${errorText}`);
  }
}

/**
 * Waits for the signature request and handles it
 * The mock wallet auto-signs, so we just wait for the modal to proceed
 */
export async function waitForSignatureRequest(
  page: Page,
  timeout: number = 30_000
): Promise<void> {
  // Wait for signing step to appear
  await expect(page.locator('[data-testid="proof-signing"]')).toBeVisible({
    timeout,
  });

  // Mock wallet auto-signs, so wait for it to proceed to next step
  await expect(page.locator('[data-testid="proof-signing"]')).not.toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Full proof generation flow: start -> sign -> wait for completion
 *
 * @param page - Playwright page instance
 * @param options - Options for timeouts
 */
export async function waitForFullProofGeneration(
  page: Page,
  options: {
    signatureTimeout?: number;
    proofTimeout?: number;
  } = {}
): Promise<void> {
  const {
    signatureTimeout = 30_000,
    proofTimeout = PROOF_GENERATION_TIMEOUT,
  } = options;

  // Step 1: Wait for modal to appear
  await waitForProofGenerationStart(page, signatureTimeout);

  // Step 2: Wait for signature (auto-handled by mock wallet)
  // The modal should show signing state briefly then move to generating
  await page.waitForTimeout(2000); // Brief pause for wallet interaction

  // Step 3: Wait for proof generation to complete
  await waitForProofGenerationComplete(page, proofTimeout);
}

/**
 * Waits for initialize state proof generation
 * This is specifically for the channel initialization which generates Groth16 proof
 */
export async function waitForInitializeProofComplete(
  page: Page,
  timeout: number = PROOF_GENERATION_TIMEOUT
): Promise<void> {
  // Wait for the initialize state modal to show completion
  await expect(
    page.locator('[data-testid="initialize-completed"]')
  ).toBeVisible({ timeout });
}

/**
 * Waits for close channel proof generation
 * Similar to initialize, this generates a Groth16 proof for final balances
 */
export async function waitForCloseChannelProofComplete(
  page: Page,
  timeout: number = PROOF_GENERATION_TIMEOUT
): Promise<void> {
  // Wait for the close channel process to complete
  await expect(
    page.locator('[data-testid="close-channel-completed"]')
  ).toBeVisible({ timeout });
}
