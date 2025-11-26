import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('User can log in successfully', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username or Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    await page.getByRole('button', { name: 'Sign in' }).click();

    // Expect redirect
    await page.waitForURL('/dashboard', { timeout: 4000 });

    // Dashboard must contain something unique
    await expect(page.getByText(/My Dashboard/i)).toBeVisible();
  });

  test('Shows error on invalid login', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Username or Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrong');

    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Login failed')).toBeVisible();
  });
});
