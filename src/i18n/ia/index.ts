import type { Translation } from '../i18n-types';

const ia: Translation = {
	meta: {
		title: 'Illustrator del ordine de parolas'
	},
	params: {
		options: 'Optiones',
		verticalGap: 'Spatio vertical',
		lineGap: 'Spatio inter lineas',
		straightLength: 'Parte recte',
		endpointCorrection: 'Correction del puncto final',
		textAlignment: 'Alignmento del texto',
		displayLanguage: 'Lingua del interfacie',
		text: 'Texto',
		fontFamily: 'Familia de typo',
		default: 'Predefinite',
		serif: 'Serif',
		sansSerif: 'Sans serif',
		monospace: 'Monospatiate',
		fontStyle: 'Stilo de typo',
		normal: 'Normal',
		italic: 'Italic',
		bold: 'Grasse',
		boldItalic: 'Grasse italic',
		fontSize: 'Dimension del typo'
	},
	input: {
		input: 'Entrata',
		placeholder: 'Insere un nove phrase hic…',
		add: 'Adder',
		modify: 'Modificar',
		guidance:
			'Le parolas es dividite automaticamente con segmentation sensibile al lingua quando disponibile, o per spatios e punctuation como reserva. Usa {delimiter} pro un controlo plus precise, per exemplo {example}'
	},
	tokenEditor: {
		tokens: 'Tokens',
		mergeSelected: 'Unir le selection',
		splitAtBoundary: 'Divider le token a iste limite',
		selectTokens: 'Selige token(s)'
	},
	footer: {
		info: 'Iste application non reclama derectos super le illustrationes que tu crea hic. Le modo de usar o compartir los es completemente a tu decision. Compartir iste instrumento es appreciabile.',
		githubRepository: 'Repositorio GitHub',
		announcement: 'Publication de annuncio',
		by: 'per'
	},
	ui: {
		selected: 'Selectionate'
	},
	dialog: {
		editing: 'Modification',
		confirm: 'Confirmar',
		cancel: 'Cancellar'
	},
	confirm: {
		deleteSentence: 'Es tu secur que tu vole deler iste phrase?',
		new: 'Es tu secur que tu vole crear un nove illustration? Isto delera toto.'
	},
	menu: {
		new: 'Nove',
		import: 'Importar',
		export: 'Exportar',
		svg: 'Exportar SVG',
		png: 'Exportar PNG',
		scramble: 'Miscer colores'
	}
};

export default ia;
