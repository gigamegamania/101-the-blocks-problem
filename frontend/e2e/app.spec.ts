import { test, expect } from '@playwright/test';

test.describe('Technical Test App E2E', () => {
  test('should display the app, type into textarea and show response', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Technical Test App' })).toBeVisible();

    let textarea = page.getByPlaceholder('Type something...');
    await expect(textarea).toBeVisible();

    // Test with blocks problem input
    const blocksInput = `4
move 3 onto 1
move 2 over 1
pile 0 onto 1
quit`;
    await textarea.fill(blocksInput);

    // Wait for any response to appear (the solution will vary but should contain numbers and colons)
    await expect(page.locator('.result'))
      .toBeVisible({ timeout: 5000 });

    // Verify response contains expected format (line with "0:" or similar)
    const response = page.locator('.result pre');
    await expect(response).toContainText('0:');
  });

  test('should not display response when input is empty', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    await textarea.clear();

    await expect(page.locator('.result')).not.toBeVisible();
  });
});
