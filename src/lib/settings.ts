import { writable } from 'svelte/store';

export type ProviderId = 'openai' | 'anthropic' | 'gemini';

export type LlmSettings = {
	provider: ProviderId;
	model: string;
	keys: Partial<Record<ProviderId, string>>;
};

const STORAGE_PREFIX = 'wo:llm';
const PROVIDER_KEY = `${STORAGE_PREFIX}:provider`;
const MODEL_KEY = `${STORAGE_PREFIX}:model`;
const apiKeyStorageKey = (provider: ProviderId) => `${STORAGE_PREFIX}:key:${provider}`;

const PROVIDER_IDS: ProviderId[] = ['openai', 'anthropic', 'gemini'];

const DEFAULT_SETTINGS: LlmSettings = {
	provider: 'openai',
	model: '',
	keys: {}
};

function readInitialSettings(): LlmSettings {
	if (typeof window === 'undefined') return DEFAULT_SETTINGS;

	const storedProvider = window.localStorage.getItem(PROVIDER_KEY);
	const provider = PROVIDER_IDS.includes(storedProvider as ProviderId) ? (storedProvider as ProviderId) : DEFAULT_SETTINGS.provider;
	const model = window.localStorage.getItem(MODEL_KEY) ?? '';
	const keys: Partial<Record<ProviderId, string>> = {};
	for (const id of PROVIDER_IDS) {
		const value = window.localStorage.getItem(apiKeyStorageKey(id));
		if (value) keys[id] = value;
	}
	return { provider, model, keys };
}

function createSettingsStore() {
	const store = writable<LlmSettings>(readInitialSettings());
	const { subscribe, update, set } = store;

	function persistAll(settings: LlmSettings) {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem(PROVIDER_KEY, settings.provider);
		window.localStorage.setItem(MODEL_KEY, settings.model);
		for (const id of PROVIDER_IDS) {
			const value = settings.keys[id];
			const storageKey = apiKeyStorageKey(id);
			if (value) window.localStorage.setItem(storageKey, value);
			else window.localStorage.removeItem(storageKey);
		}
	}

	return {
		subscribe,
		set(next: LlmSettings) {
			persistAll(next);
			set(next);
		},
		setProvider(provider: ProviderId) {
			update((current) => {
				const next = { ...current, provider };
				if (typeof window !== 'undefined') window.localStorage.setItem(PROVIDER_KEY, provider);
				return next;
			});
		},
		setModel(model: string) {
			update((current) => {
				const next = { ...current, model };
				if (typeof window !== 'undefined') window.localStorage.setItem(MODEL_KEY, model);
				return next;
			});
		},
		setKey(provider: ProviderId, key: string) {
			update((current) => {
				const keys = { ...current.keys };
				if (key) keys[provider] = key;
				else delete keys[provider];
				if (typeof window !== 'undefined') {
					const storageKey = apiKeyStorageKey(provider);
					if (key) window.localStorage.setItem(storageKey, key);
					else window.localStorage.removeItem(storageKey);
				}
				return { ...current, keys };
			});
		}
	};
}

export const llmSettings = createSettingsStore();

export function hasKey(settings: LlmSettings, provider: ProviderId = settings.provider): boolean {
	return Boolean(settings.keys[provider]);
}
