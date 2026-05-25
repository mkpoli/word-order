import { writable } from 'svelte/store';

export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'word-order:theme';

function readInitial(): ThemePref {
	if (typeof window === 'undefined') return 'system';
	const stored = window.localStorage.getItem(STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function apply(pref: ThemePref) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	if (pref === 'system') root.removeAttribute('data-theme');
	else root.setAttribute('data-theme', pref);

	if (typeof window === 'undefined') return;
	if (pref === 'system') window.localStorage.removeItem(STORAGE_KEY);
	else window.localStorage.setItem(STORAGE_KEY, pref);
}

function createThemeStore() {
	const initial = readInitial();
	const { subscribe, set } = writable<ThemePref>(initial);

	return {
		subscribe,
		set(next: ThemePref) {
			apply(next);
			set(next);
		}
	};
}

export const themePref = createThemeStore();
