import type { BaseTranslation } from '../i18n-types';

const en: BaseTranslation = {
	params: {
		options: 'Options',
		verticalGap: 'Vertical Gap',
		lineGap: 'Line Gap',
		straightLength: 'Straight Part',
		endpointCorrection: 'Endpoint Correction',
		textAlignment: 'Text Alignment',
		displayLanguage: 'Display Language',
		text: 'Text',
		fontFamily: 'Font Family',
		default: 'Default',
		serif: 'Serif',
		sansSerif: 'Sans Serif',
		monospace: 'Monospace',
		fontStyle: 'Font Style',
		normal: 'Normal',
		italic: 'Italic',
		bold: 'Bold',
		boldItalic: 'Bold Italic',
		fontSize: 'Font Size'
	},
	input: {
		input: 'Input',
		placeholder: 'Input new sentence here…',
		add: 'Add',
		modify: 'Modify',
		guidance:
			'Words are split automatically with locale-aware segmentation when available, or by spaces and punctuation as a fallback. Use {delimiter:string} for finer control, e.g. {example:string}'
	},
	tokenEditor: {
		tokens: 'Tokens',
		mergeSelected: 'Merge selected',
		splitAtBoundary: 'Split token at boundary',
		selectTokens: 'Select token(s)'
	},
	footer: {
		info: 'This application does not claim rights over the illustrations you create here. How you use or share them is completely up to you. Sharing this tool is appreciated.'
	},
	dialog: {
		editing: 'Editing',
		confirm: 'Confirm',
		cancel: 'Cancel'
	},
	confirm: {
		deleteSentence: 'Are you sure you want to delete this sentence?',
		new: 'Are you sure you want to create a new illustration? This will DELETE everything!!!'
	},
	menu: {
		new: 'New',
		import: 'Import',
		export: 'Export',
		svg: 'Export SVG',
		png: 'Export PNG',
		scramble: 'Scramble colors'
	}
};

export default en;
