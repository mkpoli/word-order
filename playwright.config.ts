import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	// Restrict to the dedicated tests/ folder so unit tests living under
	// src/**/*.test.ts (run by `bun test`) aren't picked up by playwright.
	testDir: 'tests',
	webServer: {
		command: 'bun run build && bun run preview',
		port: 4173
	}
};

export default config;
