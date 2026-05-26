/**
 * Single-key localStorage snapshot of every appearance / parameter knob in
 * the app, so a refresh restores the user's whole setup — not just the
 * couple of fields (rasterScale, palette, lineStyle) that used to have
 * dedicated keys.
 *
 * The schema is intentionally partial: missing fields fall through to the
 * caller's defaults instead of forcing a migration on every parameter add.
 * Legacy keys are migrated transparently on first read, then overwritten
 * by the unified snapshot.
 */
import type { Alignment, FontFamily, FontStyle, LineStyle, Margin } from './types';
import type { PaletteId } from './color';

export const PARAMS_STORAGE_KEY = 'word-order:params';

const LEGACY_PALETTE_KEY = 'word-order:palette';
const LEGACY_LINE_STYLE_KEY = 'word-order:line-style';
const LEGACY_RASTER_SCALE_KEY = 'word-order:raster-scale';

export type ParamsSnapshot = {
	// Connector lines
	verticalGap?: number;
	lineGap?: number;
	lineWidth?: number;
	lineStyle?: LineStyle;
	lineHalo?: boolean;
	lineHaloWidth?: number;
	tokenGap?: number;
	showLangMeta?: boolean;
	straightLength?: number;
	endpointCorrection?: number;
	curvature?: number;
	// Text
	alignment?: Alignment;
	fontFamily?: FontFamily;
	fontStyle?: FontStyle;
	fontSize?: number;
	glossFontSize?: number;
	spaceWidth?: number;
	letterSpacing?: number;
	// Colours
	palette?: PaletteId;
	// Export / canvas
	rasterScale?: number;
	outputMargin?: Margin;
};

export function loadParams(): ParamsSnapshot {
	if (typeof window === 'undefined') return {};
	try {
		const raw = window.localStorage.getItem(PARAMS_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') return parsed as ParamsSnapshot;
		}
	} catch {
		// Corrupt JSON shouldn't crash the app — fall through to legacy/empty.
	}
	return readLegacy();
}

export function saveParams(p: ParamsSnapshot): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(p));
	} catch {
		// Quota exceeded / private-mode failure — silently drop the write
		// rather than crashing the reactive saveDoc effect on every change.
	}
}

function readLegacy(): ParamsSnapshot {
	const out: ParamsSnapshot = {};
	const palette = window.localStorage.getItem(LEGACY_PALETTE_KEY);
	if (palette) out.palette = palette as PaletteId;
	const lineStyle = window.localStorage.getItem(LEGACY_LINE_STYLE_KEY);
	if (lineStyle) out.lineStyle = lineStyle as LineStyle;
	const rasterScaleRaw = window.localStorage.getItem(LEGACY_RASTER_SCALE_KEY);
	const rasterScale = Number(rasterScaleRaw);
	if (rasterScaleRaw && !Number.isNaN(rasterScale)) out.rasterScale = rasterScale;
	return out;
}
