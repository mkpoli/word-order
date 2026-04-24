import type { Translation } from '../i18n-types';

const la: Translation = {
	meta: {
		title: 'Illustrator ordinis verborum'
	},
	params: {
		options: 'Optiones',
		verticalGap: 'Spatium verticale',
		lineGap: 'Spatium linearum',
		straightLength: 'Pars recta',
		endpointCorrection: 'Correctio extremi puncti',
		textAlignment: 'Ordinatio textus',
		displayLanguage: 'Lingua interfaciei',
		text: 'Textus',
		fontFamily: 'Familia litterarum',
		default: 'Praedefinitum',
		serif: 'Serif',
		sansSerif: 'Sine serif',
		monospace: 'Latitudo aequa',
		fontStyle: 'Stilus litterarum',
		normal: 'Normalis',
		italic: 'Italicum',
		bold: 'Crassum',
		boldItalic: 'Crassum italicum',
		fontSize: 'Magnitudo litterarum'
	},
	input: {
		input: 'Ingressus',
		placeholder: 'Novam sententiam hic scribe…',
		add: 'Adde',
		modify: 'Muta',
		guidance:
			'Verba automatice dividuntur segmentatione linguae apta ubi praesto est, aliter spatiis et interpunctione. Utere {delimiter} ad subtiliorem potestatem, exempli gratia {example}'
	},
	tokenEditor: {
		tokens: 'Signa',
		mergeSelected: 'Electa coniunge',
		splitAtBoundary: 'Signum in hoc limite divide',
		selectTokens: 'Signa elige'
	},
	footer: {
		info: 'Haec applicatio iura in illustrationes hic creatas sibi non vindicat. Quomodo eas utaris aut communices omnino a te pendet. Hoc instrumentum communicare gratum est.',
		githubRepository: 'Repositorium GitHub',
		announcement: 'Nuntium annuntiationis',
		by: 'a'
	},
	ui: {
		selected: 'Electum'
	},
	dialog: {
		editing: 'Editio',
		confirm: 'Confirma',
		cancel: 'Cancella'
	},
	confirm: {
		deleteSentence: 'Visne certe hanc sententiam delere?',
		new: 'Visne certe novam illustrationem creare? Hoc omnia delebit.'
	},
	menu: {
		new: 'Novum',
		import: 'Importa',
		export: 'Exporta',
		svg: 'Exporta SVG',
		png: 'Exporta PNG',
		scramble: 'Colores misce'
	}
};

export default la;
