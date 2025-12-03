import { test as base, expect } from '@playwright/test';

// Generate a unique user per test run to avoid stale state
const UNIQUE_SUFFIX = Date.now();
const TEST_USER = {
  username: `test${UNIQUE_SUFFIX}`,
  email: `test${UNIQUE_SUFFIX}@example.com`,
  full_name: 'Test User',
  password: 'Password123!',
};

async function ensureTestUserExists(request) {
  try {
    await request.post('http://localhost:8000/api/auth/register', { data: { ...TEST_USER, confirmPassword: TEST_USER.password } });
  } catch (err) {
    // User likely already exists; swallow errors to keep tests moving
  }
}

export const test = base.extend({
  loggedInPage: async ({ page, request }, use) => {
    await ensureTestUserExists(request);

    // Log in via UI using the identifier field
    await page.goto('/login');
    await page.fill('#identifier', TEST_USER.username);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');

    const errorBox = page.locator('.bg-red-100');
    if (await errorBox.isVisible()) {
      throw new Error(`LOGIN ERROR: ${await errorBox.innerText()}`);
    }

    // Confirm dashboard is reachable
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    await page.getByRole('heading', { name: 'Dashboard' }).waitFor({ state: 'visible', timeout: 20000 });

    await use(page);
  },
});

export { expect };
