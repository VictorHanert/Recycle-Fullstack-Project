import { test, expect } from './fixtures/auth.js';

test('User can navigate to create product page', async ({ loggedInPage }) => {
  await loggedInPage.click('text=Create Listing');
  await expect(loggedInPage).toHaveURL(/create-product/);
});
