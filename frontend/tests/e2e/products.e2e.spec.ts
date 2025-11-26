import { test, expect } from '@playwright/test';

test.describe('Create Product Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username or Email').fill('seller@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('/dashboard');
  });

  test('User can create a product', async ({ page }) => {
    await page.goto('/create-product');

    await page.getByLabel('Bicycle Name *').fill('Playwright Test Bike');
    await page.getByLabel('Description *').fill('Great bike for testing.');
    await page.getByLabel(/Price/).fill('1200');

    await page.getByLabel('Category *').selectOption({ index: 1 });

    await page.getByRole('button', { name: /Create Product/ }).click();

    await expect(page).toHaveURL(/\/products\/\d+$/);
    await expect(page.getByText('Playwright Test Bike')).toBeVisible();
  });
});
