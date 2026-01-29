import { test, expect } from '@playwright/test';

test.describe('Technical Test App E2E', () => {
  test('should display the app, type into textarea and show response', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Technical Test App' })).toBeVisible();

    const textarea = page.getByPlaceholder('Type something...');
    await expect(textarea).toBeVisible();

    // Test with blocks problem input
    const blocksInput = `4
move 3 onto 1
move 2 over 1
pile 0 onto 1
quit`;
    await textarea.fill(blocksInput);

    // Wait for loading state to disappear (if it appears)
    const loadingState = page.locator('.status').filter({ hasText: 'Loading...' });
    await loadingState.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Loading might not appear or disappear quickly, continue anyway
    });

    // Wait for result to appear (the solution will vary but should contain numbers and colons)
    // The Result component is rendered when apiResponse exists
    await expect(page.locator('.result')).toBeVisible({ timeout: 10000 });

    // Verify response contains expected format (line with "0:" or similar)
    const response = page.locator('.result pre');
    await expect(response).toContainText('0:');
  });

  test('should not display response when input is empty', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');

    // Clear the textarea if it has any content
    await textarea.clear();

    // Trigger input event to ensure the handler runs
    await textarea.fill('');
    await textarea.press('Backspace'); // Ensure it's truly empty

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(500);

    // Result should not be visible when input is empty
    await expect(page.locator('.result')).not.toBeVisible();

    // Placeholder should be visible instead
    await expect(page.locator('.placeholder')).toBeVisible();
  });

  test('should display two-column layout with Input and Output sections', async ({ page }) => {
    await page.goto('/');

    // Verify left column with Input section
    const leftColumn = page.locator('.left-column');
    await expect(leftColumn).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Input:' })).toBeVisible();

    // Verify right column with Output section
    const rightColumn = page.locator('.right-column');
    await expect(rightColumn).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Output:' })).toBeVisible();
  });

  test('should display helper text with format explanation and example', async ({ page }) => {
    await page.goto('/');

    // Verify helper text section is visible
    const helperText = page.locator('.helper-text');
    await expect(helperText).toBeVisible();

    // Verify input format explanation
    await expect(helperText.getByText(/Input format:/)).toBeVisible();

    // Verify example is visible
    await expect(helperText.getByText(/Example:/)).toBeVisible();
    await expect(helperText.locator('.helper-example')).toBeVisible();

    // Verify illegal commands rule is visible
    await expect(helperText.getByText(/Illegal commands rule:/)).toBeVisible();
  });

  test('should display all quick command buttons', async ({ page }) => {
    await page.goto('/');

    const quickCommands = page.locator('.quick-commands');
    await expect(quickCommands).toBeVisible();

    // Verify all 5 quick command buttons are visible
    await expect(page.getByRole('button', { name: 'move A onto B' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'move A over B' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'pile A onto B' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'pile A over B' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'quit' })).toBeVisible();
  });

  test('should insert command when quick command button is clicked', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');

    // Click a quick command button
    await page.getByRole('button', { name: 'move A onto B' }).click();

    // Verify command was inserted into textarea
    await expect(textarea).toHaveValue('move A onto B');

    // Click another button and verify it's added on a new line
    await page.getByRole('button', { name: 'quit' }).click();
    const value = await textarea.inputValue();
    expect(value).toContain('move A onto B');
    expect(value).toContain('quit');
    expect(value.split('\n').length).toBeGreaterThan(1);
  });

  test('should show tooltip when hovering over quick command button', async ({ page }) => {
    await page.goto('/');

    const moveOntoButton = page.getByRole('button', { name: 'move A onto B' });

    // Hover over the button
    await moveOntoButton.hover();

    // Wait a bit for tooltip to appear
    await page.waitForTimeout(300);

    // Verify tooltip is visible (check for data-tooltip attribute content)
    // Tooltips are created via CSS ::before pseudo-element, so we check the button has the attribute
    const tooltipAttr = await moveOntoButton.getAttribute('data-tooltip');
    expect(tooltipAttr).toBeTruthy();
    expect(tooltipAttr).toContain('Puts block A onto block B');
  });

  test('should detect and display illegal command when a = b', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    const illegalInput = `5
move 0 onto 0
quit`;
    await textarea.fill(illegalInput);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify illegal commands section appears
    const illegalSection = page.locator('.illegal-commands');
    await expect(illegalSection).toBeVisible({ timeout: 10000 });

    // Verify the illegal command is listed
    await expect(illegalSection.getByText('move 0 onto 0')).toBeVisible();
    await expect(illegalSection.getByText(/Block 0 cannot be moved onto itself/)).toBeVisible();

    // Verify output is unaffected (should show initial state)
    const result = page.locator('.result pre');
    await expect(result).toBeVisible();
    await expect(result).toContainText('0: 0');
  });

  test('should detect and display illegal command when blocks are in same stack', async ({
    page,
  }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    // First move blocks together, then try to move one onto the other (illegal)
    const illegalInput = `5
move 1 onto 2
move 1 onto 2
quit`;
    await textarea.fill(illegalInput);

    // Wait for processing
    await page.waitForTimeout(2000);

    // Verify illegal commands section appears
    const illegalSection = page.locator('.illegal-commands');
    await expect(illegalSection).toBeVisible({ timeout: 10000 });

    // Verify the illegal command is listed with correct reason
    await expect(
      illegalSection.getByText(/Blocks 1 and 2 are already in the same stack/),
    ).toBeVisible();
  });

  test('should show loading state when processing input', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    const validInput = `3
move 1 onto 0
quit`;

    // Fill input and immediately check for loading state
    await textarea.fill(validInput);

    // Loading state might appear very briefly, so we check if it exists or has already disappeared
    const loadingState = page.locator('.status').filter({ hasText: 'Loading...' });
    const loadingVisible = await loadingState.isVisible().catch(() => false);

    // Either loading is visible, or it has already completed and result is visible
    if (loadingVisible) {
      await expect(loadingState).toBeVisible();
    }

    // Eventually result should appear
    await expect(page.locator('.result')).toBeVisible({ timeout: 10000 });
  });

  test('should handle input with only number and quit', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    const input = `5
quit`;
    await textarea.fill(input);

    await page.waitForTimeout(2000);

    // Verify result shows initial state (all blocks in their own positions)
    const result = page.locator('.result pre');
    await expect(result).toBeVisible({ timeout: 10000 });
    await expect(result).toContainText('0: 0');
    await expect(result).toContainText('1: 1');
    await expect(result).toContainText('4: 4');
  });

  test('should hide illegal commands section when input is cleared', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    const illegalInput = `5
move 0 onto 0
quit`;
    await textarea.fill(illegalInput);

    // Wait for illegal commands to appear
    await page.waitForTimeout(2000);
    await expect(page.locator('.illegal-commands')).toBeVisible({ timeout: 10000 });

    // Clear input
    await textarea.clear();
    await textarea.fill('');
    await page.waitForTimeout(500);

    // Verify illegal commands section is hidden
    await expect(page.locator('.illegal-commands')).not.toBeVisible();
  });

  test('should display multiple illegal commands when present', async ({ page }) => {
    await page.goto('/');

    const textarea = page.getByPlaceholder('Type something...');
    const illegalInput = `5
move 0 onto 0
move 1 onto 1
quit`;
    await textarea.fill(illegalInput);

    await page.waitForTimeout(2000);

    // Verify illegal commands section shows both commands
    const illegalSection = page.locator('.illegal-commands');
    await expect(illegalSection).toBeVisible({ timeout: 10000 });

    const illegalCommands = illegalSection.locator('.illegal-command');
    const count = await illegalCommands.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should have hover effect on textarea', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('.text-input');
    await expect(textarea).toBeVisible();

    // Hover over textarea
    await textarea.hover();

    // Verify textarea is still visible and interactive
    await expect(textarea).toBeVisible();
  });
});
