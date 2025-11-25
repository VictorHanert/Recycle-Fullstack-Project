import { test, expect } from '@playwright/test';

// ----------------------------------------------------------------------
// E2E TEST: End-to-End User Flow
// Purpose: Simulate a real user clicking through the site.
// Tool: Playwright
// ----------------------------------------------------------------------

test.describe('Basic User Flow', () => {
  test('should allow a user to sign up, log in, and log out', async ({ page }) => {
    const uniqueUsername = `testuserE2E${Date.now()}`;
    const uniqueEmail = `${uniqueUsername}@example.com`;

    // Visit the signup page
    await page.goto('/register');

    // Fill out the signup form
    await page.fill('input[name="username"]', uniqueUsername);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="full_name"]', 'Test User E2E');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Submit the signup form
    await page.click('button[type="submit"]');

    // Wait for success message to appear
    await expect(page.locator('.bg-green-100')).toBeVisible();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page.locator('text=Welcome back, Test User E2E!')).toBeVisible();

    // Log out (assuming there's a logout button)
    await page.locator('img[alt="User Avatar"]').first().hover();
    await page.locator('button:has-text("Logout")').first().click();

    // Verify successful logout redirects to login
    await expect(page).toHaveURL('/login');

    // Now log in again
    await page.goto('/login');
    await page.fill('#identifier', uniqueUsername);
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify successful login redirects to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome back, Test User E2E!')).toBeVisible();
  });
});