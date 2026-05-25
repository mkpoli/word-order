import { writable } from 'svelte/store';
import { m } from '$lib/paraglide/messages';
import { getLocale, setLocale as setParaglideLocale } from '$lib/paraglide/runtime';
import type { Locales } from './i18n-types';

const createLL = () => ({
	meta: {
		title: m.meta_title,
		description: m.meta_description,
		keywords: m.meta_keywords,
		imageAlt: m.meta_image_alt
	},
	params: {
		options: m.params_options,
		verticalGap: m.params_vertical_gap,
		lineGap: m.params_line_gap,
		lineWidth: m.params_line_width,
		straightLength: m.params_straight_length,
		endpointCorrection: m.params_endpoint_correction,
		curvature: m.params_curvature,
		textAlignment: m.params_text_alignment,
		displayLanguage: m.params_display_language,
		text: m.params_text,
		fontFamily: m.params_font_family,
		default: m.params_default,
		serif: m.params_serif,
		sansSerif: m.params_sans_serif,
		monospace: m.params_monospace,
		fontStyle: m.params_font_style,
		normal: m.params_normal,
		italic: m.params_italic,
		bold: m.params_bold,
		boldItalic: m.params_bold_italic,
		fontSize: m.params_font_size,
		glossFontSize: m.params_gloss_font_size,
		spaceWidth: m.params_space_width,
		letterSpacing: m.params_letter_spacing,
		colors: m.params_colors,
		palette: m.params_palette,
		paletteNames: {
			spectrum: m.params_palette_spectrum,
			pastel: m.params_palette_pastel,
			vivid: m.params_palette_vivid,
			warm: m.params_palette_warm,
			cool: m.params_palette_cool,
			'mono-blue': m.params_palette_mono_blue,
			'mono-warm': m.params_palette_mono_warm
		}
	},
	input: {
		input: m.input_input,
		placeholder: m.input_placeholder,
		add: m.input_add,
		modify: m.input_modify,
		guidance: m.input_guidance,
		gloss: m.input_gloss,
		glossEmpty: m.input_gloss_empty,
		glossPlaceholder: m.input_gloss_placeholder,
		translate: m.input_translate,
		laneAbove: m.input_lane_above,
		laneBelow: m.input_lane_below,
		wordRow: m.input_word_row,
		addLaneAbove: m.input_add_lane_above,
		addLaneBelow: m.input_add_lane_below,
		removeLane: m.input_remove_lane
	},
	tokenEditor: {
		tokens: m.token_editor_tokens,
		mergeSelected: m.token_editor_merge_selected,
		splitAtBoundary: m.token_editor_split_at_boundary,
		selectTokens: m.token_editor_select_tokens
	},
	footer: {
		info: m.footer_info,
		githubRepository: m.footer_github_repository,
		announcement: m.footer_announcement,
		by: m.footer_by
	},
	ui: {
		selected: m.ui_selected
	},
	aria: {
		marginTop: m.aria_margin_top,
		marginBottom: m.aria_margin_bottom,
		marginLeft: m.aria_margin_left,
		marginRight: m.aria_margin_right,
		renameLanguage: m.aria_rename_language
	},
	dialog: {
		editing: m.dialog_editing,
		confirm: m.dialog_confirm,
		cancel: m.dialog_cancel
	},
	confirm: {
		deleteSentence: m.confirm_delete_sentence,
		new: m.confirm_new,
		import: m.confirm_import,
		loadExample: m.confirm_load_example
	},
	menu: {
		new: m.menu_new,
		import: m.menu_import,
		export: m.menu_export,
		share: m.menu_share,
		shareCopied: m.menu_share_copied,
		shareLong: m.menu_share_long,
		shareLongShort: m.menu_share_long_short,
		shareLoadError: m.menu_share_load_error,
		shareLoadErrorDismiss: m.menu_share_load_error_dismiss,
		svg: m.menu_svg,
		png: m.menu_png,
		pdf: m.menu_pdf,
		rasterScale: m.menu_raster_scale,
		scramble: m.menu_scramble,
		about: m.menu_about,
		settings: m.menu_settings,
		translate: m.menu_translate,
		examples: m.menu_examples
	},
	about: {
		title: m.about_title,
		close: m.about_close,
		tagline: m.about_tagline,
		credit: m.about_credit,
		links: m.about_links
	},
	settings: {
		title: m.settings_title,
		close: m.settings_close,
		provider: m.settings_provider,
		model: m.settings_model,
		apiKey: m.settings_api_key,
		show: m.settings_show,
		hide: m.settings_hide,
		keyChecking: m.settings_key_checking,
		keyValid: m.settings_key_valid,
		keyInvalid: m.settings_key_invalid,
		keyNetworkError: m.settings_key_network_error,
		privacy: m.settings_privacy,
		cacheStored: m.settings_cache_stored,
		cacheCleared: m.settings_cache_cleared,
		clearCache: m.settings_clear_cache
	},
	theme: {
		label: m.theme_label,
		themeSystem: m.theme_system,
		themeLight: m.theme_light,
		themeDark: m.theme_dark
	},
	translate: {
		button: m.translate_button,
		title: m.translate_title,
		close: m.translate_close,
		targets: m.translate_targets,
		submit: m.translate_submit,
		busy: m.translate_busy,
		usingProvider: m.translate_using_provider,
		noKey: m.translate_no_key,
		openSettings: m.translate_open_settings,
		tooLong: m.translate_too_long,
		dismissError: m.translate_dismiss_error,
		fromSources: m.translate_from_sources,
		customPlaceholder: m.translate_custom_placeholder,
		addCustom: m.translate_add_custom,
		removeCustom: m.translate_remove_custom,
		cancel: m.translate_cancel,
		retry: m.translate_retry,
		costNotice: m.translate_cost_notice,
		usage: m.translate_usage,
		usageDismiss: m.translate_usage_dismiss
	}
});

export const locale = writable<Locales>(getLocale());
export const LL = writable(createLL());

export function setLocale(newLocale: Locales): void {
	setParaglideLocale(newLocale, { reload: false });
	locale.set(newLocale);
	LL.set(createLL());
}

export default LL;
