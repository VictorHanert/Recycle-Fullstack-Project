import { test as base, expect } from '@playwright/test';

const TEST_USER = {
  username: 'test',
  email: 'test@example.com',
  full_name: 'Test User',
  password: 'Password123!',
};

async function ensureTestUserExists(request) {
  try {
    await request.post('http://localhost:8000/api/auth/register', { data: TEST_USER });
  } catch (err) {
    // User likely already exists; swallow errors to keep tests moving
  }
}

export const test = base.extend({
  loggedInPage: async ({ page, request }, use) => {
    await ensureTestUserExists(request);

    await page.goto('/login');

    await page.fill('#identifier', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');

    const errorBox = page.locator('.bg-red-100');
    if (await errorBox.isVisible()) {
      throw new Error(`LOGIN ERROR: ${await errorBox.innerText()}`);
    }

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    await use(page);
  },
});

export { expect };
