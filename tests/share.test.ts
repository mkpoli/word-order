/**
 * End-to-end coverage for the URL share feature. Goes through the actual UI
 * (Copy link button → address bar → reload) instead of importing internals,
 * because Vite preview serves bundles rather than source files.
 */
import { expect, test } from '@playwright/test';

test.describe('URL share', () => {
	test('round-trip: Copy link → reload → same diagram', async ({ page, context }) => {
		// Clipboard read permission so the copy button can write and we can verify.
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		await page.goto('/');
		// Capture an identifying string from the default sample diagram to compare against.
		const defaultMarker = await page.locator('output').textContent();
		expect(defaultMarker).toBeTruthy();
		expect(defaultMarker).toMatch(/eat\s*glass/);

		// Copy link now lives inside the Export dropdown — focusing the trigger
		// opens the menu (it expands on focus and hover).
		await page.getByRole('button', { name: /Export/i }).focus();
		// Trigger the Copy link button.
		await page.getByRole('button', { name: /Copy link|Copied/i }).click();
		// Wait for the share handler to finish — it writes to the clipboard,
		// then calls history.replaceState. Either signal will do.
		await expect.poll(() => page.url(), { timeout: 5000 }).toMatch(/#d=[tcu]\./);
		const shared = page.url();
		expect(shared.length).toBeGreaterThan(80);

		// Open a fresh browsing context to ensure the diagram comes ONLY from the URL,
		// not from localStorage. Navigate to the share URL.
		const fresh = await context.browser()!.newContext();
		try {
			const freshPage = await fresh.newPage();
			await freshPage.goto(shared);
			await freshPage.waitForSelector('output');
			const restored = await freshPage.locator('output').textContent();
			expect(restored).toMatch(/eat\s*glass/);
		} finally {
			await fresh.close();
		}
	});

	test('broken share URL shows a load-error toast and falls back', async ({ page }) => {
		// Garbage payload — the tag is valid, the base64 is not.
		await page.goto('/#d=t.not~~real~~payload');
		const toast = page.locator('.share-load-error');
		await expect(toast).toBeVisible();
		await expect(toast).toContainText(/broken/i);

		// Diagram still rendered (fell back to the sample).
		await expect(page.locator('output')).toContainText(/eat\s*glass/);

		// Dismissing the toast hides it.
		await toast.locator('button.dismiss').click();
		await expect(toast).not.toBeVisible();
	});
});
