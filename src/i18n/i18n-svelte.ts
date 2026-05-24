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
		spaceWidth: m.params_space_width
	},
	input: {
		input: m.input_input,
		placeholder: m.input_placeholder,
		add: m.input_add,
		modify: m.input_modify,
		guidance: m.input_guidance,
		gloss: m.input_gloss,
		glossEmpty: m.input_gloss_empty,
		glossPlaceholder: m.input_gloss_placeholder
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
		svg: m.menu_svg,
		png: m.menu_png,
		pdf: m.menu_pdf,
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
		tagline: m.settings_tagline,
		provider: m.settings_provider,
		model: m.settings_model,
		apiKey: m.settings_api_key,
		show: m.settings_show,
		hide: m.settings_hide,
		privacy: m.settings_privacy
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
		cancel: m.translate_cancel
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
