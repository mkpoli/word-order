import { expect, test } from '@playwright/test';

test('index page has expected footer', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('footer')).toBe('Word Order Illustrator');
});
