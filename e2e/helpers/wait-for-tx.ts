/**
 * Transaction Wait Helpers for E2E Testing
 *
 * Utilities for waiting for transaction confirmations and UI updates.
 */

import { type Page, expect } from "@playwright/test";

/**
 * Waits for a transaction to be confirmed by watching for UI changes
 *
 * @param page - Playwright page instance
 * @param options - Wait options
 */
export async function waitForTransactionConfirmation(
  page: Page,
  options: {
    timeout?: number;
    successSelector?: string;
    errorSelector?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 60_000,
    successSelector = '[data-testid="tx-success"]',
    errorSelector = '[data-testid="tx-error"]',
  } = options;

  // Wait for either success or error
  await Promise.race([
    expect(page.locator(successSelector)).toBeVisible({ timeout }),
    expect(page.locator(errorSelector)).toBeVisible({ timeout }),
  ]);

  // Check if there was an error
  const errorVisible = await page.locator(errorSelector).isVisible();
  if (errorVisible) {
    const errorText = await page.locator(errorSelector).textContent();
    throw new Error(`Transaction failed: ${errorText}`);
  }
}

/**
 * Waits for a modal to appear
 */
export async function waitForModal(
  page: Page,
  modalSelector: string = '[role="dialog"]',
  timeout: number = 10_000
): Promise<void> {
  await expect(page.locator(modalSelector)).toBeVisible({ timeout });
}

/**
 * Waits for a modal to close
 */
export async function waitForModalClose(
  page: Page,
  modalSelector: string = '[role="dialog"]',
  timeout: number = 10_000
): Promise<void> {
  await expect(page.locator(modalSelector)).not.toBeVisible({ timeout });
}

/**
 * Clicks a button and waits for the next state
 */
export async function clickAndWait(
  page: Page,
  buttonSelector: string,
  waitForSelector: string,
  timeout: number = 30_000
): Promise<void> {
  await page.click(buttonSelector);
  await expect(page.locator(waitForSelector)).toBeVisible({ timeout });
}

/**
 * Waits for page navigation
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 30_000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Waits for network idle (no pending requests)
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 10_000
): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
}
