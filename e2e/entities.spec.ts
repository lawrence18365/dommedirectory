import { test, expect } from '@playwright/test';

test.describe('Entity CRUD Flows', () => {
  test('blog page loads with posts or empty state', async ({ page }) => {
    await page.goto('/blog');
    
    // Blog page should load
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('blog category page loads', async ({ page }) => {
    await page.goto('/blog/category/test-category');
    
    // Should show category content or not found
    await expect(page.locator('body')).toBeVisible();
  });

  test('blog tag page loads', async ({ page }) => {
    await page.goto('/blog/tag/test-tag');
    
    // Should show tag content or not found
    await expect(page.locator('body')).toBeVisible();
  });

  test('individual blog post page loads', async ({ page }) => {
    await page.goto('/blog/test-post');
    
    // Should show post or not found
    await expect(page.locator('body')).toBeVisible();
  });

  test('cities page loads', async ({ page }) => {
    await page.goto('/cities');
    
    // Smoke check only: page should render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('location page loads', async ({ page }) => {
    await page.goto('/location/test-city');
    
    // Location detail page
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin & Verification Flows', () => {
  test('admin blog page requires authentication', async ({ page }) => {
    await page.goto('/admin/blog');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('admin categories page requires authentication', async ({ page }) => {
    await page.goto('/admin/blog/categories');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('admin tags page requires authentication', async ({ page }) => {
    await page.goto('/admin/blog/tags');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('verification page loads', async ({ page }) => {
    await page.goto('/verification');
    
    // Verification page should load
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('admin verifications page requires authentication', async ({ page }) => {
    await page.goto('/admin/verifications');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });
});

test.describe('Utility Pages', () => {
  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('help page loads', async ({ page }) => {
    await page.goto('/help');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('404 page loads for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await expect(page.locator('body')).toBeVisible();
  });
});
