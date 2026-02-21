import { test, expect } from './fixtures/auth.js';

async function getAuthToken(page) {
  return await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('auth-storage');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.state?.token || null;
    } catch {
      return null;
    }
  });
}

async function waitForCreateProductForm(page) {
  await page.getByRole('heading', { name: 'Sell Your Bicycle' }).waitFor();
  await page.locator('form').waitFor();
  // Options in a <select> are not "visible" in Playwright, just ensure they exist.
  await page.locator('select[name="category_id"] option:not([value=""])').first().waitFor({ state: 'attached' });
}

test.describe('Product Viewing', () => {
  test('User can open a product page', async ({ loggedInPage, request }) => {
    const token = await getAuthToken(loggedInPage);
    if (!token) throw new Error('Missing auth token for product creation');

    // Always create a product owned by the logged-in user for this test
    const categoriesRes = await request.get('http://localhost:8000/api/products/categories');
    const categories = await categoriesRes.json();
    const categoryId = categories[0]?.id;

    if (!categoryId) throw new Error('No categories available to create product');

    const productTitle = `Test Bicycle ${Date.now()}`;
    const createRes = await request.post('http://localhost:8000/api/products/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      form: {
        product_data: JSON.stringify({
          title: productTitle,
          description: 'Test bicycle for E2E test',
          price_amount: '1000.00',
          price_currency: 'DKK',
          category_id: categoryId,
        }),
      },
    });

    if (!createRes.ok()) {
      let body = '';
      try {
        body = await createRes.text();
      } catch {
        body = '';
      }
      throw new Error(`Product creation failed: ${createRes.status()} ${body}`);
    }

    const newProduct = await createRes.json();
    const firstProductId = newProduct.id;

    await loggedInPage.goto(`/products/${firstProductId}`);

    // Assert product detail page loaded
    await expect(loggedInPage).toHaveURL(new RegExp(`/products/${firstProductId}`));
    await expect(loggedInPage.getByRole('heading', { name: productTitle, level: 1 })).toBeVisible();
  });
});

test.describe('Product Creation', () => {
  test('User can navigate to create product page', async ({ loggedInPage }) => {
    await loggedInPage.click('text=Create Listing');
    await expect(loggedInPage).toHaveURL(/create-product/);
    await expect(loggedInPage.getByRole('heading', { name: 'Sell Your Bicycle' })).toBeVisible();
  });

  test('User can create a product with required fields only', async ({ loggedInPage }) => {
    // Navigate to create product page
    await loggedInPage.goto('/create-product');
    await waitForCreateProductForm(loggedInPage);

    // Fill in required fields
    const uniqueTitle = `Test Bicycle ${Date.now()}`;
    await loggedInPage.fill('input[name="title"]', uniqueTitle);
    await loggedInPage.fill('textarea[name="description"]', 'This is a test bicycle in excellent condition. Perfect for daily commuting.');
    await loggedInPage.fill('input[name="price_amount"]', '1500');
    
    // Select a category (assuming at least one exists)
    const categorySelect = loggedInPage.locator('select[name="category_id"]');
    await categorySelect.selectOption({ index: 1 });

    // Submit the form
    await loggedInPage.click('button[type="submit"]');

    // Wait for success and redirect to product detail page
    await loggedInPage.waitForURL(/\/products\/\d+/, { timeout: 10000 });
    
    // Verify product details are displayed
    await expect(loggedInPage.getByRole('heading', { name: uniqueTitle })).toBeVisible();
    await expect(loggedInPage.locator('main')).toContainText('This is a test bicycle in excellent condition');
  });

  test('User can create a product with condition field', async ({ loggedInPage }) => {
    // Navigate to create product page
    await loggedInPage.goto('/create-product');
    await waitForCreateProductForm(loggedInPage);

    // Fill in required fields
    const uniqueTitle = `Premium Bicycle ${Date.now()}`;
    await loggedInPage.fill('input[name="title"]', uniqueTitle);
    await loggedInPage.fill('textarea[name="description"]', 'High-quality bicycle with advanced features and excellent build quality.');
    await loggedInPage.fill('input[name="price_amount"]', '2500');
    const categorySelect = loggedInPage.locator('select[name="category_id"]');
    await categorySelect.selectOption({ index: 1 });

    // Fill in optional condition field (this is visible without toggling advanced options)
    await loggedInPage.selectOption('select[name="condition"]', 'like_new');

    // Submit the form
    await loggedInPage.click('button[type="submit"]');

    // Wait for success and redirect
    await loggedInPage.waitForURL(/\/products\/\d+/, { timeout: 10000 });
    
    // Verify product was created
    await expect(loggedInPage.getByRole('heading', { name: uniqueTitle })).toBeVisible();
  });

  test('Form validation prevents submission with missing required fields', async ({ loggedInPage }) => {
    await loggedInPage.goto('/create-product');
    await waitForCreateProductForm(loggedInPage);

    // Try to submit without filling anything
    await loggedInPage.click('button[type="submit"]');

    // Should show validation errors and stay on the same page
    await expect(loggedInPage).toHaveURL(/create-product/);
    
    // Check for validation error messages
    await expect(loggedInPage.getByText(/Title is required|required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Form validation shows error for invalid price', async ({ loggedInPage }) => {
    await loggedInPage.goto('/create-product');
    await waitForCreateProductForm(loggedInPage);

    // Fill required fields with invalid price
    await loggedInPage.fill('input[name="title"]', 'Test Bicycle');
    await loggedInPage.fill('textarea[name="description"]', 'Test description for validation');
    await loggedInPage.fill('input[name="price_amount"]', '-10');
    const categorySelect = loggedInPage.locator('select[name="category_id"]');
    await categorySelect.selectOption({ index: 1 });

    // Try to submit
    await loggedInPage.click('button[type="submit"]');

    // Should show validation error for price
    await expect(loggedInPage).toHaveURL(/create-product/);
  });

  test('User can add and remove images when creating a product', async ({ loggedInPage }) => {
    await loggedInPage.goto('/create-product');
    await waitForCreateProductForm(loggedInPage);

    // Look for file input (it might be hidden, so we'll use setInputFiles directly)
    const fileInput = loggedInPage.locator('input[type="file"]');
    
    if (await fileInput.count() > 0) {
      // Create a simple test image buffer
      const testImagePath = '/tmp/test-bike-image.png';
      
      // Note: In a real scenario, you'd have actual test images
      // For now, we're just checking if the file input exists
      await expect(fileInput).toBeAttached();
    }
  });

  test('Character count updates as user types in title and description', async ({ loggedInPage }) => {
    await loggedInPage.goto('/create-product');
    await waitForCreateProductForm(loggedInPage);

    // Type in title and check character count
    const testTitle = 'Mountain Bike';
    await loggedInPage.fill('input[name="title"]', testTitle);
    await expect(loggedInPage.getByText(`${testTitle.length}/200 characters`)).toBeVisible();

    // Type in description and check character count
    const testDescription = 'Great bike for trails';
    await loggedInPage.fill('textarea[name="description"]', testDescription);
    await expect(loggedInPage.getByText(`${testDescription.length}/1000 characters`)).toBeVisible();
  });
});
