import type { Translation } from '../i18n-types';

const de: Translation = {
	meta: {
		title: 'Wortstellungs-Illustrator'
	},
	params: {
		options: 'Optionen',
		verticalGap: 'Vertikaler Abstand',
		lineGap: 'Linienabstand',
		straightLength: 'Gerader Abschnitt',
		endpointCorrection: 'Endpunktkorrektur',
		textAlignment: 'Textausrichtung',
		displayLanguage: 'Anzeigesprache',
		text: 'Text',
		fontFamily: 'Schriftfamilie',
		default: 'Standard',
		serif: 'Serif',
		sansSerif: 'Sans Serif',
		monospace: 'Monospace',
		fontStyle: 'Schriftstil',
		normal: 'Normal',
		italic: 'Kursiv',
		bold: 'Fett',
		boldItalic: 'Fett kursiv',
		fontSize: 'Schriftgroesse'
	},
	input: {
		input: 'Eingabe',
		placeholder: 'Gib hier einen neuen Satz ein…',
		add: 'Hinzufugen',
		modify: 'Bearbeiten',
		guidance:
			'Worter werden automatisch sprachspezifisch segmentiert, wenn dies verfugbar ist, sonst anhand von Leerzeichen und Satzzeichen. Fur feinere Kontrolle verwende {delimiter}, zum Beispiel {example}'
	},
	tokenEditor: {
		tokens: 'Token',
		mergeSelected: 'Auswahl zusammenfugen',
		splitAtBoundary: 'Token an dieser Stelle teilen',
		selectTokens: 'Wahle ein oder mehrere Token aus'
	},
	footer: {
		info: 'Diese Anwendung beansprucht keine Rechte an den Illustrationen, die du hier erstellst. Wie du sie nutzt oder teilst, bleibt vollstandig dir uberlassen. Das Teilen dieses Werkzeugs wird geschatzt.',
		githubRepository: 'GitHub-Repository',
		announcement: 'Ankundigung',
		by: 'von'
	},
	ui: {
		selected: 'Ausgewahlt'
	},
	dialog: {
		editing: 'Bearbeitung',
		confirm: 'Bestatigen',
		cancel: 'Abbrechen'
	},
	confirm: {
		deleteSentence: 'Mochtest du diesen Satz wirklich loschen?',
		new: 'Mochtest du wirklich eine neue Illustration erstellen? Dadurch wird alles geloscht.'
	},
	menu: {
		new: 'Neu',
		import: 'Importieren',
		export: 'Exportieren',
		svg: 'SVG exportieren',
		png: 'PNG exportieren',
		scramble: 'Farben mischen'
	}
};

export default de;
