import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
  test('User can register', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel('Username *').fill('newuser123');
    await page.getByLabel('Email address *').fill('newuser@example.com');
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Password *').fill('password123');
    await page.getByLabel('Confirm Password *').fill('password123');

    await page.getByRole('button', { name: 'Create account' }).click();

    await page.waitForURL('/dashboard');

    await expect(page.getByText(/Welcome/i)).toBeVisible();
  });
});
