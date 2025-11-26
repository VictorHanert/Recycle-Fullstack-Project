import { test, expect } from '@playwright/test';

test('User can contact seller and send a message', async ({ page }) => {
  // Login as buyer
  await page.goto('/login');
  await page.getByLabel('Username or Email').fill('buyer@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');

  // Go to product
  await page.goto('/products/1');

  // Open message dialog
  await page.getByRole('button', { name: 'Contact Seller' }).click();

  // Send quick message
  await page.getByRole('button', { name: 'Hi! Is this still available?' }).click();

  // Should redirect into messages
  await page.waitForURL('/messages**');

  // Chat view should show the message
  await expect(page.getByText('Hi! Is this still available?')).toBeVisible();
});
