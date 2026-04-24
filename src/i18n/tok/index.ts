import type { Translation } from '../i18n-types';

const tok: Translation = {
	meta: {
		title: 'ilo sitelen pi nasin nimi'
	},
	params: {
		options: 'ante',
		verticalGap: 'weka sewi',
		lineGap: 'weka pi linja tu',
		straightLength: 'suli pi linja pona',
		endpointCorrection: 'o pona e pini linja',
		textAlignment: 'nasin pi lon sitelen',
		displayLanguage: 'toki pi ilo ni',
		text: 'sitelen',
		fontFamily: 'nasin lukin sitelen',
		default: 'nasin open',
		serif: 'sitelen nena',
		sansSerif: 'sitelen pona',
		monospace: 'suli sama',
		fontStyle: 'nasin sitelen',
		normal: 'sama',
		italic: 'sitelen poka',
		bold: 'wawa',
		boldItalic: 'sitelen wawa poka',
		fontSize: 'suli sitelen'
	},
	input: {
		input: 'ma sitelen',
		placeholder: 'o sitelen e toki sin lon ni…',
		add: 'o pana',
		modify: 'o ante',
		guidance:
			'ilo li ken la, ona li kipisi e toki kepeken nasin pi toki ni. ilo li ken ala la, ona li kipisi lon weka pi nimi tu en lon sitelen pini. sina wile kipisi pona la, o kepeken {delimiter}. sama ni: {example}'
	},
	tokenEditor: {
		tokens: 'nimi kipisi',
		mergeSelected: 'o wan e ijo ni',
		splitAtBoundary: 'o tu e ijo lon ni',
		selectTokens: 'o kama jo e nimi'
	},
	footer: {
		info: 'sina pali e sitelen lon ilo ni la, sitelen li tan sina. ilo ni li jo ala e ona. sina ken kepeken sitelen anu pana e sitelen tawa jan ante. sina toki tawa jan ante e ilo ni la, ni li pona tawa mi.',
		githubRepository: 'lipu GitHub',
		announcement: 'lipu toki sin',
		by: 'jan'
	},
	ui: {
		selected: 'ni li lon'
	},
	dialog: {
		editing: 'sina ante e ni',
		confirm: 'pona',
		cancel: 'o pini'
	},
	confirm: {
		deleteSentence: 'sina wile weka e toki ni anu seme?',
		new: 'sina wile pali e sitelen sin anu seme? ni li weka e ijo ale.'
	},
	menu: {
		new: 'sin',
		import: 'o kama jo e lipu',
		export: 'o pana e lipu',
		svg: 'o pana e SVG',
		png: 'o pana e PNG',
		scramble: 'o ante e kule'
	}
};

export default tok;
