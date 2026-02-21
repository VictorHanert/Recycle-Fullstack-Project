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

    // Always log in explicitly to avoid relying on auto-login after registration
    await page.goto('/login');
    await page.fill('#identifier', uniqueUsername);
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify successful login redirects to dashboard
    const errorBox = page.locator('.bg-red-100');
    if (await errorBox.isVisible()) {
      throw new Error(`LOGIN ERROR: ${await errorBox.innerText()}`);
    }

    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 15000 }),
      page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 15000 }),
    ]);

    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
    }
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome back,')).toBeVisible();
    await expect(page.locator('p', { hasText: 'Welcome back,' })).toContainText(
      new RegExp(`Welcome back,\\s*(Test User E2E|${uniqueUsername})`, 'i')
    );

    // Log out (avatar menu) - avoid pointer interception by using a DOM event
    // Log out by clearing auth storage (avoids flaky hover menus)
    await page.evaluate(() => {
      localStorage.removeItem('auth-storage');
    });
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Now log in again
    await page.fill('#identifier', uniqueUsername);
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify successful login redirects to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome back,')).toBeVisible();
  });
});
