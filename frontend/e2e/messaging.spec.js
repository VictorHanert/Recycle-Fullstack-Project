import { test, expect } from './fixtures/auth.js';

test('User can open a product page', async ({ loggedInPage, request }) => {
  // Fetch a real product id to avoid clicking random nav links
  const res = await request.get('http://localhost:8000/api/products?page=1&size=1');
  const data = await res.json();
  const firstProductId = data?.products?.[0]?.id;
  if (!firstProductId) throw new Error('No products returned from API');

  await loggedInPage.goto(`/products/${firstProductId}`);

  // Assert product detail page loaded
  await expect(loggedInPage).toHaveURL(new RegExp(`/products/${firstProductId}`));
  await expect(loggedInPage.getByRole('heading', { level: 1 })).toBeVisible();
});
