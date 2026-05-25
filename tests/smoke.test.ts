/**
 * Smoke tests that catch real regressions check/lint/build can't:
 * - Hydration errors / broken event handlers (theme toggle, dialogs).
 * - Wiring breaks in the export menu.
 * - Theme system: data-theme attribute flips, output canvas stays light
 *   in both themes (regression: the canvas was briefly being themed by
 *   the page palette during the dark-mode work).
 */
import { expect, test } from '@playwright/test';

test('page loads without console errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
	});

	await page.goto('/');
	await page.waitForLoadState('networkidle');

	expect(errors, errors.join('\n')).toEqual([]);
});

test('theme toggle cycles system → light → dark', async ({ page }) => {
	await page.addInitScript(() => {
		try {
			localStorage.removeItem('word-order:theme');
		} catch {
			// localStorage may be unavailable in some browser contexts; non-fatal.
		}
	});
	await page.goto('/');

	const html = page.locator('html');
	const toggle = page.locator('button.theme-toggle');

	await expect(toggle).toBeVisible();
	await expect(html).not.toHaveAttribute('data-theme', /.+/); // system → no attribute

	await toggle.click(); // → light
	await expect(html).toHaveAttribute('data-theme', 'light');

	await toggle.click(); // → dark
	await expect(html).toHaveAttribute('data-theme', 'dark');

	await toggle.click(); // → system
	await expect(html).not.toHaveAttribute('data-theme', /.+/);
});

test('output canvas stays light in both themes (export consistency)', async ({ page }) => {
	await page.goto('/');
	// Wait for SvelteKit hydration to mount the Output component; the page's
	// `{#if mounted}` gate means querySelector('output') returns null until
	// onMount finishes its async work.
	await page.waitForSelector('output');

	for (const theme of ['light', 'dark'] as const) {
		await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
		const canvasBg = await page.evaluate(() => {
			const el = document.querySelector('output');
			return el ? getComputedStyle(el).backgroundColor : null;
		});
		expect(canvasBg, `output canvas bg in ${theme} theme`).toBe('rgb(255, 255, 255)');
	}
});

test('settings dialog opens and closes', async ({ page }) => {
	await page.goto('/');

	const trigger = page.locator('button.about-button[aria-label="Settings"]');
	await trigger.click();
	const dialog = page.locator('[role="dialog"][aria-labelledby="settings-title"]');
	await expect(dialog).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();
});

test('export menu opens with the format buttons', async ({ page }) => {
	await page.goto('/');

	// Dropdown opens on hover *or* click; hover is the more reliable trigger
	// here since click can race with the mouseleave handler.
	await page.locator('.export-dropdown').hover();

	const menu = page.locator('.export-menu');
	await expect(menu).toBeVisible();
	for (const fmt of ['JSON', 'SVG', 'PNG', 'PDF', 'HTML']) {
		await expect(menu.getByRole('button', { name: fmt, exact: true })).toBeVisible();
	}
});
