import { test, expect } from './fixtures/auth.js';

test('Dashboard loads and shows user info', async ({ loggedInPage }) => {
  await expect(loggedInPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(loggedInPage.getByText(/My Products/i)).toBeVisible();
});
