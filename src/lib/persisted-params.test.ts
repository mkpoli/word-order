import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { loadParams, saveParams, PARAMS_STORAGE_KEY } from './persisted-params';

type Store = Record<string, string>;
type LocalStorageStub = {
	getItem: (k: string) => string | null;
	setItem: (k: string, v: string) => void;
	removeItem: (k: string) => void;
	clear: () => void;
};

// Cast the global window into a shape persisted-params will accept.
// bun's @types/bun provides DOM-like globals, but we don't need a full
// Window — only the localStorage shape.
type WindowShim = { localStorage: LocalStorageStub };
const g = globalThis as unknown as { window?: WindowShim };

function installLocalStorageStub(): LocalStorageStub {
	const store: Store = {};
	const stub: LocalStorageStub = {
		getItem: (k) => (k in store ? store[k] : null),
		setItem: (k, v) => {
			store[k] = String(v);
		},
		removeItem: (k) => {
			delete store[k];
		},
		clear: () => {
			for (const k of Object.keys(store)) delete store[k];
		}
	};
	g.window = { localStorage: stub };
	return stub;
}

function uninstallLocalStorageStub() {
	delete g.window;
}

describe('persisted-params', () => {
	beforeEach(() => {
		installLocalStorageStub();
	});

	afterEach(() => {
		uninstallLocalStorageStub();
	});

	test('loadParams returns {} when storage is empty', () => {
		expect(loadParams()).toEqual({});
	});

	test('save then load round-trips all fields', () => {
		const snapshot = {
			verticalGap: 30,
			lineGap: 5,
			lineWidth: 1.5,
			lineStyle: 'dashed' as const,
			fontSize: 18,
			palette: 'pastel' as const,
			rasterScale: 3,
			outputMargin: { top: 10, right: 20, bottom: 30, left: 40 }
		};
		saveParams(snapshot);
		expect(loadParams()).toEqual(snapshot);
	});

	test('corrupt JSON returns empty / falls through to legacy', () => {
		g.window!.localStorage.setItem(PARAMS_STORAGE_KEY, '{not json}');
		expect(loadParams()).toEqual({});
	});

	test('legacy keys are migrated when the new key is absent', () => {
		const ls = g.window!.localStorage;
		ls.setItem('word-order:palette', 'vivid');
		ls.setItem('word-order:line-style', 'dotted');
		ls.setItem('word-order:raster-scale', '4');
		const params = loadParams();
		expect(params.palette).toBe('vivid');
		expect(params.lineStyle).toBe('dotted');
		expect(params.rasterScale).toBe(4);
	});

	test('non-numeric raster-scale legacy is ignored', () => {
		g.window!.localStorage.setItem('word-order:raster-scale', 'not-a-number');
		expect(loadParams().rasterScale).toBeUndefined();
	});

	test('new key wins over legacy keys when both exist', () => {
		g.window!.localStorage.setItem('word-order:palette', 'vivid');
		saveParams({ palette: 'pastel' });
		expect(loadParams().palette).toBe('pastel');
	});

	test('saveParams swallows storage errors silently', () => {
		g.window!.localStorage.setItem = () => {
			throw new Error('quota exceeded');
		};
		expect(() => saveParams({ palette: 'cool' })).not.toThrow();
	});
});
