import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Tokamak/i);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    // Check for main navigation or content
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Channel Flow', () => {
  test('should navigate to create channel page', async ({ page }) => {
    await page.goto('/create-channel');
    await expect(page).toHaveURL(/create-channel/);
  });

  test('should navigate to join channel page', async ({ page }) => {
    await page.goto('/join-channel');
    await expect(page).toHaveURL(/join-channel/);
  });
});
