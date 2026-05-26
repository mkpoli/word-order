#!/usr/bin/env bun
// Merges Ainu (ain) translations confirmed by mkpoli for the 46 new keys.
// Sources of confidence (highest first):
//   1. mkpoli's direct guidance in chat (tuytuy, keskes, homar, itak ikiri,
//      ukotep, nisite, asir rehe, eykoysampa, imekkore, ukao, méan iro,
//      siwnin, eteskar, nukar, sinna, ranke, SNS).
//   2. Corpus / dictionary cross-checks via the ainu MCP server
//      (perke for "broken", uyna/ranke for "take/drop down", itakpo for
//      "word/particle", sinna for "own/unique" as in `sinna kane aynu puri`).
//   3. Established entries already in ain.json (Uska, Hontomotuye, Siurenkare,
//      A=isamka, Itakpo, Cinuyeuske, Ikorarpe).
//
// Two keys are intentionally NOT included — mkpoli & I agreed to drop them
// from the en source entirely (rename_language_customised_hint and
// rename_language_hint), so they're scheduled for removal in a separate PR.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DIR = 'project.inlang/messages';

const ain: Record<string, string> = {
	// Lines
	params_line_style: 'Ukotep puri',
	params_line_style_solid: 'Nisite',
	params_line_style_dashed: 'Tuytuy',
	params_line_style_dotted: 'Keskes',
	// Text
	params_letter_spacing: 'Itak ikiri uturu',
	// Colours
	params_colors: 'Iro',
	params_palette: 'Iro numke',
	params_palette_spectrum: 'Opitta iro',
	params_palette_pastel: 'Homar',
	params_palette_vivid: 'Ruwe iro',
	params_palette_warm: 'Sesek iro',
	params_palette_cool: 'Méan iro',
	params_palette_mono_blue: 'Siwnin',
	params_palette_mono_warm: 'Sesek',
	// Rename dialog (hint keys deferred — see header)
	aria_rename_language: 'Tan itak rehe a=sinna',
	rename_language_title: 'Itak rehe a=sinna',
	rename_language_close: 'Uska',
	rename_language_default_label: 'Siurenkare rehe',
	rename_language_custom_label: 'Asir rehe',
	rename_language_customised: 'Sinna',
	rename_language_reset: 'Siurenkare ne kar',
	rename_language_cancel: 'Hontomotuye',
	rename_language_save: 'Ukao',
	// Share
	menu_share: 'Cinuyeuske eykoysampa',
	menu_share_copied: 'A=eykoysampa!',
	menu_share_long: 'Itak ikiri {length} — a=tuye p an ruwe ne nankor',
	menu_share_long_short: 'A=eykoysampa (poro URL)',
	menu_share_load_error: 'Cinuyeuske perke',
	menu_share_load_error_dismiss: 'Uska',
	// QR
	menu_qr: 'QR noka',
	menu_qr_title: 'QR noka ari imekkore',
	menu_qr_close: 'Uska',
	menu_qr_link_label: 'Imekkore URL',
	menu_qr_download_svg: 'SVG ranke',
	menu_qr_download_png: 'PNG ranke',
	menu_qr_too_long: 'Sine QR noka or ta a=oma eaykap',
	// Social
	menu_social_section: 'SNS',
	// Settings
	settings_key_checking: 'A=nukar…',
	settings_key_valid: 'Key pirka.',
	settings_key_invalid: 'Ikorarpe tan key etunne.',
	settings_key_network_error: 'Ikorarpe a=eteskar ka eaykap',
	settings_cache_stored: '{count} a=ukao',
	settings_cache_cleared: 'A=isamka.',
	settings_clear_cache: 'Ukaop a=isamka',
	// Token usage
	translate_usage: '{model}: {input} → {output} itakpo',
	translate_usage_dismiss: 'Uska'
};

function sortKeys(obj: Record<string, string>, reference: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const k of reference) if (k in obj) out[k] = obj[k];
	for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
	return out;
}

const en: Record<string, string> = JSON.parse(readFileSync(join(DIR, 'en.json'), 'utf8'));
const enOrder = Object.keys(en);
const file = join(DIR, 'ain.json');
const existing: Record<string, string> = JSON.parse(readFileSync(file, 'utf8'));

let added = 0;
for (const [k, v] of Object.entries(ain)) {
	if (!(k in existing)) {
		existing[k] = v;
		added++;
	}
}

const ordered = sortKeys(existing, enOrder);
writeFileSync(file, JSON.stringify(ordered, null, '\t') + '\n', 'utf8');
console.log(`ain: +${added} keys`);
