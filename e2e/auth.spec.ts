import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('homepage loads and shows login/register buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check main content loads
    await expect(page.getByRole('heading', { name: /featured listings near me/i })).toBeVisible();
    
    // Check auth CTA exists
    await expect(page.getByRole('link', { name: /sign up|register/i }).first()).toBeVisible();
  });

  test('login page loads with form', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check form elements
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    
    // Check register link in the form ("Don't have an account? Sign Up" link)
    await expect(page.getByRole('link', { name: /don't have an account/i })).toBeVisible();
  });

  test('register page loads with form', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check form elements - register page uses h1 with specific text
    await expect(page.locator('h1').filter({ hasText: /Create Your Account/i })).toBeVisible();
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up|create account/i })).toBeVisible();
  });

  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('settings redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/settings');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
  });
});
